---
name: neo-verify-gates
description: >-
  Runs N.E.O. automated verification from the repo root (npm ci, npm run lint as
  tsc --noEmit, npm run build as Vite production build), interprets exit codes
  and errors, and enumerates manual auth/data/AI checks with pass/fail. Use
  after non-trivial changes, before claiming work is done, when the user asks
  whether the project is healthy, or when validating a PR or release candidate.
---

# N.E.O. verification gates

## When to use

Apply after substantive code or config changes, before stating that work is complete, or when the user wants a health or readiness check.

## Automated gates (repo root)

Run in order from the repository root. Record the exact command, exit code, and any decisive stderr/stdout lines.

1. **`npm ci`** — Prefer for a clean install when `package-lock.json` must be respected. If the environment forbids a full reinstall (e.g. no network, user asked to skip, or CI already installed deps), use **`npm install`** instead and note **why** (counts as skipped gate → **risk**).
2. **`npm run lint`** — TypeScript only: `tsc --noEmit` (see `package.json` `lint` script).
3. **`npm run build`** — Vite production build (`vite build`); expect output under `dist/` when successful.

If a command fails, capture the failure class (e.g. type error, missing module, Vite config) before proceeding; optional: run later steps only if useful for a fuller picture, and always report earlier failures.

## Manual checklist (state pass / fail / not tested)

The agent cannot complete these without a running app and credentials; mark **not tested** with **risk** unless the user confirms.

- **Sign-in**: Google (or whatever auth the deployment uses) completes end-to-end.
- **Tasks**: List, create, update, and delete as applicable to the change.
- **Messages / history**: Load history and send a message where relevant.
- **Protected AI**: Call AI routes only while signed in; confirm **401** (or equivalent) when not signed in.

## Reporting format

Use this structure so results are scannable:

```markdown
## N.E.O. verification

### Commands
| Command | Exit | Notes |
|--------|------|-------|
| ... | ... | ... |

### Artifacts
- e.g. `dist/` present / absent; any unexpected paths.

### Automated
- **npm ci** / **npm install**: pass \| fail \| skipped (why) — risk if skipped inappropriately
- **lint**: pass \| fail
- **build**: pass \| fail

### Manual
- Sign-in: pass \| fail \| not tested
- Tasks: …
- Messages/history: …
- Protected AI / 401: …

### Skipped or risky
- List anything not run or not tested and **why**; flag **risk** when verification is incomplete.
```

## Principles

- Prefer running the commands in this environment rather than only instructing the user.
- Do not claim the project is “green” if automated gates failed or manual checks were not tested without labeling **risk**.
