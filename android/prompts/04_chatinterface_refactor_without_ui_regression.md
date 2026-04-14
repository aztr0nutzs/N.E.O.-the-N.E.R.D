# Prompt 04: ChatInterface Refactor Without UI Regression

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Preserve layout density, personas, controls, modes, panel framing, and visual style.
- Do not flatten or simplify the chat UI.
- Refactor logic only; visible behavior must remain the same unless explicitly fixing a bug.

## Task
Refactor `src/components/ChatInterface.tsx` to reduce complexity while preserving the current UX and styling.

### Files to inspect and modify
- `src/components/ChatInterface.tsx`
- create small helpers/modules only if directly justified by this refactor

### Objectives
1. extract request-building helpers from JSX-heavy code
2. extract AI fetch helpers where useful
3. remove stale imports and dead code
4. preserve personas, chat modes, TTS behavior, Firestore persistence, and current controls
5. keep auth preconditions before protected AI calls
6. keep UI output unchanged except for bug fixes

### Constraints
- no redesign
- no loss of features
- no weakening of auth or server-routed flow
- no partial snippets; produce complete file edits

### Verification required
- `npm run lint`
- `npm run build`
- explicitly note which code paths were simplified and what dead/stale code was removed
