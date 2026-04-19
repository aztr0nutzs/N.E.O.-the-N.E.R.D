# Prompt 06: Supabase auth and persistence cleanup

> Filename retained for pack ordering; content targets **Supabase**, not Firebase.

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Do not alter visible auth or persistence UI flows except to improve correctness or error messaging.
- Do not make stylistic changes unrelated to auth/persistence behavior.

## Task
Clean **Supabase** auth/persistence edges while preserving current functionality.

### Files to inspect and modify
- `src/authClient.ts`
- any directly related call sites in components if required

### Objectives
1. remove stale imports and dead code
2. keep Google login flow (web redirect + Capacitor/native as implemented)
3. keep database access error shaping helpers consistent with Postgres/RLS
4. improve error ergonomics only where it does not break current behavior
5. verify message/task persistence call sites remain correct

### Verification required
- `npm run lint`
- `npm run build`
- summarize any removed stale code and any changed user-facing error behavior
