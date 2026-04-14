# BUILD_AND_CORRECTION_PLAN.md

## Objective
Finish the J.A.R.V.I.S. Interface app without damaging its premium UI. The project is already in a strong refinement phase. The remaining work is hardening, cleanup, performance tuning, and controlled polish.

## Working assumptions
- The current version already includes `public/robot_model.glb`.
- Protected AI flows remain server-routed.
- `npm run lint` and `npm run build` should remain green after every task.
- No task should flatten or simplify the current UI.

## Execution order

### Phase 1. Freeze the visual contract and verify the base
**Goal:** establish a trustworthy baseline before touching logic.

Tasks:
1. archive current screenshots of key views
2. run `npm ci`, `npm run lint`, `npm run build`
3. capture build chunk sizes
4. note current console warnings/errors in dev
5. confirm `robot_model.glb` loads successfully

Success criteria:
- baseline receipts captured
- no untracked visual regressions during later phases

---

### Phase 2. Harden `server.ts`
**Goal:** make the AI gateway stricter, safer, and easier to trust.

Tasks:
1. tighten validation for `systemInstruction`
2. strictly validate `responseModalities`
3. sanitize `speechConfig` more aggressively
4. validate allowed tool object shapes only
5. validate image/video config objects with explicit allowlists
6. ensure consistent generic client-facing error messages
7. keep detailed logs server-side only

Success criteria:
- malformed inputs rejected cleanly
- valid requests still work
- auth and rate limiting remain intact

---

### Phase 3. Reduce 3D/performance cost without losing the 3D assistant
**Goal:** keep the premium assistant viewport while reducing browser weight.

Tasks:
1. profile GLB size and R3F chunk size
2. lazy-load `Robot3D` only when panel is visible
3. audit Drei/Three imports for unnecessary weight
4. update stale fallback copy to reflect real failure modes
5. keep current visuals and interaction feel intact

Success criteria:
- `Robot3D` still works
- fallback copy no longer wrongly says the asset is missing
- chunking or load behavior improves measurably

---

### Phase 4. Clean `ChatInterface.tsx`
**Goal:** reduce complexity without changing the visible UX contract.

Tasks:
1. separate request-building helpers from JSX
2. separate AI route callers into focused helpers
3. remove stale/dead logic and unused imports
4. keep mode behavior, personas, and persistence intact
5. preserve all current controls and panel density

Success criteria:
- same UI and behavior
- smaller, easier-to-read component structure
- no dead code remains from the refactor

---

### Phase 5. Finalize the neural subsystem split
**Goal:** complete maintainability polish after the hook decomposition.

Tasks:
1. trim dev logging volume
2. confirm cleanup paths remain correct after split
3. prevent accidental double-start of systems
4. keep motion/audio/speech orchestration explicit
5. confirm no regressions in transcript, audio data, or motion-driven user position

Success criteria:
- slimmer orchestration hook
- stable media cleanup
- less console noise in dev

---

### Phase 6. Clean Firebase/persistence edges
**Goal:** keep persistence behavior, but improve correctness and ergonomics.

Tasks:
1. remove stale imports and low-value noise
2. keep cleaner app-facing Firestore errors
3. ensure auth failure states are surfaced cleanly in UI
4. verify message/task Firestore paths still behave correctly

Success criteria:
- no persistence regression
- clearer user-facing failures
- no stale imports or dead auth logic

---

### Phase 7. Final polish and release readiness pass
**Goal:** ship a trustworthy refined build.

Tasks:
1. run full inspection again
2. remove any dead code created during corrections
3. verify no UI regression against baseline screenshots
4. run final `npm ci`, `npm run lint`, `npm run build`
5. produce final scorecard and remaining-risk list

Success criteria:
- green verification commands
- no meaningful UI regressions
- known risks are documented and finite

## Must-not-break list
- premium futuristic HUD styling
- dense panel layout
- persona switching
- chat persistence
- TTS route and fallback
- server-routed AI boundary
- 3D assistant viewport
- auth-gated AI requests

## Definition of done
The app is considered ready for the next stage when:
- lint passes
- build passes
- core AI routes remain functional
- `Robot3D` remains intact
- stale/dead code is trimmed
- server validation is tightened
- performance is improved or at least no worse
- UI parity is preserved
