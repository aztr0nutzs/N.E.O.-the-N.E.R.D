# AGENTS.md

## Project Identity
This repository is the **stable 2D polish branch** of the J.A.R.V.I.S./NERD interface app.

### Authoritative branch truths
- The live center robot in this branch is **`Robot2D`**.
- **`Robot3D` is on hold** and must not be re-enabled in this branch.
- The center framing, composition, and panel placement are considered **protected UI structure**.
- This branch is intended for **hardening, cleanup, performance tuning, and visual polish**, not feature churn or layout redesign.

## Mission for any coding agent
Make the app more stable, cleaner, and more polished **without changing the protected UI composition**.

## Non-negotiable rules
1. **Do not re-enable `Robot3D` in this branch.**
2. **Do not alter the center layout framing or panel arrangement.**
3. **Do not replace the visual identity with a generic dashboard or card layout.**
4. **Do not remove existing cyber/industrial styling unless explicitly tasked.**
5. **Do not introduce speculative architecture changes unless the task specifically requires them.**
6. **Do not perform broad refactors and polish in the same pass.** Keep tasks scoped.
7. **Do not claim build success without actually running verification commands.**
8. **Do not delete code that is still imported or still used by runtime paths.**
9. **Do not touch server auth/security logic casually.** Treat those routes as protected.
10. **Do not reintroduce anonymous or unauthenticated AI request behavior.**

## Required working style
For any non-trivial task, follow this sequence:
1. Read the relevant files first.
2. Explain the real current behavior.
3. State exactly what will change and what will not.
4. Implement the smallest correct change.
5. Run only the relevant verification commands.
6. Report results with file-by-file receipts.

## Protected UI areas
The following areas are protected and must not be restructured without explicit approval:
- `src/App.tsx` overall screen composition
- center robot frame and hotspot placement
- left and right side panel positions
- bottom dock placement
- major neon/cyber theme direction

## Allowed improvement categories
- bug fixes
- stale/dead code cleanup
- server validation hardening
- performance tuning
- build hygiene
- logging cleanup
- micro-animation polish
- readability/accessibility improvements that preserve layout
- smaller refactors that reduce maintenance risk

## High-risk files
Changes in these files must be especially careful and minimal:
- `src/App.tsx`
- `src/components/ChatInterface.tsx`
- `server.ts`
- `src/firebase.ts`
- `src/context/NeuralContext.tsx`
- `src/hooks/useNeuralSystems.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useMediaStream.ts`
- `src/hooks/useMotionDetection.ts`

## Branch-specific guidance
### Robot policy
- `Robot2D` is the live path.
- `Robot3D.tsx` is parked code only.
- If `Robot3D.tsx` is touched at all in this branch, the only acceptable changes are:
  - stronger ON HOLD annotations
  - stale copy cleanup
  - moving it to a parked/experimental location

### Server policy
- Keep all `/api/ai/*` routes server-routed.
- Keep auth enforcement and rate limiting intact.
- Tighten validation, do not loosen it.
- Never expose provider secrets to the client.

### Firebase/auth policy
- Keep redirect-based sign-in flow.
- Keep real Firebase ID token usage for protected server calls.
- Never reintroduce fake anonymous token fallbacks.

## Completion standard
A task is not complete unless the agent includes:
- exact files changed
- exact reason for each change
- exact commands run
- exact verification outcome
- explicit statement that protected UI structure was preserved
