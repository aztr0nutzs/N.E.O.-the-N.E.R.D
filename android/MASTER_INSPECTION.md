# MASTER_INSPECTION.md

## Purpose
Run a full, read-only, evidence-based inspection of the J.A.R.V.I.S. Interface project. The goal is to determine what is actually implemented, what is partially implemented, what is broken, what is stale, and what is risky for production.

## Strict rules
- Do **not** modify files during inspection.
- Do **not** assume a feature works because the UI suggests it does.
- Do **not** infer correctness from a successful Vite build alone.
- Do **not** ignore dead code, fallback drift, or stale imports.
- Distinguish verified facts from inferred risks.
- Trace real call paths before scoring.

## Required inspection scope
### 1. Build and toolchain
Inspect and report:
- `package.json` scripts
- dependency alignment
- TypeScript setup
- Vite setup
- whether `npm ci`, `npm run lint`, and `npm run build` pass
- chunk outputs and obvious performance warnings

### 2. Server gateway integrity
Inspect `server.ts` for:
- Express middleware ordering
- auth enforcement on `/api/ai/*`
- rate limiting
- Gemini SDK usage correctness
- request validation depth per route
- response sanitization
- error leakage
- payload limits

### 3. Client AI orchestration
Inspect `src/components/ChatInterface.tsx` for:
- auth preconditions before protected requests
- persona handling
- model routing by mode
- file upload conversion and transport
- Firestore message persistence
- TTS behavior and fallback behavior
- stale code, dead modes, or over-coupled UI logic

### 4. Neural/media subsystem
Inspect:
- `src/hooks/useNeuralSystems.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useMediaStream.ts`
- `src/hooks/useMotionDetection.ts`
- `src/context/NeuralContext.tsx`

Verify:
- cleanup correctness
- stale closure risk
- permission flow safety
- browser API assumptions
- console noise
- over-centralization or maintainability problems

### 5. 3D assistant path
Inspect `src/components/Robot3D.tsx` and `public/robot_model.glb` for:
- correct asset path
- fallback behavior correctness
- stale fallback copy
- chunk/load cost implications
- suspicious render-time work
- likely runtime failure modes

### 6. Firebase/auth/persistence
Inspect `src/firebase.ts`, Firestore usage, and rules-related assumptions for:
- auth flow quality
- Firestore initialization
- error shaping
- message/task collection paths
- permission-related failure behavior

### 7. UI contract preservation risk
Inspect the premium interface for:
- unintended placeholder fallback risk
- brittle visual logic
- areas likely to regress under AI-assisted edits
- places where a “cleanup” pass could accidentally flatten visuals

## Required outputs
### A. Overall score
Provide one overall score out of 10.

### B. Category scores
Score at minimum:
- Build Integrity
- Architecture / Separation
- Gemini / AI Integration
- Firebase / Auth / Persistence
- Neural / Media Systems
- UI / Visual Design
- Asset Completeness
- Runtime Resilience
- Performance / Bundle Health
- Production Readiness

### C. Verified strengths
List only what was actually verified.

### D. Verified failures / blockers
List only what was actually verified.

### E. Inferred risks
List plausible but not fully verified risks separately.

### F. File-by-file findings
At minimum include:
- `server.ts`
- `src/components/ChatInterface.tsx`
- `src/components/Robot3D.tsx`
- `src/hooks/useNeuralSystems.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useMediaStream.ts`
- `src/hooks/useMotionDetection.ts`
- `src/firebase.ts`

### G. Correction priorities
Rank issues in execution order.

## Inspection checklist
- [ ] archive contents inspected
- [ ] `public/robot_model.glb` presence verified
- [ ] `npm ci` run
- [ ] `npm run lint` run
- [ ] `npm run build` run
- [ ] `server.ts` AI routes traced
- [ ] auth middleware traced
- [ ] `ChatInterface.tsx` request flow traced
- [ ] media hook cleanup traced
- [ ] 3D fallback text checked
- [ ] stale imports/dead code checked
- [ ] chunk sizes reviewed
- [ ] scores justified by evidence
