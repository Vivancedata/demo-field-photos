# demo-field-photos

A live demo of one VivanceData service: **what comes back from the field lands
on the right job**. Paste a scrawled field note — or photograph one, or a
signed slip, or the site itself — alongside the day's job list, and the
capture is matched to the job it belongs to, with the evidence quoted.

Two behaviours are the product:

- **A wrong-job match is treated as the worst possible failure.** If the
  evidence doesn't support a single job, the answer is *no match* — never a
  guess. Tentative matches say so.
- **Illegible content is flagged verbatim, not guessed at.** The bundled
  sample note has a deliberately unreadable word and a torn corner so that
  behaviour shows on the first click.

Everything in the sample job list and note is fictional, and says so in its
first line. No accounts, no storage — captures round-trip through
`/api/extract` and nothing persists server-side.

## Run it

```bash
npm install
cp .env.example .env.local   # add a real ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

## How it works

One route handler sends the job list plus the capture (text or image) to
Claude (`claude-opus-5`) with a JSON Schema enforced via `output_config`, so
the response always parses against `src/lib/schema.ts`. The system prompt
requires quoted evidence for any match and makes "none" an always-acceptable
answer.

Sibling demo: [demo-paperwork](https://github.com/Vivancedata/demo-paperwork).
Both render in [@vivancedata/ui](https://github.com/Vivancedata/ui), the same
design system as [vivancedata.com](https://www.vivancedata.com).
