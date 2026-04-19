# MASTER_INSPECTION.md

## Scope note (current branch)

This repository’s **live** stack is **Supabase** (client + server JWT verification) with **`Robot2D` active** and **`Robot3D` parked**. Use the checklist below when auditing **remaining legacy references**, **RLS/data assumptions**, or **regressions** — not to assert Firebase as current.

## Deep inspection areas

Inspect these areas before large backend or auth changes:

- Supabase client setup and usage (`src/lib/supabase.ts`, `src/authClient.ts`)
- Postgres/RLS assumptions in tasks and messages code paths
- Server-side Supabase JWT verification (`server.ts`)
- Components reading/writing user-owned data
- Auth state propagation through context
- AI route token expectations (Supabase access token as bearer)
- Stale or dead 3D/backend code that may confuse branch intent

## Required outputs (for a formal inspection pass)

1. Verified map of auth and data access by file (Supabase paths)
2. Any schema mismatches between code and `supabase/sql/` definitions
3. Any auth behavior tied to Supabase session/user shape
4. Any code that still assumes Firestore paths or Firebase Admin (should be none in runtime)
5. Any server code paths that must stay fail-closed on bad/missing JWTs
6. Migration residual risk to UI behavior (should be low if UI rules are respected)
7. Final risk score 0-10

## Hard rules

- Do not write code during a read-only inspection
- Distinguish verified facts from assumptions
- Trace actual call paths
- Flag dead code that can be removed safely after verification
- Preserve UI hierarchy while analyzing
