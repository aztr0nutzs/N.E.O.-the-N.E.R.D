# N.E.O. Supabase Migration Pack

This pack is tailored to the uploaded `N.E.O.-the-N.E.R.D-main` project.

## What this project is right now
- React + Vite frontend
- Node/Express server in `server.ts`
- Firebase Auth on the client
- Firestore for tasks/messages
- Firebase Admin token verification on the server
- Gemini server routes already present and mostly healthy

## Why this pack exists
The app is still Firebase-based. Supabase keys alone will not make it run.
This pack gives a controlled, file-specific migration path from Firebase to Supabase so one backend is finished instead of two backends being half-configured.

## Recommended order
1. Read `docs/CURRENT_FIREBASE_DEPENDENCY_MAP.md`
2. Read `docs/TARGET_SUPABASE_ARCHITECTURE.md`
3. Create the Supabase project and rotate any leaked keys
4. Execute SQL in `supabase/sql/` in order
5. Update `.env` using `templates/.env.supabase.example`
6. Apply the migration tasks using prompts from `prompts/`
7. Run verification from `docs/POST_MIGRATION_VERIFICATION.md`

## Important branch rule
This pack assumes the app remains **2D robot authoritative** while the backend is migrated.
No UI redesign. No center-layout changes. No 3D revival during backend work.
