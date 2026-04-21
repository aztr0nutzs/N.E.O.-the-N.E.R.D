/**
 * Read-only aggregate view of a user's current network intelligence state.
 *
 * This module is intentionally service-shaped rather than a repository — the
 * {@link NetworkSummary} type is computed on read from rows in
 * `network_devices`, `network_scans`, and `network_events`. It is NOT a
 * persisted table.
 *
 * Consumers: future dashboard widgets, and the assistant grounding layer for
 * questions such as "what changed on my network?" or "what looks suspicious?".
 */

import { listDevices } from './devicesRepository';
import { countRecentDeviceEvents } from './eventsRepository';
import { getLastScanSnapshot } from './scansRepository';
import type { DeviceRecord, NetworkSummary } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Event types that are too routine to count as "a change" for the assistant's
 * purposes. `device_seen` fires on every observation and would drown out the
 * interesting signal.
 */
const ROUTINE_EVENT_TYPES: readonly string[] = ['device_seen'];

function tally(devices: readonly DeviceRecord[], nowMs: number) {
  let online = 0;
  let offline = 0;
  let unknown = 0;
  let trusted = 0;
  let favorite = 0;
  let ignored = 0;
  let unclassified = 0;
  let fresh = 0;

  for (const device of devices) {
    if (device.status === 'online') online += 1;
    else if (device.status === 'offline') offline += 1;
    else unknown += 1;

    if (device.trusted) trusted += 1;
    if (device.favorite) favorite += 1;
    if (device.ignored) ignored += 1;
    if (!device.trusted && !device.favorite && !device.ignored) {
      unclassified += 1;
    }

    const firstSeenMs = Date.parse(device.firstSeenAt);
    if (!Number.isNaN(firstSeenMs) && nowMs - firstSeenMs <= MS_PER_DAY) {
      fresh += 1;
    }
  }

  return { online, offline, unknown, trusted, favorite, ignored, unclassified, fresh };
}

/**
 * Fetches devices, the last scan snapshot, and the count of recent meaningful
 * events, and folds them into a single {@link NetworkSummary} value.
 *
 * User scoping is enforced transitively: every underlying repository call
 * filters by `user_id` AND relies on RLS on the same tables.
 */
export async function fetchNetworkSummary(userId: string): Promise<NetworkSummary> {
  if (!userId) {
    throw new Error('fetchNetworkSummary requires an authenticated user id');
  }

  const now = new Date();
  const nowMs = now.getTime();
  const since = new Date(nowMs - MS_PER_DAY).toISOString();

  const [devices, lastScan, recentChanges] = await Promise.all([
    listDevices(userId),
    getLastScanSnapshot(userId),
    countRecentDeviceEvents(userId, since, ROUTINE_EVENT_TYPES),
  ]);

  const counts = tally(devices, nowMs);

  return {
    totalDevices: devices.length,
    onlineDevices: counts.online,
    offlineDevices: counts.offline,
    unknownDevices: counts.unknown,
    trustedDevices: counts.trusted,
    favoriteDevices: counts.favorite,
    ignoredDevices: counts.ignored,
    newDevices: counts.fresh,
    unclassifiedDevices: counts.unclassified,
    recentChanges,
    lastScan,
    generatedAt: now.toISOString(),
  };
}

/**
 * Pure helper that derives a summary from a list of devices plus an optional
 * last-scan pointer and event count. Exposed so future code (e.g. the scan
 * engine or assistant grounding) can compose summaries without re-querying.
 */
export function summarizeDevices(
  devices: readonly DeviceRecord[],
  options: { lastScan?: NetworkSummary['lastScan']; recentChanges?: number; now?: Date } = {},
): NetworkSummary {
  const now = options.now ?? new Date();
  const counts = tally(devices, now.getTime());

  return {
    totalDevices: devices.length,
    onlineDevices: counts.online,
    offlineDevices: counts.offline,
    unknownDevices: counts.unknown,
    trustedDevices: counts.trusted,
    favoriteDevices: counts.favorite,
    ignoredDevices: counts.ignored,
    newDevices: counts.fresh,
    unclassifiedDevices: counts.unclassified,
    recentChanges: options.recentChanges ?? 0,
    lastScan: options.lastScan ?? null,
    generatedAt: now.toISOString(),
  };
}
