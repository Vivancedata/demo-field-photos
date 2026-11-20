# demo-field-photos

## Agent skills

### Issue tracker

GitHub Issues on `Vivancedata/demo-field-photos`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Checks

`npm run verify` (lint, `tsc --noEmit`, Vitest unit tests, production build) must pass before a PR is opened; CI runs it plus a Playwright smoke test (`npm run build && npm run test:e2e`). Unit tests stub the Anthropic API, so no key is needed. Fix the code, not the test, when a check fails.
