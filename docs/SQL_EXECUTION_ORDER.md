# SQL Execution Order

Run these in order inside the Supabase SQL editor.

## Base (tasks + messages)
1. `supabase/sql/001_schema.sql`
2. `supabase/sql/002_rls.sql`
3. `supabase/sql/003_indexes_and_helpers.sql`

After running them:
- verify `tasks` and `messages` tables exist
- verify RLS is enabled on both
- verify Google-authenticated user can insert/select their own rows only

## Network / device intelligence foundation
4. `supabase/sql/004_network_intel_schema.sql`
5. `supabase/sql/005_network_intel_rls.sql`
6. `supabase/sql/006_network_intel_indexes.sql`

After running them:
- verify `network_devices`, `network_scans`, and `network_events` tables exist
- verify RLS is enabled on all three
- verify the partial unique indexes `uniq_network_devices_user_mac`
  and `uniq_network_devices_user_ip_no_mac` are present
- verify a Google-authenticated user can only read/write their own rows
- note: `network_events` has no update/delete RLS policies by design — it is
  append-only, with cleanup handled by cascade deletes from the parent device
  or user row

See `docs/NETWORK_INTEL_FOUNDATION.md` for the repository / service layer that
consumes these tables.
