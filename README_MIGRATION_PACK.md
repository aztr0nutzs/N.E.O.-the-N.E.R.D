# N.E.O. Supabase migration pack

This pack was tailored to the uploaded `N.E.O.-the-N.E.R.D-main` project and documents the **Firebase → Supabase** migration path.

## Current branch status

The **active** app on this branch is **Supabase-backed**: Supabase Auth (Google), Postgres tables for tasks and messages (with RLS), and Supabase JWT verification on the server for protected AI routes. Capacitor Android is supported; **`Robot2D` is live** and **`Robot3D` is parked**.

Use **`README.md`** and **`.env.example`** for day-to-day setup. The sections below remain useful as **ordered migration guidance** or for understanding historical decisions.

## What the migration changed (summary)

- Client: Supabase Auth and Postgres-backed data access (replacing Firebase client SDK usage).
- Server: Supabase JWT verification (replacing Firebase Admin).
- Optional cleanup: remove obsolete Firebase config/deps only when no longer referenced (see migration prompts).

## Recommended reading order

1. `docs/LEGACY_FIREBASE_DEPENDENCY_SNAPSHOT.md` (historical pre-Supabase snapshot only)
2. `docs/TARGET_SUPABASE_ARCHITECTURE.md`
3. Create the Supabase project and rotate any leaked keys
4. Execute SQL in `supabase/sql/` in order
5. Update `.env` using `templates/.env.supabase.example`
6. Apply migration tasks using prompts from `prompts/` where still relevant
7. Run verification from `docs/POST_MIGRATION_VERIFICATION.md`

## Important branch rule

The app remains **2D robot authoritative** while backend work continues: no UI redesign, no center-layout changes, no 3D revival during backend tasks unless explicitly scoped.
