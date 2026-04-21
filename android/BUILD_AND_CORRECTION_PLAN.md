# BUILD_AND_CORRECTION_PLAN.md

## Branch target
This plan is specifically for the current **stable 2D `neo_final` branch**.

## Mission
Polish the app from top to bottom **without changing protected layout/composition** and without reactivating the 3D robot path.

## Current branch posture
### Stable enough to proceed
- `Robot2D` is live
- split neural hooks exist
- server AI routes are protected
- redirect auth is active
- lint/build passed in the last clean inspection for this branch

### Remaining work is mostly
- cleanup
- hardening
- polish
- performance tuning

## Phase 0 - Freeze branch intent
### Goal
Make the branch identity impossible to misunderstand.

### Actions
- Keep `Robot2D` authoritative.
- Keep `Robot3D` parked/on hold.
- Preserve center layout framing exactly.
- Preserve left/right panel positions and bottom dock placement.

### Verification
- `src/App.tsx` still renders `Robot2D`
- no runtime import path to `Robot3D`

## Phase 1 - Read-only inspection
### Goal
Collect receipts before changing anything.

### Actions
- inspect core files
- identify dead/stale code
- identify unused imports
- identify stale 3D references
- identify remaining validation gaps
- identify any build or lint warnings

### Deliverable
- issue list by file
- priority-sorted action list

## Phase 2 - Safe cleanup
### Goal
Remove confusion and dead weight without touching layout or behavior.

### Actions
- quarantine or rename `Robot3D.tsx` if still in-tree
- remove any unused `Robot3D` imports
- update stale fallback copy in `Robot3D.tsx`
- remove dead comments and dead helpers
- remove unused imports

### Must not do
- no layout changes
- no theme changes
- no panel movement
- no robot redesign

## Phase 3 - Server hardening
### Goal
Tighten security and validation without changing successful behavior.

### Actions
- tighten `systemInstruction` validation
- tighten `responseModalities` validation
- tighten `speechConfig` validation
- tighten tool object validation
- tighten image/video config validation
- confirm client-facing errors stay generic

### Success criteria
- routes remain functional
- invalid payloads fail cleanly
- auth/rate limiting remain intact

## Phase 4 - Client robustness pass
### Goal
Make the UI behave cleanly under auth/network failures.

### Actions
- verify all protected AI actions handle missing auth cleanly
- verify all server error cases render clean user-facing messages
- verify chat/image/video UI states do not hang on failure
- verify Supabase sign-in/out transitions are smooth (web and native)

## Phase 5 - UI polish pass
### Goal
Polish the existing design without changing protected composition.

### Allowed work
- improve `Robot2D` finish
- refine glow and pulse behavior
- improve hover/hotspot affordance
- improve panel readability
- improve typography spacing and density
- refine micro-animations and scanline effects
- improve chat field polish and responsiveness

### Forbidden work
- no major layout redesign
- no center frame rebuild
- no panel reshuffle
- no 3D reactivation
- no generic dashboard restyle

## Phase 6 - Performance pass
### Goal
Reduce weight and improve responsiveness.

### Actions
- audit main chunk contributors
- lazy-load noncritical areas where safe
- trim heavy imports in app shell
- profile motion/media update frequency
- verify no unnecessary rerenders in robot/visualizer paths

## Phase 7 - Final verification gate
### Required commands
```bash
npm ci
npm run lint
npm run build
```

### Required runtime checks
- login flow
- start systems flow
- chat send flow
- image generation flow
- video generation flow
- sign-out flow
- 2D robot panel renders correctly
- no 3D path active

## Priority order summary
1. Freeze branch intent
2. Inspect read-only
3. Safe cleanup
4. Server hardening
5. Client robustness
6. UI polish
7. Performance pass
8. Full verification
