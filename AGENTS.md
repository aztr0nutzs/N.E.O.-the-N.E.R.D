# AGENTS.md

## Current branch reality (authoritative)

- **Backend:** Supabase (Auth with Google, Postgres `tasks` / `messages`, RLS).
- **Server:** Protected routes verify **Supabase JWTs** in `server.ts` (fail closed).
- **Client auth / API helpers:** `src/authClient.ts` (Supabase session, OAuth, `fetchProtectedJson`, shared error helpers).
- **Android:** Capacitor is the active native shell (`android/`).
- **UI:** `Robot2D` is the live center robot. **`Robot3D` is parked** and must not be re-enabled during backend work.
- The visible HUD layout, frame geometry, hotspots, panel placement, and overall visual hierarchy are **frozen** unless a task explicitly says otherwise.

## Mission

Maintain **one** working backend (Supabase). Prefer small, verifiable edits. Keep auth, data, and server token verification changes isolated by file. Preserve existing user-facing copy where possible.

## Non-negotiable UI preservation rules

1. Do not redesign the UI.
2. Do not move major panels.
3. Do not change the center composition.
4. Do not replace the `Robot2D` concept.
5. Do not flatten the interface into generic cards.
6. Do not remove glow, frame, panel, HUD, or scanline treatments unless a bug fix explicitly requires it.

## Engineering principles

1. Prefer small, verifiable edits.
2. Keep auth, data, and server token verification changes isolated by file.
3. Preserve existing user-facing copy where possible.
4. Fail closed on server auth.
5. Use Row Level Security in Supabase for all user-owned data.

## Key runtime files

- `server.ts` — Express, Supabase JWT verification, `/api/ai/*`.
- `src/lib/supabase.ts` — browser Supabase client.
- `src/authClient.ts` — sign-in/out, session token for protected fetches, mobile OAuth deep link handling.
- `src/context/NeuralContext.tsx` — auth state and neural runtime wiring.
- `src/components/TaskLog.tsx`, `src/components/ChatInterface.tsx` — tasks/messages UI backed by Supabase.

## Historical / cleanup-only references

Legacy Firebase config filenames (`firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`) may still appear in **migration prompts or old docs** as removal targets; they are not part of the active Supabase runtime. See `docs/LEGACY_FIREBASE_DEPENDENCY_SNAPSHOT.md` for a frozen pre-migration snapshot.

## Required verification gates after each task

- `npm ci`
- `npm run lint`
- `npm run build`
- signed-in auth flow works
- tasks CRUD works
- messages/history works
- protected AI routes still work while signed in
