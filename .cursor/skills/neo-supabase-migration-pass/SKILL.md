---
name: neo-supabase-migration-pass
description: >-
  Executes a disciplined Firebase-to-Supabase migration slice for N.E.O.
  (browser client, auth session and server tokens, tasks, messages, Firebase
  cleanup). Applies when editing src/firebase.ts, Firestore paths, NeuralContext,
  TaskLog, ChatInterface, or Supabase library modules (e.g. src/lib/supabase.ts).
---

# Supabase migration pass

## When to use

Use for a **single migration slice** (one stage or tightly related changes), not a wholesale rewrite in one pass. Prefer reading this skill at the start of the slice and again before cleanup.

## Preconditions

1. Read, if present:
   - Root `AGENTS.md`
   - `docs/TARGET_SUPABASE_ARCHITECTURE.md`
   - `docs/SQL_EXECUTION_ORDER.md`
2. Map Firebase usage: grep for `src/firebase.ts`, Firestore helpers, and any re-exports; note every runtime import site before changing behavior.

## Order of operations (default)

1. **Browser Supabase client** — Implement or extend the agreed single module (default: `src/lib/supabase.ts`).
2. **Auth session + token** — Wire session for server calls; preserve redirect/OAuth behavior unless the task explicitly changes it.
3. **Tasks** — Back with `public.tasks` and RLS policies consistent with the architecture docs.
4. **Messages** — Back with `public.messages` and RLS consistent with the architecture docs.
5. **Remove dead Firebase** — Only after grep shows **zero** runtime imports of the old paths, and automated gates pass.

## Rules

- **No anonymous fallback tokens** for AI or privileged server calls.
- **File-scoped edits** — Touch only files required for the slice; avoid drive-by UI or unrelated refactors.
- **RLS and schema** — Follow `docs/SQL_EXECUTION_ORDER.md` and `docs/TARGET_SUPABASE_ARCHITECTURE.md` when adding tables, policies, or RPC.

## Completion

1. Run verification per [neo-verify-gates](../neo-verify-gates/SKILL.md): `npm ci` (or documented `npm install` skip), `npm run lint`, `npm run build`, plus the manual checklist with pass / fail / not tested.
2. Report:
   - **Files changed** (paths).
   - **Migration stage completed**: one of `auth` | `tasks` | `messages` | `cleanup` (or combination if the task explicitly covered multiple stages in one PR-sized slice).
