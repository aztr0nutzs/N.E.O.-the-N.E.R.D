# AGENTS.md

This repository is undergoing a **backend migration from Firebase to Supabase**.

## Mission
Finish one working backend. Do not maintain parallel Firebase and Supabase logic longer than required for the migration cutover.

## Current branch assumptions
- `Robot2D` is the live center robot component.
- `Robot3D` is on hold and must not be re-enabled during backend migration.
- The visible HUD layout, frame geometry, hotspots, panel placement, and overall visual hierarchy are frozen unless a task explicitly says otherwise.

## Non-negotiable UI preservation rules
1. Do not redesign the UI.
2. Do not move major panels.
3. Do not change the center composition.
4. Do not replace the Robot2D concept.
5. Do not flatten the interface into generic cards.
6. Do not remove glow, frame, panel, HUD, or scanline treatments unless a bug fix explicitly requires it.

## Migration principles
1. Remove Firebase **only after** Supabase replacement code is in place.
2. Prefer small, verifiable edits.
3. Keep auth, data, and server token verification changes isolated by file.
4. Preserve existing user-facing copy where possible.
5. Fail closed on server auth.
6. Use Row Level Security in Supabase for all user-owned data.

## Agent skills (Cursor)

Project skills live under **`.cursor/skills/<skill-name>/SKILL.md`**. Cursor loads them automatically when this folder is present in the workspace (rescan: restart Cursor or reload the window if a new skill does not appear).

**In the UI:** **Settings** → **Rules** → **Agent Decides** (or the skills list shown with project rules) lists discovered skills.

**In chat:** type **`/<skill-name>`** (e.g. `/neo-verify-gates`) or **`@`** and pick the skill to attach it.

| Skill | Path | Use when |
|------|------|----------|
| `neo-supabase-migration-pass` | `.cursor/skills/neo-supabase-migration-pass/SKILL.md` | Firebase → Supabase migration slices (`firebase.ts`, Firestore paths, NeuralContext, TaskLog, ChatInterface, `src/lib/supabase.ts`, etc.). |
| `neo-verify-gates` | `.cursor/skills/neo-verify-gates/SKILL.md` | After substantive changes: `npm ci` / `npm run lint` / `npm run build` and manual auth/data/AI checklist. |
| `neo-ui-preservation` | `.cursor/skills/neo-ui-preservation/SKILL.md` | TaskLog, ChatInterface, App.tsx, or styling that could break the HUD / Robot2D visual contract. |
| `neo-server-hardening` | `.cursor/skills/neo-server-hardening/SKILL.md` | `server.ts`: JWT auth, rate limits, Gemini allowlists, body limits, fail-closed env behavior. |

## Authoritative migration targets
- Auth provider: Supabase Auth with Google sign-in
- Data store: Supabase Postgres tables `tasks` and `messages`
- Server auth verification: Supabase JWT verification using JWKS or auth client verification strategy
- Protected AI routes remain server-side

## Files expected to change
- `package.json`
- `.env.example`
- `server.ts`
- `src/firebase.ts` -> replace with Supabase-aware auth/api helper module
- `src/firestore.ts` -> remove/replace with Supabase client module
- `src/context/NeuralContext.tsx`
- `src/components/TaskLog.tsx`
- `src/components/ChatInterface.tsx`

## Files expected to be removed after cutover
- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firestore.rules`
- any stale Firebase imports/usages

## Required verification gates after each task
- `npm ci`
- `npm run lint`
- `npm run build`
- signed-in auth flow works
- tasks CRUD works
- messages/history works
- protected AI routes still work while signed in
