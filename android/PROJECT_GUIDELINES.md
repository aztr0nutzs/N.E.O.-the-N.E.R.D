# PROJECT_GUIDELINES.md

## This project's current identity
This branch is a **stable 2D polish build** of the J.A.R.V.I.S./NERD interface app.

### This means
- the 2D robot is the live centerpiece
- 3D is not part of the current product path
- current work should improve reliability, quality, and finish

## Core values for work on this branch
- correctness over novelty
- polish over churn
- measured refactors over broad rewrites
- preserve existing visual composition
- verify every meaningful change

## Working rules
### 1. Preserve the UI frame
Do not move the core composition unless the task explicitly asks for a layout change.

### 2. Make one class of change at a time
Do not mix cleanup, hardening, visual polish, and performance refactoring in one giant pass.

### 3. Respect branch intent
Do not treat parked 3D code as a feature request.

### 4. Verify after changes
At minimum run:
- `npm run lint`
- `npm run build`

### 5. Prefer smallest correct change
If a bug can be fixed in one file, do not refactor six.

## File ownership guidance
### App shell and UI composition
- `src/App.tsx`
- `src/components/Panel.tsx`
- `src/components/SidePanelLeft.tsx`
- `src/components/SidePanelRight.tsx`
- `src/components/BottomDock.tsx`

### Robot and visual system
- `src/components/Robot2D.tsx`
- `src/components/Robot3D.tsx` (parked)
- `src/components/NeuralVisualizer.tsx`

### AI and chat
- `src/components/ChatInterface.tsx`
- `server.ts`

### Auth and persistence
- `src/firebase.ts`
- `firestore.rules`

### Neural/media runtime
- `src/context/NeuralContext.tsx`
- `src/hooks/useNeuralSystems.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useMediaStream.ts`
- `src/hooks/useMotionDetection.ts`

## Quality bars
A change is acceptable only if:
- branch intent remains intact
- protected UI stays intact
- code path is verified
- lint passes
- build passes
- report includes receipts
