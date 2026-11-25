# demo-field-photos

## How we work

`.claude/settings.json` loads four plugins from the `lorenzos-claude-code`
marketplace (gr8monk3ys/skills), in every clone and every cloud session. Use
them every time, not only when one happens to trigger:

- **Matt Pocock's skills** (`mattpocock-skills`) for the engineering process:
  `grilling` before building something new, `tdd` for any behaviour change,
  `diagnosing-bugs` for bugs, `code-review` before calling work done and `pr`
  for the PR body. Prefer them over overlapping skills from other plugins.
- **Impeccable** for any UI, layout, styling or on-screen copy: run
  `/impeccable critique` or `/impeccable audit` on it before you're done.
- **Ponytail** is always on: the simplest code that works, no unrequested
  abstractions or dependencies. Run `ponytail-review` on the diff before
  opening a PR and cut what the task didn't need.
- **Tests:** `./scripts/verify` is the fast gate (`npm run verify` minus the
  production build: lint, types, Vitest unit tests; no API key). A hook runs
  it before a session can finish and won't let it end while it fails. Still
  run `npm run verify` before a PR, as "Checks" says. Never skip, weaken or
  delete a test to get it green.

## Agent skills

### Issue tracker

GitHub Issues on `Vivancedata/demo-field-photos`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Checks

`npm run verify` (lint, `tsc --noEmit`, Vitest unit tests, production build) must pass before a PR is opened; CI runs it plus a Playwright smoke test (`npm run build && npm run test:e2e`). Unit tests stub the Anthropic API, so no key is needed. Fix the code, not the test, when a check fails.
