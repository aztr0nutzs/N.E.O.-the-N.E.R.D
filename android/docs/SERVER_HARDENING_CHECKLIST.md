# SERVER_HARDENING_CHECKLIST.md

## Goal
Tighten server safety without loosening successful behavior.

## Required checks in `server.ts`
### Auth and rate limit
- `/api/ai/*` still behind `requireAuth`
- `/api/ai/*` still rate limited
- auth misconfiguration still fails closed

### Chat validation
- model allowlist still enforced
- contents array bounds still enforced
- parts validation still enforced
- inline MIME types constrained
- inline payload size constrained
- roles constrained

### Additional hardening to review
- `systemInstruction` shape
- `responseModalities` contents
- `speechConfig` shape
- `thinkingConfig` value validation
- tool object shape

### Image/video routes
- prompt length bounds
- image/video config allowlists
- MIME allowlists
- payload size limits
- operation ID validation

### Error handling
- server logs can be detailed
- client responses must remain generic and safe
