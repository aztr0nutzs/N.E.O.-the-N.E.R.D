# Prompt 06: Firebase and Persistence Cleanup

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Do not alter visible auth or persistence UI flows except to improve correctness or error messaging.
- Do not make stylistic changes unrelated to auth/persistence behavior.

## Task
Clean Firebase/auth/persistence edges while preserving current functionality.

### Files to inspect and modify
- `src/firebase.ts`
- any directly related call sites in components if required

### Objectives
1. remove stale imports and dead code
2. keep redirect-first Google login flow
3. keep cleaner Firestore error shaping
4. improve error ergonomics only where it does not break current behavior
5. verify message/task persistence call sites remain correct

### Verification required
- `npm run lint`
- `npm run build`
- summarize any removed stale code and any changed user-facing error behavior
