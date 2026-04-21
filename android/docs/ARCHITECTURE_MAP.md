# ARCHITECTURE_MAP.md

## Runtime layers

### Browser app
- `src/main.tsx` boots the React app
- `src/App.tsx` frames the dashboard shell
- `src/components/ChatInterface.tsx` drives the main AI interaction surface
- `src/components/Robot3D.tsx` is **parked** 3D assistant code (not the live center path)
- `src/context/NeuralContext.tsx` distributes neural/media state
- `src/hooks/*` manage speech, media, motion, and orchestration
- `src/authClient.ts` provides Supabase auth/session wiring, protected `fetch`, and shared DB error shaping helpers

### Node server
- `server.ts` hosts the Express server, Vite dev integration, auth middleware, route validation, Gemini calls, and protected `/api/ai/*` endpoints

## Critical call paths

### Protected AI chat request
1. `ChatInterface.tsx` builds request
2. client checks `auth.currentUser` (from `src/authClient.ts`)
3. client obtains Supabase access token for `Authorization: Bearer …`
4. request goes to `/api/ai/chat`
5. `server.ts` applies rate limiting and auth middleware
6. `server.ts` validates/sanitizes body
7. `server.ts` calls `GoogleGenAI`
8. response flows back to client

### 3D assistant path (parked)
1. `Robot3D.tsx` lazy/split chunk loads when referenced
2. `useGLTF('/robot_model.glb', true)` requests asset from `public/robot_model.glb`
3. neural context provides `userPosition`, `audioData`, `neuralSurge`
4. 3D model responds to motion/audio/neural state

### Neural/media path
1. `useNeuralSystems.ts` orchestrates subsystems
2. `useSpeechRecognition.ts` handles browser speech recognition
3. `useMediaStream.ts` opens mic/webcam + analyzer setup
4. `useMotionDetection.ts` estimates user position from frames
5. `NeuralContext` distributes output to UI and 3D components

## High-risk files
- `server.ts`
- `src/components/ChatInterface.tsx`
- `src/components/Robot3D.tsx`
- `src/hooks/useNeuralSystems.ts`
- `src/hooks/useMediaStream.ts`
- `src/authClient.ts`
