---
name: neo-server-hardening
description: >-
  Reviews or edits server.ts for N.E.O.: Supabase JWT verification via service
  role client, express-rate-limit on /api/ai, Gemini model/modality/thinking and
  media allowlists, JSON body size limits, and fail-closed validation. Use when
  changing AI routes, auth middleware, env usage, or request parsing on the
  server.
---
# Server hardening (N.E.O.)

Primary file: `server.ts` at repo root.

## Checklist

- **`requireAuth` (or successor)**  
  - `Authorization: Bearer <jwt>` required; missing or non-Bearer → **401**.  
  - Valid Supabase user via `supabaseAdmin.auth.getUser(token)`; invalid user/error → **401**.  
  - If Supabase admin client is not configured (`VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) → **500** (misconfig), not a silent bypass.

- **Rate limiting**  
  - Sensitive `/api/ai/` traffic stays behind `apiLimiter` (or equivalent); new AI endpoints use the same pattern.

- **Allowlists**  
  - Chat models, response modalities, thinking levels, image/video enums, MIME types: reject values not in the server’s const allowlists (**400**), never pass through unchecked strings to the provider.

- **Payload and trust**  
  - Route-appropriate `express.json` limits (`CHAT_ROUTE_LIMIT` vs `DEFAULT_ROUTE_LIMIT`); keep caps on nested arrays/chars aligned with existing `MAX_*` guards.  
  - **Never** accept client-supplied API keys or provider secrets; Gemini uses `GEMINI_API_KEY` from env only (`getAiClient` pattern).

## Change style

- Minimal, testable edits; add validation **before** widening inputs or adding fields to the Gemini request.

## Verify

- From repo root: project lint/build (match repo scripts, e.g. `npm run build` / `npm run lint` if present).
- Protected `/api/ai/` route (or successor path):  
  - **No `Authorization` header** → **401**.  
  - **Malformed or wrong JWT** → **401**.  
  - **Valid Bearer JWT** for a real user → **200** or expected provider/validation error (**400**/ **500** only when misconfiguration or upstream failure is intentional and logged).
