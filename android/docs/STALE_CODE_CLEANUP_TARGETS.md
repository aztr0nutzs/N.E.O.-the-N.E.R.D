# STALE_CODE_CLEANUP_TARGETS.md

## Primary cleanup targets for this branch

### 1. Parked 3D code
- `src/components/Robot3D.tsx`
- any imports/comments suggesting it is active
- stale fallback copy implying missing assets rather than intentional hold state

### 2. Dead imports
Check for:
- unused imports in `src/App.tsx`
- unused imports in split hooks
- unused imports in `server.ts`
- unused imports in `src/firebase.ts`

### 3. Debug-only logs
Review:
- `useSpeechRecognition.ts`
- `useMediaStream.ts`
- `useMotionDetection.ts`
- `useNeuralSystems.ts`

Keep only useful dev-only logs.

### 4. Stale comments and branch confusion
Remove or update comments that:
- imply 3D is active
- imply asset upload is still required
- imply older auth behavior still exists

## Cleanup rule
Do not remove a file or helper until imports and runtime usage are verified.
