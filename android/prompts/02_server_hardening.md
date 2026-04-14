# Prompt 02: Server Hardening

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Do not flatten, simplify, restyle, or re-theme any UI.
- This task is server-focused. Do not make unrelated client visual changes.
- Do not remove features to make validation easier.

## Task
Harden `server.ts` while preserving all existing protected AI behaviors.

### Files to inspect and modify
- `server.ts`

### Objectives
1. tighten validation of `config.systemInstruction`
2. tighten validation of `config.responseModalities`
3. tighten validation of `config.speechConfig`
4. tighten validation of tool object shapes
5. tighten image/video config validation
6. keep auth middleware and rate limiting intact
7. keep correct `@google/genai` usage intact
8. ensure malformed payloads fail cleanly with generic client-safe errors
9. keep detailed logs server-side only
10. remove any stale/dead validation code discovered during the work

### Constraints
- do not weaken auth
- do not move AI calls back to the client
- do not break valid existing routes
- prefer explicit allowlists over permissive sanitization

### Verification required
- `npm run lint`
- `npm run build`
- summarize exactly what payload shapes were tightened
