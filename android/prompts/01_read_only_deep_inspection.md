# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform a full **read-only deep inspection** of the current `neo_final` branch.

## Project truths to respect
- This is the stable 2D branch.
- `Robot2D` is active.
- `Robot3D` is parked/on hold.
- Protected AI routes are server-routed.

## Required inspection outputs
1. Overall score out of 10
2. Category scores
3. Verified passes
4. Verified blockers
5. File-by-file findings
6. Stale/dead code findings
7. Recommended next steps in priority order
8. Verification receipts

## Mandatory files to inspect
- `src/App.tsx`
- `src/components/Robot2D.tsx`
- `src/components/Robot3D.tsx`
- `src/components/ChatInterface.tsx`
- `src/authClient.ts`
- `server.ts`
- `src/context/NeuralContext.tsx`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useMediaStream.ts`
- `src/hooks/useMotionDetection.ts`
- `src/hooks/useNeuralSystems.ts`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`

## Required commands
```bash
npm ci
npm run lint
npm run build
```

## Important
Do not modify files. Do not give vague suggestions. Distinguish verified facts from inferred risks.
