# J.A.R.V.I.S. Doc Pack

## What this zip contains
This pack is intended to be dropped into the project root and used with Antigravity + Codex to inspect, correct, harden, and polish the app without damaging the current premium UI.

## Suggested destination paths
Place these files into the project root exactly as packaged:
- `AGENTS.md`
- `MASTER_INSPECTION.md`
- `BUILD_AND_CORRECTION_PLAN.md`
- `PROMPTS_INDEX.md`
- `docs/*`
- `prompts/*`

## Suggested workflow
1. drop this pack into the project root
2. start with `PROMPTS_INDEX.md`
3. run prompt 01 first
4. execute prompts in order unless a verified blocker requires reprioritization
5. after each prompt, demand receipts: `npm run lint` and `npm run build`
6. finish with the final release-readiness pass
