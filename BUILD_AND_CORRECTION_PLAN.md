# BUILD_AND_CORRECTION_PLAN.md

## Current status

The application on this branch **uses Supabase** for authentication, Postgres-backed tasks/messages, and **Supabase JWT verification** on protected server routes. **`Robot2D` is active**; **`Robot3D` is parked**. Capacitor Android is part of the supported deployment story.

The phased plan below is retained as a **migration checklist** and for any remaining cleanup (for example, deleting obsolete Firebase artifacts if they still exist in a fork).

## Goal (historical)

Complete migration from Firebase to Supabase **without changing the visible UI architecture**.

## Phase 1 - Preflight and secrets

- Rotate leaked Supabase anon and service role keys if ever exposed
- Create fresh `.env` from `.env.example` / `templates/.env.supabase.example`
- Create the Supabase project
- Enable Google auth in Supabase
- Run SQL migrations from `supabase/sql/`

## Phase 2 - Client foundation

- `@supabase/supabase-js` client in `src/lib/supabase.ts`
- Auth and protected-fetch helpers in `src/authClient.ts`
- `NeuralContext` subscribes to Supabase session via `onAuthStateChange`

## Phase 3 - Data layer

- Tasks and messages in Postgres (`public.tasks`, `public.messages`) with RLS
- Preserve optimistic UI behavior and auth-required error UX

## Phase 4 - Server auth

- Verify Supabase JWTs on `/api/ai/*`
- Keep Gemini routing and validation structure intact
- Fail closed when token verification fails

## Phase 5 - Cleanup (when applicable)

- Remove any leftover Firebase-only dependencies and config files that are no longer referenced
- Remove stale helper code that only existed for Firestore
- Keep docs aligned with Supabase as the live backend

## Phase 6 - Verification

- `npm ci`
- `npm run lint`
- `npm run build`
- Sign in with Google through Supabase
- Add/update/delete tasks
- Send chat request and confirm protected AI routes still succeed
- Clear history and confirm message deletion works

## Success criteria

- Supabase auth works end-to-end
- User-owned tasks/messages are protected by RLS
- Protected AI routes accept only valid Supabase-authenticated users
- No runtime path treats Firebase as the live backend
