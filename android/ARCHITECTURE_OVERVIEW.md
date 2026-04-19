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
- Supabase client auth and session handling in `src/authClient.ts` (with `src/lib/supabase.ts`)
- Google sign-in (web redirect and Capacitor/native flows as implemented)
- Postgres-backed persistence for tasks/messages (RLS on `public.tasks` and `public.messages`)

### Neural/media runtime
- `useSpeechRecognition.ts` handles speech recognition lifecycle
- `useMediaStream.ts` handles media stream + analyzer setup
- `useMotionDetection.ts` handles motion/user position logic
- `useNeuralSystems.ts` orchestrates startup/update/cleanup
- `NeuralContext.tsx` exposes the runtime state to the app

## Main runtime flow
1. user authenticates via Supabase
2. app shell renders
3. systems boot via `startSystems()`
4. media + speech + motion hooks initialize
5. chat UI uses **Supabase access token** (bearer JWT) to call server AI routes
6. server validates JWT and forwards to Gemini

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
