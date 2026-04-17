---
name: neo-server-hardening
description: >-
  Reviews or edits server.ts for N.E.O.: Supabase JWT verification via
  requireAuth, express-rate-limit on /api/ai/, Gemini allowlists (models,
  modalities, thinking, image/video config, MIME types, tools), JSON body size
  limits, and fail-closed env behavior. Use when changing AI routes, auth
  middleware, rate limits, validation, or server-side env usage for Gemini or
  Supabase.
---

# N.E.O. server hardening (`server.ts`)

## When to use

Apply when touching `server.ts` or anything that changes how `/api/ai/*` is authenticated, throttled, validated, or sized — including new AI endpoints or request fields.

## Scope

Primary file: **`server.ts`** at the repository root (Express + Vite). Cross-check **`.cursor/rules/neo-03-server-security-mdc.mdc`** for project policy.

## Review checklist

Copy and tick mentally while reading the diff:

- **`requireAuth` (or successor)**
  - **401** if `Authorization` is missing, not `Bearer …`, or Supabase `getUser` fails / no user.
  - **500** if auth verification cannot run (e.g. Supabase admin client not configured: missing `VITE_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`). Fail closed; do not treat misconfig as anonymous access.
  - Verified user attached for downstream handlers (e.g. `(req as any).user`).

- **Rate limiting**
  - Sensitive **`/api/ai/`** tree still uses the shared limiter **before** handlers (same order: limiter, then auth, then routes).
  - New AI routes stay under the protected prefix or explicitly justify and document a different policy.

- **Allowlists and enums**
  - **Chat `model`**: only values in `ALLOWED_CHAT_MODELS`; unknown → **400**.
  - **Config**: `responseModalities`, `thinkingConfig.thinkingLevel`, image `aspectRatio` / `imageSize`, `personGeneration`, video `aspectRatio` / `resolution`, tools (`googleSearch` / `googleMaps` only), inline MIME types — all validated; reject unknown or malformed shapes with **400** (validation returns `null` → bad request), not pass-through to the provider.
  - **Video operation id**: `validateOperationId` pattern enforced on status route.

- **Body size and parsers**
  - Heavy routes use **`chatJsonParser`** (`CHAT_ROUTE_LIMIT`, e.g. 10mb); lighter routes use **`defaultJsonParser`** (`DEFAULT_ROUTE_LIMIT`, e.g. 1mb). New routes pick the stricter default unless inline media requires the larger limit.
  - Errors: **`entity.too.large`** → **413** for `/api/ai/` (existing error middleware); malformed JSON → **400**.

- **Secrets and provider trust**
  - **`GEMINI_API_KEY`** and **`SUPABASE_SERVICE_ROLE_KEY`** only on the server / env; never accept client-supplied API keys or provider secrets in the body.
  - **`getAiClient()`** throws if Gemini key missing — ensure callers map to **500** with a safe user message (no stack or key leakage).

## Change style

- **Minimal, testable edits**; one security concern per change where possible.
- **Tighten validation before widening inputs** (new fields, larger limits, or new models). Prefer allowlists over string passthrough.

## Verify

1. **Automated** — From repo root, run the same gates as **neo-verify-gates** (e.g. `npm run lint`, `npm run build`). Fix failures before claiming done.

2. **Manual — protected `/api/ai/` route** (e.g. `POST /api/ai/chat` with minimal valid JSON, or `GET /api/ai/video-status/...` with a valid-shaped id if testing status):

   | Case | Expected |
   |------|----------|
   | No `Authorization` header | **401** |
   | `Authorization: Bearer` + invalid / expired JWT | **401** |
   | Valid Bearer JWT | **200** or **400** from payload validation — not **401** |
   | Server missing Supabase URL / service role (misconfig) | **500** on protected AI calls |

   Document which route you used and the status codes observed (or **not tested** if no running server/token).

## Related

- **`.cursor/skills/neo-verify-gates/SKILL.md`** — full automated + manual verification template for the repo.
