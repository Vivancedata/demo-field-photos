"use client";

import { useRef, useState } from "react";
import { SAMPLE_JOBS, SAMPLE_NOTE } from "@/lib/samples";
import type { FieldCapture } from "@/lib/schema";

type ImagePayload = { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const CONFIDENCE_LABEL: Record<FieldCapture["match_confidence"], string> = {
  high: "Matched",
  low: "Tentative — confirm before filing",
  none: "No confident match",
};

/**
 * The frame mark is this demo's signature. All three VivanceData demos share one
 * shell -- black ground, green mono eyebrow, a paste box -- which made them
 * indistinguishable from each other in a tab strip. The mark names the input
 * (a photo from the field), and `--chart-3` tints it: the chart ramp is the same
 * green-to-cyan family as the brand and the hero mesh, so the three demos read
 * as siblings rather than as three unrelated pages.
 */
const PageMark = () => (
  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-chart-3" fill="none" aria-hidden="true">
    <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.5 12.75 6.25 9.5l2.75 2.25 3-3.25 5.5 4.75" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="6.75" cy="7.75" r="1.15" fill="currentColor" />
  </svg>
);

const Spinner = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-spin" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * The primary action carries the brand green the eyebrow already uses.
 *
 * It used to be `bg-primary ... disabled:opacity-50`. In dark mode `--primary`
 * is a near-white pill, so at 50% on a black sheet it landed as flat mid-grey --
 * and because the page loads with an empty box, that half-dead grey was the
 * FIRST thing anyone saw. The control was not broken, but it looked it.
 *
 * Six states, each distinguishable from the others by more than opacity:
 *   idle      solid brand green fill
 *   hover     brightened
 *   active    dimmed, nudged 1px down
 *   focus     a light ring, offset clear of the card
 *   busy      still green but dimmed, with a spinner -- work in flight
 *   disabled  hollow: hairline border, no fill, muted label, plus a line of
 *             copy saying what would turn it on
 */
const ACTION_BASE =
  "mt-4 inline-flex min-h-10 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card";
const ACTION_IDLE =
  "bg-brand text-brand-foreground hover:brightness-110 active:translate-y-px active:brightness-95";
const ACTION_BUSY = "cursor-progress bg-brand/70 text-brand-foreground";
const ACTION_OFF = "cursor-not-allowed border border-border bg-transparent text-mute";

/* Sample chips are real buttons and were already tabbable, but had no focus
 * style at all -- keyboard users could not see where they were. */
const CHIP =
  "rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

export default function Home() {
  const [jobs, setJobs] = useState(SAMPLE_JOBS);
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ payload: ImagePayload; name: string } | null>(null);
  const [capture, setCapture] = useState<FieldCapture | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    if (!MEDIA_TYPES.includes(file.type as (typeof MEDIA_TYPES)[number])) {
      setError("JPEG, PNG or WebP only.");
      return;
    }
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    setImage({
      payload: { media_type: file.type as ImagePayload["media_type"], data: btoa(binary) },
      name: file.name,
    });
    setText("");
    setError(null);
  }

  async function extract() {
    setBusy(true);
    setError(null);
    setCapture(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(image ? { jobs, image: image.payload } : { jobs, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setCapture(data.record);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed.");
    } finally {
      setBusy(false);
    }
  }

  const hasInput = text.trim().length > 0 || image !== null;

  return (
    <>
      {/* flex-1 + justify-center: the card used to sit in the top third with
          the rest of the viewport left as void. Centring it and pinning the
          footer as a band makes the page look composed rather than truncated.
          `flex-1` in a column will not shrink below its content, so a long
          result still lays out top-down and scrolls normally. */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <div className="flex items-center gap-2.5">
        <PageMark />
        <p className="font-mono text-xs uppercase tracking-widest text-brand">
          VivanceData demo — what comes back from the field
        </p>
      </div>
      <h1 className="mt-4 text-display text-balance">
        The right note on the right job
      </h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Photos, signed slips and scrawled field notes, matched to the job they
        belong to. A wrong-job match is the worst failure a system like this can
        produce — so no confident match means <em>no</em> match, and anything
        illegible is flagged, not guessed at. Nothing you submit is stored.
      </p>

      <div className="mt-10 rounded-md border border-t-2 border-border border-t-chart-3/60 bg-card p-6">
        <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Today&apos;s open jobs
        </label>
        <textarea
          className="mt-2 h-28 w-full resize-y rounded-md border border-border bg-background p-4 font-mono text-sm"
          value={jobs}
          onChange={(e) => { setJobs(e.target.value); setCapture(null); }}
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className={CHIP}
            onClick={() => { setText(SAMPLE_NOTE); setImage(null); setCapture(null); }}
          >
            Sample field note
          </button>
          <button
            className={CHIP}
            onClick={() => fileInput.current?.click()}
          >
            Photo of your own…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </div>

        {image ? (
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            {image.name}{" "}
            <button
              className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              onClick={() => setImage(null)}
            >
              remove
            </button>
          </p>
        ) : (
          <textarea
            className="mt-4 h-40 w-full resize-y rounded-md border border-border bg-background p-4 font-mono text-sm"
            placeholder="Paste a field note here…"
            value={text}
            onChange={(e) => { setText(e.target.value); setCapture(null); }}
          />
        )}

        <button
          className={`${ACTION_BASE} ${busy ? ACTION_BUSY : hasInput ? ACTION_IDLE : ACTION_OFF}`}
          disabled={busy || !hasInput}
          aria-busy={busy}
          onClick={extract}
        >
          {busy ? <Spinner /> : null}
          {busy ? "Reading…" : "Match it to a job"}
        </button>
        {!busy && !hasInput ? (
          <p className="mt-3 text-sm text-mute">
            Paste a field note, take the sample above, or attach a photo, and this turns on.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      {capture ? (
        <section className="mt-10">
          <div className="rounded-md border border-border p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {CONFIDENCE_LABEL[capture.match_confidence]}
            </p>
            <p className="mt-2 text-heading-2">
              {capture.matched_job_id || "—"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{capture.match_reasoning}</p>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {(
              [
                ["Summary", [capture.summary]],
                ["People", capture.people_mentioned],
                ["Materials / equipment", capture.materials_or_equipment],
                ["Follow-ups", capture.follow_ups],
              ] as const
            ).map(([label, items]) => (
              <div key={label} className="rounded-md border border-border p-4">
                <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="mt-2 space-y-1 text-sm">
                  {items.length ? items.map((it, i) => <p key={i}>{it}</p>) : <p>—</p>}
                </dd>
              </div>
            ))}
          </dl>

          {capture.flagged_as_unreadable.length > 0 ? (
            <div className="mt-6 rounded-md border border-border p-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-brand">
                Flagged, not guessed
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {capture.flagged_as_unreadable.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted-foreground">
          Built by{" "}
          <a
            className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            href="https://www.vivancedata.com"
          >
            VivanceData
          </a>{" "}
          — the same matching, run on your own field captures before you pay for a build.
        </div>
      </footer>
    </>
  );
}
