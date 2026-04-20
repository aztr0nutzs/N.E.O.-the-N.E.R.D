-- 005_network_intel_rls.sql
-- Row Level Security for the network / device intelligence tables.
-- Mirrors the ownership model used for public.tasks and public.messages.

alter table public.network_devices enable row level security;
alter table public.network_scans enable row level security;
alter table public.network_events enable row level security;

-- network_devices
drop policy if exists "network_devices_select_own" on public.network_devices;
create policy "network_devices_select_own"
  on public.network_devices for select
  using (auth.uid() = user_id);

drop policy if exists "network_devices_insert_own" on public.network_devices;
create policy "network_devices_insert_own"
  on public.network_devices for insert
  with check (auth.uid() = user_id);

drop policy if exists "network_devices_update_own" on public.network_devices;
create policy "network_devices_update_own"
  on public.network_devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "network_devices_delete_own" on public.network_devices;
create policy "network_devices_delete_own"
  on public.network_devices for delete
  using (auth.uid() = user_id);

-- network_scans
drop policy if exists "network_scans_select_own" on public.network_scans;
create policy "network_scans_select_own"
  on public.network_scans for select
  using (auth.uid() = user_id);

drop policy if exists "network_scans_insert_own" on public.network_scans;
create policy "network_scans_insert_own"
  on public.network_scans for insert
  with check (auth.uid() = user_id);

drop policy if exists "network_scans_update_own" on public.network_scans;
create policy "network_scans_update_own"
  on public.network_scans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "network_scans_delete_own" on public.network_scans;
create policy "network_scans_delete_own"
  on public.network_scans for delete
  using (auth.uid() = user_id);

-- network_events
drop policy if exists "network_events_select_own" on public.network_events;
create policy "network_events_select_own"
  on public.network_events for select
  using (auth.uid() = user_id);

drop policy if exists "network_events_insert_own" on public.network_events;
create policy "network_events_insert_own"
  on public.network_events for insert
  with check (auth.uid() = user_id);

-- events are append-only; update/delete policies intentionally omitted so that
-- RLS denies those operations by default (except for the implicit cascade
-- deletes triggered when the parent device or user row is removed).
