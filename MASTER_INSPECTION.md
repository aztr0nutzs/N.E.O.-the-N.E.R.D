# MASTER_INSPECTION.md

Perform a **deep, read-only inspection** before making migration edits.

## Scope
Inspect these areas:
- Firebase client setup and usage
- Firestore schema assumptions in code
- Server-side Firebase Admin usage
- Components reading/writing user-owned data
- Auth state propagation through context
- AI route token expectations
- Any stale or dead 3D/backend code that may interfere

## Required outputs
1. Verified Firebase dependency map by file
2. Exact Supabase replacement target for each Firebase dependency
3. Any schema mismatches between Firestore assumptions and desired Postgres schema
4. Any auth behavior tied directly to Firebase user object shape
5. Any code that assumes Firestore realtime semantics
6. Any server code that depends on Firebase Admin token verification
7. Any likely migration risk to UI behavior
8. Final migration risk score 0-10

## Hard rules
- Do not write code during inspection
- Distinguish verified facts from migration assumptions
- Trace actual call paths
- Flag any dead code that can be removed after cutover
- Preserve UI hierarchy while analyzing
