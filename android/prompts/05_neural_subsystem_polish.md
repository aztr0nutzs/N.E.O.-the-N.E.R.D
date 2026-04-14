# Prompt 05: Neural Subsystem Polish

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Preserve neural responsiveness, 3D assistant reactivity, and all current visible behaviors.
- Do not remove speech, motion, or media behaviors just to simplify the code.

## Task
Polish the split neural subsystem after the recent hook decomposition.

### Files to inspect and modify
- `src/hooks/useNeuralSystems.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useMediaStream.ts`
- `src/hooks/useMotionDetection.ts`
- any directly related context/helper file if needed

### Objectives
1. confirm cleanup paths remain correct
2. reduce unnecessary dev logging noise while keeping useful diagnostics behind dev-only guards
3. ensure no double-start or race-condition behavior exists in orchestration
4. preserve transcript flow, audio data flow, and motion-driven user position behavior
5. remove dead or duplicated logic left behind from the split

### Verification required
- `npm run lint`
- `npm run build`
- explain exactly what was cleaned and why it is safe
