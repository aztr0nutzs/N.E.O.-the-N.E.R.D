# AGENTS.md

## Project identity
- Project: J.A.R.V.I.S. Interface
- Stack: Vite 6, React 19, TypeScript 5, Express 4, Firebase client SDK, Firebase Admin, `@google/genai`, React Three Fiber, Drei
- Runtime shape: browser UI + Node/Express AI gateway in `server.ts`
- Primary visual contract: premium futuristic HUD, black/cyber palette, dense but readable control-wall composition, premium 3D assistant viewport, no regression to sparse/default UI

## Mission
Every agent working on this project must preserve the current visual identity while improving correctness, hardening, maintainability, and performance. The work is complete only when the app is cleaner, safer, and measurably more reliable without flattening the interface or weakening the premium feel.

## Non-negotiable rules
1. **Preserve the UI first.** Do not replace, flatten, simplify, restyle, re-theme, or “modernize” the current interface unless the task explicitly asks for a visual redesign.
2. **Do not remove premium elements just to make a bug disappear.** Fix the underlying issue first.
3. **Prefer surgical edits over broad rewrites.** Keep behavior stable and regression surface small.
4. **No dead paths, no stale imports, no decorative fallback logic.** Remove safely after verification.
5. **Every change must be verified.** If a fix cannot be verified, say so explicitly and list what remains uncertain.
6. **Never ship raw secrets or weaken auth.** The current server-side AI boundary must remain intact.
7. **Do not break the 3D assistant path.** `public/robot_model.glb` and `src/components/Robot3D.tsx` are part of the product, not optional garnish.
8. **Do not downgrade type safety to silence errors.** Fix the root cause.
9. **Keep server validation strict.** Reject malformed input instead of trying to be helpful.
10. **Remove stale code only after tracing real call paths.** No blind cleanup.

## Required working style
- Inspect before modifying.
- Trace call paths before refactoring.
- Keep edits localized.
- Keep diffs understandable.
- Favor explicit interfaces and helper functions over implicit behavior.
- Do not introduce placeholder code, TODO-only patches, or speculative abstractions.

## Required verification for every implementation task
At minimum, run and report:
- `npm ci`
- `npm run lint`
- `npm run build`

When relevant, also verify:
- authenticated `/api/ai/*` behavior
- unauthenticated rejection behavior
- `Robot3D` load success and fallback behavior
- media permissions flow
- chat persistence and retrieval
- console noise in dev vs production behavior

## Project-specific architecture map
- `server.ts`: Express app, auth middleware, rate limiting, AI route validation, Gemini gateway
- `src/components/ChatInterface.tsx`: main AI interaction surface, personas, multimodal mode routing, Firestore-backed message history
- `src/components/Robot3D.tsx`: 3D assistant viewport using R3F/Drei + `robot_model.glb`
- `src/hooks/useNeuralSystems.ts`: orchestration hook over media, speech, and motion hooks
- `src/hooks/useSpeechRecognition.ts`: browser speech recognition lifecycle
- `src/hooks/useMediaStream.ts`: audio/video stream setup and cleanup
- `src/hooks/useMotionDetection.ts`: webcam frame analysis and user-position estimation
- `src/context/NeuralContext.tsx`: shared neural state for UI/3D response
- `src/firebase.ts`: auth bootstrapping, Firestore bootstrapping, error shaping

## Safe change priorities
### High priority
- Build integrity and type safety
- Server-side AI route validation and auth enforcement
- Runtime resilience and cleanup correctness
- Performance improvements that do not degrade visuals

### Medium priority
- Component decomposition
- Dead code removal
- Error ergonomics
- Better internal typings

### Low priority
- Copy polish
- Internal naming cleanup
- Refactors with no user impact

## Anti-patterns forbidden on this project
- Replacing components with placeholders
- Flattening futuristic UI into generic cards
- Removing the 3D viewport to hide load or performance issues
- Switching protected AI flows back to client-side SDK calls
- Accepting malformed request bodies to avoid validation work
- Disabling lint/type checks instead of fixing them
- Swallowing errors silently
- Large-scale file rewrites without need

## Completion standard
A task is complete only when all of the following are true:
- intended issue is fixed
- no UI regression was introduced
- stale/dead code created by the fix was removed
- required verification commands were run
- any remaining risk is clearly documented
