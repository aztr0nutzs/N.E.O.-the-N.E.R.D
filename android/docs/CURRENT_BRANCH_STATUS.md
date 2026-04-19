# CURRENT_BRANCH_STATUS.md

## Current branch state summary
Treat this document as describing the **current** repo: Supabase-backed auth and data, Capacitor-ready Android, and **2D-first** UI policy.

### Verified branch truths
- `Robot2D` is active in `src/App.tsx`
- `Robot3D` is parked and marked on hold
- split neural hooks exist
- server AI routes are protected and validated
- **Supabase** Google auth is active (web and native/Capacitor flows per `src/authClient.ts`)
- lint/build were verified green in the latest strong inspection state for this branch

## Remaining likely work categories
- stale/dead code cleanup
- server validation tightening
- polish of 2D robot experience
- performance tuning of main bundle and motion loops
- logging cleanup

## What this branch should not become
- a 3D experiment branch
- a broad UI redesign branch
- a feature-sprawl branch
