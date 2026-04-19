# Target Supabase Architecture

## Frontend
Use `@supabase/supabase-js` with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Create one browser client in `src/lib/supabase.ts`.

## Auth
Use Supabase Auth with Google provider.

Frontend responsibilities:
- sign in with Google via `supabase.auth.signInWithOAuth({ provider: 'google' })`
- sign out via `supabase.auth.signOut()`
- get session/user via `supabase.auth.getSession()` and `onAuthStateChange()`
- obtain access token from current session for protected server routes

## Data
Replace Firestore collections with Postgres tables:
- `public.tasks`
- `public.messages`

Both tables store a `user_id uuid` foreign key to `auth.users(id)`.

## Realtime
On the Supabase-first branch, tasks and messages are loaded via Postgres queries (fetch + refresh on auth change and after writes). Optional Supabase Realtime subscriptions can be added later if needed.

## Server
Use the service-role key only on the server.

Server responsibilities:
- create server-side Supabase client with service role key
- verify bearer JWTs from the frontend
- continue handling Gemini routes and validation

## Security
Use RLS policies so users can only access rows where `user_id = auth.uid()`.

## Files to introduce
- `src/lib/supabase.ts`
- `src/authClient.ts` (Supabase auth/session + protected JSON fetch; preserve helper names where the app already depends on them)
- optional `src/lib/tasksApi.ts`
- optional `src/lib/messagesApi.ts`
- `src/lib/supabaseAdmin.ts` or server-local helper for token verification
