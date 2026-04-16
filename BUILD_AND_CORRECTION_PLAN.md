# BUILD_AND_CORRECTION_PLAN.md

## Goal
Convert the current Firebase-based app to Supabase without changing the visible UI architecture.

## Phase 1 - Preflight and secrets
- Rotate leaked Supabase anon and service role keys
- Create fresh `.env` from `templates/.env.supabase.example`
- Create the Supabase project
- Enable Google auth in Supabase
- Run SQL migrations from `supabase/sql/`

## Phase 2 - Client foundation
- Add `@supabase/supabase-js`
- Add `src/lib/supabase.ts`
- Replace Firebase auth helper module with Supabase helper module preserving existing app-facing helper names where useful
- Update `NeuralContext` auth subscription from Firebase to Supabase

## Phase 3 - Data layer replacement
- Replace Firestore task reads/writes in `TaskLog.tsx`
- Replace Firestore message reads/writes in `ChatInterface.tsx`
- Preserve optimistic UI behavior where already present
- Preserve auth-required messages and error UX

## Phase 4 - Server auth cutover
- Remove Firebase Admin initialization and verification
- Verify Supabase JWTs on `/api/ai/*`
- Keep Gemini routing and validation structure intact
- Fail closed when token verification fails

## Phase 5 - Cleanup
- Remove Firebase dependencies and files
- Remove `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`
- Remove any stale helper code that only existed for Firestore
- Update README/setup docs

## Phase 6 - Verification
- `npm ci`
- `npm run lint`
- `npm run build`
- Sign in with Google through Supabase
- Add/update/delete tasks
- Send chat request and confirm protected AI routes still succeed
- Clear history and confirm message deletion works

## Success criteria
- No Firebase packages remain in runtime code
- No Firebase secrets/config files remain in active setup
- Supabase auth works end-to-end
- User-owned tasks/messages are protected by RLS
- Protected AI routes accept only valid Supabase-authenticated users
