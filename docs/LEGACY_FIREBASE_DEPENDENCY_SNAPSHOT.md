# Legacy Firebase dependency snapshot (historical)

This document captured the **pre-Supabase** dependency layout for an older upload of the project. It is **not** an accurate map of the current runtime.

## Current branch (authoritative)

- **Auth and protected API calls:** Supabase Auth (Google) and Supabase JWTs via `src/authClient.ts` and `src/lib/supabase.ts`.
- **Data:** Postgres tables `tasks` and `messages` with Row Level Security.
- **Server:** `server.ts` verifies Supabase bearer tokens for protected routes.
- **UI:** `Robot2D` is live; `Robot3D` is parked/on hold.
- **Android:** Capacitor shell is active for native builds.

## Why this file exists

It remains as a **migration archaeology** reference only. For active architecture, read `README.md`, `AGENTS.md`, and `docs/TARGET_SUPABASE_ARCHITECTURE.md`.

---

## Historical content (do not treat as current)

The following described the old Firebase + Firestore stack:

- Client auth and Firestore helpers lived under a module that was later replaced by Supabase-oriented code.
- Tasks and messages used Firestore paths and realtime listeners.
- The server used Firebase Admin for token verification.

Those responsibilities now live in Supabase-backed modules and `server.ts` as implemented on this branch.
