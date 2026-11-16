# Feature map

Everything a visitor can reach in the demo, from their side. The whole app is
one page (`/`) and one route behind it (`POST /api/extract`).

| Feature | Where | How to reach it | How to check it works |
|---|---|---|---|
| See what the demo does | `/` | Open the page | Title is "Field photos demo — Vivancedata"; the heading reads "The right note on the right job" and the intro says nothing submitted is stored. |
| Edit today's open jobs | `/`, "Today's open jobs" box | Type in the box (it starts filled with the fictional sample job list) | The box starts with `JOB-4471 \| Harwood St duplex reframe …`; typed text replaces it and is what the match runs against. |
| Told what to add before matching | `/`, under "Match it to a job" | Open the page with no note and no photo | "Match it to a job" is disabled and the hint "Add a field photo, or paste the note that came with it." shows under it. |
| Paste your own field note | `/`, "Field note" box | Type or paste into "Paste a field note here…" | "Match it to a job" becomes enabled. |
| Load the sample field note | `/`, "Sample field note" button | Click "Sample field note" | The note box fills with text starting `[SAMPLE FIELD NOTE -- fictional]` (Millbrook site, one unreadable word, a torn corner) and matching is enabled. |
| Attach a photo of your own | `/`, "Photo of your own…" button | Click it and choose a JPEG, PNG or WebP | The file name shows with a "remove" link, the note box is replaced by the photo, and matching is enabled. |
| Remove an attached photo | `/`, "remove" next to the file name | Click "remove" | The file name goes away and the field-note box comes back. |
| Told a file type is unsupported | `/`, "Photo of your own…" | Choose a file that is not JPEG, PNG or WebP (e.g. a GIF) | The message "That file type is not supported. Choose a JPEG, PNG or WebP photo." appears and nothing is attached. |
| Match a note or photo to a job | `/`, "Match it to a job" button | Load the sample note (or a photo), click "Match it to a job" | Needs `ANTHROPIC_API_KEY` on the server. With it: the button shows "Reading…", then a card shows the confidence ("Matched", "Tentative — confirm before filing" or "No confident match"), the job id and the quoted evidence, then Summary, People, Materials / equipment, Follow-ups, and a "Flagged, not guessed" list for illegible parts. The sample note should match `JOB-4478` and flag the unreadable word. Without the key: the message "The demo is offline: ANTHROPIC_API_KEY is not configured on the server…" appears instead. |
| Visit Vivancedata | `/`, footer | Click "Vivancedata" in "Built by Vivancedata" | Opens `https://www.vivancedata.com`. |
