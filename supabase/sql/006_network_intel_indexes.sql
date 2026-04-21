-- 006_network_intel_indexes.sql
-- Indexes matching app query patterns for the network intelligence tables.

-- Device lookup by most-recent activity (drives list views and summaries).
create index if not exists idx_network_devices_user_last_seen
  on public.network_devices(user_id, last_seen_at desc);

-- Status filtering for "online / offline / unknown" counts.
create index if not exists idx_network_devices_user_status
  on public.network_devices(user_id, status);

-- Identity lookups used by upserts:
--  * mac_address is the strongest identity when present,
--  * ip_address is the fallback when mac is unknown.
create unique index if not exists uniq_network_devices_user_mac
  on public.network_devices(user_id, mac_address)
  where mac_address is not null;

create unique index if not exists uniq_network_devices_user_ip_no_mac
  on public.network_devices(user_id, ip_address)
  where mac_address is null;

-- Scan listings: most recent first.
create index if not exists idx_network_scans_user_started_at
  on public.network_scans(user_id, started_at desc);

-- Event listings (global and per-device), most recent first.
create index if not exists idx_network_events_user_created_at
  on public.network_events(user_id, created_at desc);

create index if not exists idx_network_events_device_created_at
  on public.network_events(device_id, created_at desc);
