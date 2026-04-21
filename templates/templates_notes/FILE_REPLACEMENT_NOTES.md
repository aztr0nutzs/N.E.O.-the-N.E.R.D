# File Replacement Notes

These templates are reference starting points, not blind drop-ins.

## Replace completely
- `src/firestore.ts` -> remove
- `firebase-applet-config.json` -> remove
- `firebase-blueprint.json` -> remove
- `firestore.rules` -> remove after Supabase cutover

## Replace in place
- `src/authClient.ts` -> Supabase auth/session helpers + protected `fetch` (current); legacy forks may still have `src/firebase.ts` — consolidate on `authClient` + `src/lib/supabase.ts`
- `src/context/NeuralContext.tsx` -> swap Firebase `onAuthStateChanged` for Supabase `onAuthStateChange`
- `server.ts` -> replace Firebase Admin auth verification with Supabase token verification
- `src/components/TaskLog.tsx` -> replace Firestore CRUD with Supabase table operations
- `src/components/ChatInterface.tsx` -> replace Firestore history CRUD with Supabase table operations

## Package changes
Add dependency:
- `@supabase/supabase-js`

Remove after cutover:
- `firebase`
- `firebase-admin`
