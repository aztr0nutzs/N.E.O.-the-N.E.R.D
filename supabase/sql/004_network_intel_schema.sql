-- 004_network_intel_schema.sql
-- Foundation tables for the N.E.O. network / device intelligence layer.
-- Scope: durable storage for discovered devices, scan snapshots, and device events.
-- The scan engine itself and the action executor are implemented in later phases;
-- this migration only introduces the canonical persistence shape.

create extension if not exists pgcrypto;

-- network_devices
-- One row per (user, device identity) observed on that user's networks.
create table if not exists public.network_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address text not null,
  mac_address text,
  hostname text,
  vendor text,
  label text,
  device_type text,
  status text not null default 'unknown'
    check (status in ('online', 'offline', 'unknown')),
  trusted boolean not null default false,
  favorite boolean not null default false,
  ignored boolean not null default false,
  notes text,
  tags text[] not null default '{}',
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  constraint network_devices_ip_len check (char_length(ip_address) between 1 and 64),
  constraint network_devices_mac_len check (mac_address is null or char_length(mac_address) <= 64),
  constraint network_devices_hostname_len check (hostname is null or char_length(hostname) <= 255),
  constraint network_devices_vendor_len check (vendor is null or char_length(vendor) <= 255),
  constraint network_devices_label_len check (label is null or char_length(label) <= 255),
  constraint network_devices_device_type_len check (device_type is null or char_length(device_type) <= 64),
  constraint network_devices_notes_len check (notes is null or char_length(notes) <= 4000)
);

-- network_scans
-- One row per scan invocation a user performs against their network(s).
create table if not exists public.network_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  scope text,
  device_count integer not null default 0 check (device_count >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'aborted')),
  summary text,
  metrics jsonb not null default '{}'::jsonb,
  constraint network_scans_scope_len check (scope is null or char_length(scope) <= 255),
  constraint network_scans_summary_len check (summary is null or char_length(summary) <= 4000)
);

-- network_events
-- Append-only audit log of device intelligence changes, used to power history
-- panels and assistant questions like "what changed on my network?"
create table if not exists public.network_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.network_devices(id) on delete cascade,
  scan_id uuid references public.network_scans(id) on delete set null,
  event_type text not null
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
      'scan_completed',
      'note'
    )),
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint network_events_message_len check (message is null or char_length(message) <= 2000)
);
