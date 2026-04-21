# Network / device intelligence foundation

This document describes the canonical data model and repository layer that
powers N.E.O.'s network / device intelligence surface. It is the **durable
foundation** that later phases (real scan engine, device action executor,
assistant grounding) build on top of.

This pass is deliberately limited:

- no scan engine
- no device action executor
- no UI rewiring
- no fake telemetry

It only introduces the canonical models, Supabase-backed repositories, and a
read-only summary service.

## Tables (see `supabase/sql/004..006`)

| Table              | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `network_devices`  | One row per device observed on a user's network(s).                |
| `network_scans`    | One row per scan invocation (started/finished, status, summary).   |
| `network_events`   | Append-only log of meaningful device changes + scan completions.   |

All three tables:

- own their data by `user_id uuid references auth.users(id) on delete cascade`,
- enforce RLS: `auth.uid() = user_id` for select/insert/update/delete,
- are indexed for the dominant list query (`user_id, <timestamp> desc`).

`network_events` intentionally has no update/delete RLS policies; it is
append-only and cleaned up transitively via cascade delete.

## Canonical models (see `src/lib/network/types.ts`)

| Model                 | Persistence                                                     |
| --------------------- | --------------------------------------------------------------- |
| `DeviceRecord`        | Persisted in `network_devices`.                                 |
| `ScanSnapshot`        | Persisted in `network_scans`.                                   |
| `DeviceEvent`         | Persisted in `network_events` (append-only).                    |
| `NetworkSummary`      | **Computed on read** from the three tables above.               |
| `DeviceActionResult`  | **Not persisted** — canonical shape for the future executor.    |

String-literal unions (`DeviceStatus`, `ScanStatus`, `DeviceEventType`,
`DeviceCategory`, `DeviceActionType`) are enforced at the type layer and, where
practical, at the database layer via `check` constraints. The mapper in
`src/lib/network/mappers.ts` normalizes any unexpected string back to a safe
default so the UI never has to handle literal drift.

## Repository / service layer (see `src/lib/network/`)

```
src/lib/network/
  index.ts              -- barrel re-export; import from here
  types.ts              -- canonical domain models
  mappers.ts            -- row <-> model narrowing, column constants
  devicesRepository.ts  -- list / get / upsert / update / mark offline / delete
  scansRepository.ts    -- create / finalize / list recent / get last
  eventsRepository.ts   -- createDeviceEvent / list recent / count recent
  networkSummary.ts     -- fetchNetworkSummary + pure summarizeDevices helper
```

Every repository function takes an explicit `userId: string` and filters every
query by `user_id`. This complements the Supabase RLS policies — both must hold.

### Devices

- `listDevices(userId)` — most-recently-seen first
- `getDevice(userId, id)` — nullable
- `findDeviceByIdentity(userId, { macAddress, ipAddress })` — MAC-first,
  IP-fallback
- `upsertDeviceFromObservation(userId, observation)` — update-if-exists,
  insert-if-new, returns `{ device, isNew }`
- `updateDeviceState(userId, id, { trusted, favorite, ignored, label, notes, tags, deviceType })`
- `markDeviceOffline(userId, id, at?)`
- `deleteDevice(userId, id)`

### Scans

- `createScanSnapshot(userId, { scope?, status?, startedAt?, metrics? })`
- `finalizeScanSnapshot(userId, id, { status, finishedAt?, deviceCount?, summary?, metrics? })`
- `getScanSnapshot(userId, id)`
- `listRecentScanSnapshots(userId, limit?)`
- `getLastScanSnapshot(userId)`

### Events

- `createDeviceEvent(userId, { eventType, deviceId?, scanId?, message?, metadata? })`
- `listRecentDeviceEvents(userId, { limit?, deviceId?, sinceIso? })`
- `listEventsForDevice(userId, deviceId, limit?)`
- `countRecentDeviceEvents(userId, sinceIso, excludeTypes?)`

### Summary

- `fetchNetworkSummary(userId)` — asynchronously folds devices + last scan +
  recent events into a `NetworkSummary`.
- `summarizeDevices(devices, { lastScan?, recentChanges?, now? })` — pure
  helper for use by the future scan engine / assistant grounding layer.

## Assistant compatibility

The foundation is shaped so future assistant questions map to cheap lookups:

| Question                              | Primary source                             |
| ------------------------------------- | ------------------------------------------ |
| "What changed on my network?"         | `listRecentDeviceEvents` + `NetworkSummary.recentChanges` |
| "What devices are new?"               | `NetworkSummary.newDevices` / `firstSeenAt` scan |
| "What devices are trusted?"           | `listDevices` filtered by `trusted`        |
| "What looks suspicious?"              | `NetworkSummary.unclassifiedDevices` + `listDevices` where `!trusted && !ignored` |
| "What happened in the last scan?"     | `getLastScanSnapshot` + `listRecentDeviceEvents({ sinceIso: lastScan.startedAt })` |

No assistant code is added in this pass; the shapes above are the contract.

## Future integration notes

1. **Scan engine**: on scan start, call `createScanSnapshot`. For each
   observation, call `upsertDeviceFromObservation`; emit `device_discovered` /
   `device_seen` / `device_became_online` / `device_went_offline` via
   `createDeviceEvent`. On scan end, call `finalizeScanSnapshot` and emit one
   `scan_completed` event.

2. **Device actions**: the future executor should return `DeviceActionResult`
   values. When it ships, decide whether to add a `network_action_log` table
   or fold results into `network_events` — the current vocabulary already has
   `metadata` room for either.

3. **UI**: the Mission Control discovery screens (`NetworkScreen`,
   `mission/NerdDeviceDiscoveryMission`) can read from `listDevices` and
   `fetchNetworkSummary` without any layout churn. This pass does NOT wire
   them — that is a later UI task, explicitly out of scope here per the
   frozen-HUD contract in `AGENTS.md`.
