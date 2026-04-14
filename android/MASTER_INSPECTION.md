# MASTER_INSPECTION.md

## Purpose
This document defines the **required deep inspection procedure** for the `neo_final` branch.

This branch is already in a good state. Inspection work must therefore focus on:
- regressions
- stale/dead code
- hidden branch confusion around 2D vs 3D robot paths
- server hardening gaps
- polish blockers
- performance debt

## Critical branch facts to verify every time
1. `src/App.tsx` still renders `Robot2D` as the live center robot.
2. `Robot3D` is not active in the live UI.
3. `npm run lint` passes.
4. `npm run build` passes.
5. `/api/ai/*` routes remain server-routed, rate-limited, and auth-protected.
6. The client still uses real Firebase ID tokens for protected AI calls.
7. No client-side Gemini API key path has been reintroduced.
8. Protected UI composition remains intact.

## Strict inspection rules
- **Do not modify files during inspection.**
- **Do not assume a file is dead merely because it looks suspicious. Trace imports and use paths.**
- **Do not report a regression unless it is verified by code path, command output, or asset absence.**
- **Do not claim a feature is working just because the code looks plausible.**
- **Do not ignore branch intent.** This is the stable 2D branch.

## Required inspection outputs
Every inspection report must include:
1. Overall score out of 10
2. Category scores
3. Verified passes
4. Verified blockers
5. File-by-file findings
6. Exact recommended next actions in priority order
7. Verification receipts

## Category scoring framework
### Build Integrity
Check:
- `npm ci`
- `npm run lint`
- `npm run build`

### Architecture / Separation
Check:
- server/client boundary
- route ownership
- whether branch intent is cleanly represented
- whether split hooks remain separated by concern

### AI / Server Boundary
Check:
- `/api/ai/chat`
- `/api/ai/image`
- `/api/ai/video`
- `/api/ai/video-status/:id`
- rate limiting
- auth enforcement
- validation strictness

### Firebase / Auth
Check:
- redirect-based login flow
- token retrieval before protected AI calls
- sign-out path
- Firestore error handling

### UI / Visual Stability
Check:
- center layout unchanged
- side panels unchanged structurally
- 2D robot still active
- no generic redesign drift

### Cleanup / Code Hygiene
Check:
- unused imports
- dead parked code
- stale comments/copy
- misleading fallback text
- duplicate helpers

### Performance / Bundle Health
Check:
- major bundle chunks
- heavy imports
- lazy loading behavior
- motion/media loops

## Mandatory file targets
Always inspect at minimum:
- `src/App.tsx`
- `src/components/Robot2D.tsx`
- `src/components/Robot3D.tsx`
- `src/components/ChatInterface.tsx`
- `src/firebase.ts`
- `server.ts`
- `src/hooks/useNeuralSystems.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useMediaStream.ts`
- `src/hooks/useMotionDetection.ts`
- `src/context/NeuralContext.tsx`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`

## High-priority questions
During every inspection, answer these explicitly:
1. Is `Robot2D` still the active center robot?
2. Has any code path reintroduced `Robot3D` into runtime?
3. Are there any remaining stale references that imply 3D is active?
4. Are protected AI routes still secure?
5. Is server validation still strict enough?
6. Do lint and build both pass?
7. Did any cleanup/regression alter protected UI framing?

## Automatic blockers
Mark as blocker immediately if any of the following are found:
- `Robot3D` re-enabled in live UI without explicit branch change
- `npm run lint` fails
- `npm run build` fails
- auth removed from `/api/ai/*`
- client secret exposure reintroduced
- fake anonymous token fallback reintroduced
- protected UI composition materially changed without explicit approval

## Default recommendation posture
Because this branch is already good, default recommendations should be:
- surgical
- minimally invasive
- file-specific
- verification-backed

Do not recommend broad rewrites unless inspection proves structural failure.
