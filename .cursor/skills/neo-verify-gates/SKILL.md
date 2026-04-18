---
name: neo-verify-gates
description: >-
  Runs and interprets N.E.O. verification commands from the repo root (npm ci,
  npm run lint as tsc --noEmit, npm run build as Vite production build) and
  lists manual auth, task, chat, and protected-AI checks. Use after non-trivial
  changes, before claiming work is done, or when the user asks whether the
  project is healthy.
---
# N.E.O. verification gates

All commands from **repository root** (directory containing `package.json`).

## Commands (in order)

1. **`npm ci`** — Prefer when `package-lock.json` must match exactly. If CI/sandbox forbids clean install or lockfile is missing, use **`npm install`** instead and note that in the output.
2. **`npm run lint`** — TypeScript: `tsc --noEmit`.
3. **`npm run build`** — Vite production build (`vite build`); expect `dist/` (or Vite’s configured `outDir`).

## Manual checklist (report pass / fail / not run)

- **Sign-in**: Google (or whatever auth is configured) completes end-to-end.
- **Tasks**: list, create, update, delete as applicable to the change.
- **Messages / history**: load and send where relevant.
- **Protected AI**: calls succeed only while signed in; **401** (or documented behavior) when unauthenticated.

## Output format

- **Commands**: exact command lines run, **exit codes**, and short excerpts of the first actionable error if any step fails.
- **Artifacts**: e.g. whether `dist/` was produced after a successful build.
- **Results**: bullet list separating **automated** (the three npm steps) and **manual** (checklist above).
- **Skipped steps**: if a command or manual check was not run, state **why** and label **risk** (what could break undetected).
