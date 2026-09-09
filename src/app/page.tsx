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

  const canExtract = !busy && (text.trim().length > 0 || image !== null);
  const disabled = !canExtract;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-label uppercase text-mute">
        Vivancedata demo — what comes back from the field
      </p>
      <h1 className="mt-4 font-display text-serif-lg text-balance">
        The right note on the right job
      </h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Photos, signed slips and scrawled field notes, matched to the job they
        belong to. A wrong-job match is the worst failure a system like this can
        produce — so no confident match means <em>no</em> match, and anything
        illegible is flagged, not guessed at. Nothing you submit is stored.
      </p>

      <div className="mt-10 rounded-md border border-border bg-card p-6">
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
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => { setText(SAMPLE_NOTE); setImage(null); setCapture(null); }}
          >
            Sample field note
          </button>
          <button
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
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
            <button className="text-foreground underline decoration-rule underline-offset-4 hover:decoration-current" onClick={() => setImage(null)}>
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
          className={`mt-4 inline-flex min-h-11 items-center rounded-md px-4 text-label uppercase transition-colors ${disabled
            ? "border border-rule text-mute"
            : "bg-primary text-primary-foreground hover:bg-primary/85"}`}
          disabled={disabled}
          onClick={extract}
        >
          {busy ? "Reading…" : "Match it to a job"}
        </button>
        {/* The other half of a hollow control is saying what fills it. */}
        {disabled && !busy ? (
          <p className="mt-3 text-caption text-mute">Add a field photo, or paste the note that came with it.</p>
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
              <h3 className="text-label uppercase text-foreground">
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

      <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
        Built by{" "}
        <a className="text-foreground underline decoration-rule underline-offset-4 hover:decoration-current" href="https://www.vivancedata.com">
          Vivancedata
        </a>{" "}
        — the same matching, run on your own field captures before you pay for a build.
      </footer>
    </main>
  );
}
