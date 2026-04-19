# Prompt 07: Dead Code and Import Cleanup

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- This is a cleanup task, not a redesign task.
- Do not remove any visually important component, panel, effect, or control without proving it is dead.

## Task
Perform a careful dead-code and stale-import cleanup pass across the project.

### Files to inspect
- `server.ts`
- `src/components/*.tsx`
- `src/hooks/*.ts`
- `src/authClient.ts`
- `src/context/*.tsx`

### Objectives
1. remove unused imports
2. remove dead helper code that is no longer referenced
3. remove stale fallback text or comments that no longer reflect reality
4. preserve all live call paths
5. do not remove code unless you traced its usage or proved it unused

### Verification required
- `npm run lint`
- `npm run build`
- list every removed symbol/file/comment block and why removal was safe
