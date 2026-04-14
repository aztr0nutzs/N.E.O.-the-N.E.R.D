# Prompt 01: Base Verification and Receipts

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Do not flatten, simplify, restyle, re-theme, or modernize the UI.
- Do not remove the 3D assistant viewport, premium overlays, dense control layout, or panel composition.
- Do not modify visual design unless a task below explicitly requires a copy-only fallback text update.
- Any nonessential visual change is forbidden.

## Task
Perform a read-only verification pass on this project and produce receipts before any implementation work.

### Required actions
1. inspect the archive/project structure
2. verify `public/robot_model.glb` exists
3. run:
   - `npm ci`
   - `npm run lint`
   - `npm run build`
4. report build chunk sizes
5. inspect `server.ts`, `src/components/ChatInterface.tsx`, `src/components/Robot3D.tsx`, `src/hooks/useNeuralSystems.ts`, `src/hooks/useSpeechRecognition.ts`, `src/hooks/useMediaStream.ts`, `src/hooks/useMotionDetection.ts`, and `src/firebase.ts`
6. produce a concise findings report with verified strengths, verified failures, inferred risks, and correction priorities

### Output requirements
- no code changes
- clear receipts
- explicit mention of whether auth gating, server validation, and GLB path are verified
