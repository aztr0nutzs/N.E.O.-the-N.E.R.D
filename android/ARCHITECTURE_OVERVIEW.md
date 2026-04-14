# ARCHITECTURE_OVERVIEW.md

## High-level architecture

### Frontend shell
- React + TypeScript + Vite
- App shell composed in `src/App.tsx`
- Lazy-loaded feature panels/components

### Live centerpiece
- `Robot2D` is the active center robot
- `Robot3D` exists as parked/on-hold code only

### AI boundary
- browser client calls protected `/api/ai/*` routes
- server owns Gemini integration
- server enforces auth and rate limiting

### Auth and persistence
- Firebase client auth in `src/firebase.ts`
- redirect-based Google auth flow
- Firestore-backed persistence for relevant app data

### Neural/media runtime
- `useSpeechRecognition.ts` handles speech recognition lifecycle
- `useMediaStream.ts` handles media stream + analyzer setup
- `useMotionDetection.ts` handles motion/user position logic
- `useNeuralSystems.ts` orchestrates startup/update/cleanup
- `NeuralContext.tsx` exposes the runtime state to the app

## Main runtime flow
1. user authenticates
2. app shell renders
3. systems boot via `startSystems()`
4. media + speech + motion hooks initialize
5. chat UI uses Firebase ID token to call server AI routes
6. server validates and forwards to Gemini

## Branch-specific decisions
### Why 2D is authoritative now
- 3D model path is not presentation-ready for this branch
- 2D path is lighter, clearer, and easier to polish
- current goal is stable top-to-bottom refinement

### Why 3D remains in-tree
- future experimentation may continue later
- current branch should not activate it
- if retained, it should be clearly marked as parked

## Known technical debt
- server validation can still tighten
- main app chunk is still relatively heavy
- some parked/stale code may remain
- debug logging can still be reduced
