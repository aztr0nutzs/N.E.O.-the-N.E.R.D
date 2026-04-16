# SQL Execution Order

Run these in order inside the Supabase SQL editor.

1. `supabase/sql/001_schema.sql`
2. `supabase/sql/002_rls.sql`
3. `supabase/sql/003_indexes_and_helpers.sql`

After running them:
- verify `tasks` and `messages` tables exist
- verify RLS is enabled on both
- verify Google-authenticated user can insert/select their own rows only
