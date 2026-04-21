-- 007_network_scan_engine_status.sql
-- Canonical scan-engine statuses/events needed by the browser-safe MVP.

alter table public.network_scans
  drop constraint if exists network_scans_status_check;

alter table public.network_scans
  add constraint network_scans_status_check
  check (status in ('pending', 'running', 'completed', 'failed', 'aborted', 'limited'));

alter table public.network_events
  drop constraint if exists network_events_event_type_check;

alter table public.network_events
  add constraint network_events_event_type_check
  check (event_type in (
    'device_discovered',
    'device_seen',
    'device_went_offline',
    'device_became_online',
    'device_trust_changed',
    'device_favorite_changed',
    'device_ignored_changed',
    'device_label_changed',
    'device_deleted',
    'scan_started',
    'scan_limited',
    'scan_completed',
    'note'
  ));
