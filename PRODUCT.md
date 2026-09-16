# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner or office manager of a trade or local-services business —
construction, HVAC and plumbing, logistics, small manufacturing — evaluating
Vivancedata before paying for anything. They arrive from a link on
vivancedata.com, often on a phone between jobs, and have usually been sold
software before that never got installed. They give this page under a minute.

The second reader is whoever currently reconciles what came back from site
with the job it belongs to: a pile of photographs, signed slips and scrawled
notes that have to be matched to jobs by hand at the end of the day.

## Product Purpose

A one-page trial harness for a single Vivancedata service: **what comes back
from the field lands on the right job.** A visitor pastes a scrawled field
note — or photographs one, a signed slip, or the site itself — alongside the
day's job list, and the capture is matched to the job it belongs to with the
supporting evidence quoted.

Success is that the visitor believes the system will refuse to guess when the
evidence is thin, and books a call.

## Positioning

Two behaviours *are* the product, and both are refusals:

- **A wrong-job match is treated as the worst possible failure.** If the
  evidence does not support a single job, the answer is *no match* — never a
  best guess. A tentative match says that it is tentative and shows why.
- **Illegible content is flagged verbatim, not guessed at.** The bundled
  sample note carries a deliberately unreadable word and a torn corner so the
  behaviour is visible on the first click rather than asserted in a claim.

Matching a capture to the wrong job is worse than not matching it, because a
wrong match quietly corrupts a job record that someone will later bill from.
Competitors demo the happy path; this demo is built around the refusal.

## Operating Context

- Reached from the marketing site and from `field.vivancedata.com`. One of
  three sibling demos, alongside the after-hours call demo and the paperwork
  demo.
- Read on a phone, often outdoors on a poor connection.
- Real inputs are photographs taken one-handed on site, handwriting included,
  not clean typed text.
- The visitor is answering one question: "would this put my photo on the
  wrong job?"

## Capabilities and Constraints

- Whole surface is one route (`src/app/page.tsx`) plus one API route
  (`src/app/api/extract/route.ts`). Around 500 lines total.
- Next.js App Router, React, Tailwind, `@anthropic-ai/sdk`. All tokens and
  components come from `@vivancedata/ui`; `src/app/globals.css` adds only the
  Tailwind component and utility layers.
- Input is a job list plus a field note as text, or an uploaded JPEG, PNG or
  WebP.
- Output is a typed capture record: matched job id, match confidence, the
  reasoning behind the match, capture type, summary, people mentioned,
  materials or equipment, follow-ups, and a flagged-unreadable list.
- **It is not a product.** No accounts, no database, no server-side
  persistence; captures round-trip through the API and nothing is kept.
- Rate limited to 10 requests per IP per 10 minutes, in memory — deliberately
  not a billing guarantee, since a cold start or a second instance resets the
  counter. It exists to make abuse boring.
- The extraction API key lives in `.env.local` locally and in the Vercel
  project environment. Never read, printed or committed.
- Deployed on Vercel.

## Brand Commitments

- The name is **Vivancedata**, one word, capital V. The "VivanceData"
  spelling still present in this app's page title, eyebrow and footer link is
  a defect, not a variant.
- Voice is first person singular and names the job, not the technology,
  matching the marketing site's hero register.
- Visual language is the shared `@vivancedata/ui` contract: ink on a sheet,
  depth as a hairline, one green accent. This app ships **dark only** —
  `layout.tsx` hard-codes `class="dark"` and there is no toggle.
- Each demo takes one hue from the chart ramp for its page mark so the three
  read as siblings. This one is `--chart-3`.

## Evidence on Hand

- Bundled fictional sample job list and field note in `src/lib/samples.ts`.
  Both declare they are fictional in their first line, and the note is
  deliberately defective so the flagging behaviour shows.
- The live deployment at `field.vivancedata.com`.

**Absences that must never be fabricated:** no real job records, no client
photographs, no match-accuracy percentage, no volume or customer count, no
testimonial, no certification. Any number shown must be derived from what the
visitor just submitted.

## Product Principles

1. **Refusing is the feature.** No match and flagged-unreadable are correct
   outcomes, not error states, and the interface should present them with the
   same confidence as a successful match.
2. **Show the evidence, not just the verdict.** A match a visitor cannot
   audit is a match they will not trust with a job record.
3. **Prove on their capture, not ours.** Samples exist to reach the result
   state fast; persuasion happens when they paste their own note.
4. **Say what happens to their data** at the moment they hand it over.
5. **A demo that never converts is decoration.** Offer the next step at the
   moment the visitor is most convinced.

## Accessibility & Inclusion

WCAG 2.1 AA is the floor. The page is read on a phone in daylight and ships
dark-only, so contrast on the dark sheet carries the whole burden. Per the
shared token contract the `mute` and `faint` greys are decorative and must
never carry copy a visitor has to read, including hint copy explaining why a
control is disabled.
