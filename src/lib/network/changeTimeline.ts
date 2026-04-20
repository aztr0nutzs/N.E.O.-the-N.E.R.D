import { listDevices } from './devicesRepository';
import { listRecentDeviceEvents } from './eventsRepository';
import { listRecentScanSnapshots } from './scansRepository';
import type {
  DeviceEvent,
  DeviceRecord,
  ScanSnapshot,
  ScanStatus,
} from './types';

export type NetworkTimelineSourceType = 'scan_snapshot' | 'device_event';

export type NetworkAlertCategory =
  | 'new_device_observed'
  | 'scan_started'
  | 'scan_limited'
  | 'scan_no_devices'
  | 'scan_completed'
  | 'scan_failed'
  | 'scan_aborted'
  | 'device_seen_again'
  | 'device_online_changed'
  | 'device_trust_changed'
  | 'device_favorite_changed'
  | 'device_ignore_changed'
  | 'device_label_changed'
  | 'device_deleted'
  | 'device_record_updated'
  | 'note';

export type NetworkAttentionState = 'attention' | 'info';

export interface NetworkTimelineItem {
  id: string;
  sourceType: NetworkTimelineSourceType;
  sourceId: string;
  category: NetworkAlertCategory;
  attention: NetworkAttentionState;
  title: string;
  body: string;
  occurredAt: string;
  deviceId: string | null;
  scanId: string | null;
  metadata: Record<string, unknown>;
}

export interface NetworkTimelineSummary {
  generatedAt: string;
  items: NetworkTimelineItem[];
  attentionItems: NetworkTimelineItem[];
  recentScans: ScanSnapshot[];
  recentEvents: DeviceEvent[];
  countsByCategory: Partial<Record<NetworkAlertCategory, number>>;
  summaryText: string;
}

export interface FetchNetworkTimelineOptions {
  limit?: number;
  scanLimit?: number;
  eventLimit?: number;
}

const DEFAULT_TIMELINE_LIMIT = 18;
const DEFAULT_SCAN_LIMIT = 8;
const DEFAULT_EVENT_LIMIT = 30;

function safeLimit(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(value ?? fallback, max));
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deviceTitle(device: DeviceRecord | undefined, event: DeviceEvent): string {
  if (device) {
    return device.label ?? device.hostname ?? device.ipAddress;
  }
  return event.deviceId ? `Device ${event.deviceId.slice(0, 8)}` : 'Device';
}

function metadataObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function metadataNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function metadataBoolean(metadata: Record<string, unknown>, key: string): boolean | null {
  const value = metadata[key];
  return typeof value === 'boolean' ? value : null;
}

function stateChangeBody(
  event: DeviceEvent,
  deviceName: string,
  key: 'trusted' | 'favorite' | 'ignored',
  enabledText: string,
  disabledText: string,
): string {
  const patch = metadataObject(event.metadata.patch);
  const nextValue = patch ? metadataBoolean(patch, key) : null;
  if (nextValue === true) return `${deviceName} was ${enabledText}.`;
  if (nextValue === false) return `${deviceName} was ${disabledText}.`;
  return event.message ?? `${deviceName} ${key} state changed.`;
}

function categoryForEvent(event: DeviceEvent): NetworkAlertCategory {
  switch (event.eventType) {
    case 'device_discovered':
      return 'new_device_observed';
    case 'device_seen':
      return 'device_seen_again';
    case 'device_went_offline':
    case 'device_became_online':
      return 'device_online_changed';
    case 'device_trust_changed':
      return 'device_trust_changed';
    case 'device_favorite_changed':
      return 'device_favorite_changed';
    case 'device_ignored_changed':
      return 'device_ignore_changed';
    case 'device_label_changed':
      return 'device_label_changed';
    case 'device_deleted':
      return 'device_deleted';
    case 'scan_started':
      return 'scan_started';
    case 'scan_limited':
      return 'scan_limited';
    case 'scan_completed': {
      return metadataNumber(event.metadata, 'observedDeviceCount') === 0
        ? 'scan_no_devices'
        : 'scan_completed';
    }
    case 'note':
      return 'note';
    default:
      return 'device_record_updated';
  }
}

function attentionForCategory(category: NetworkAlertCategory): NetworkAttentionState {
  switch (category) {
    case 'new_device_observed':
    case 'scan_limited':
    case 'scan_no_devices':
    case 'scan_failed':
    case 'scan_aborted':
    case 'device_online_changed':
    case 'device_trust_changed':
    case 'device_favorite_changed':
    case 'device_ignore_changed':
    case 'device_label_changed':
    case 'device_deleted':
      return 'attention';
    default:
      return 'info';
  }
}

function titleForEvent(category: NetworkAlertCategory): string {
  switch (category) {
    case 'new_device_observed':
      return 'New device observed';
    case 'scan_started':
      return 'Scan started';
    case 'scan_limited':
      return 'Scan limited';
    case 'scan_no_devices':
      return 'Scan completed with no observed devices';
    case 'scan_completed':
      return 'Scan completed';
    case 'device_seen_again':
      return 'Known device seen again';
    case 'device_online_changed':
      return 'Device online state changed';
    case 'device_trust_changed':
      return 'Trust state changed';
    case 'device_favorite_changed':
      return 'Favorite state changed';
    case 'device_ignore_changed':
      return 'Ignore state changed';
    case 'device_label_changed':
      return 'Device label changed';
    case 'device_deleted':
      return 'Device deleted';
    case 'scan_failed':
      return 'Scan failed';
    case 'scan_aborted':
      return 'Scan aborted';
    case 'device_record_updated':
      return 'Device record updated';
    case 'note':
      return 'Network note';
    default:
      return 'Network event';
  }
}

function bodyForEvent(
  event: DeviceEvent,
  category: NetworkAlertCategory,
  deviceLookup: ReadonlyMap<string, DeviceRecord>,
): string {
  const deviceName = event.deviceId ? deviceTitle(deviceLookup.get(event.deviceId), event) : 'Network scan';

  switch (category) {
    case 'new_device_observed':
      return event.message ?? `${deviceName} was newly observed by a real scan source.`;
    case 'device_seen_again':
      return event.message ?? `${deviceName} was observed again by a real scan source.`;
    case 'scan_limited':
      return event.message ?? 'Scan visibility was limited by browser/WebView platform constraints.';
    case 'scan_no_devices':
      return event.message
        ?? 'The scan stored zero observed devices. Under browser/WebView limits, this does not prove the LAN is empty.';
    case 'device_trust_changed':
      return stateChangeBody(event, deviceName, 'trusted', 'marked trusted', 'removed from trusted');
    case 'device_favorite_changed':
      return stateChangeBody(event, deviceName, 'favorite', 'marked favorite', 'removed from favorites');
    case 'device_ignore_changed':
      return stateChangeBody(event, deviceName, 'ignored', 'marked ignored', 'removed from ignored');
    case 'device_label_changed': {
      const patch = metadataObject(event.metadata.patch);
      const label = typeof patch?.label === 'string' && patch.label.trim() ? patch.label.trim() : null;
      return label ? `${deviceName} label changed to "${label}".` : event.message ?? `${deviceName} label changed.`;
    }
    case 'device_online_changed':
    case 'device_deleted':
    case 'scan_started':
    case 'scan_completed':
    case 'note':
    case 'device_record_updated':
    default:
      return event.message ?? `${deviceName}: ${event.eventType}.`;
  }
}

function itemFromEvent(
  event: DeviceEvent,
  deviceLookup: ReadonlyMap<string, DeviceRecord>,
): NetworkTimelineItem {
  const category = categoryForEvent(event);
  return {
    id: `event:${event.id}`,
    sourceType: 'device_event',
    sourceId: event.id,
    category,
    attention: attentionForCategory(category),
    title: titleForEvent(category),
    body: bodyForEvent(event, category, deviceLookup),
    occurredAt: event.createdAt,
    deviceId: event.deviceId,
    scanId: event.scanId,
    metadata: event.metadata,
  };
}

function categoryForScan(scan: ScanSnapshot): NetworkAlertCategory {
  if (scan.status === 'limited') return 'scan_limited';
  if (scan.status === 'failed') return 'scan_failed';
  if (scan.status === 'aborted') return 'scan_aborted';
  if (scan.status === 'completed' && scan.deviceCount === 0) return 'scan_no_devices';
  if (scan.status === 'completed') return 'scan_completed';
  if (scan.status === 'running' || scan.status === 'pending') return 'scan_started';
  return 'scan_completed';
}

function titleForScanStatus(status: ScanStatus, category: NetworkAlertCategory): string {
  if (category === 'scan_no_devices') return 'Scan completed with no observed devices';
  if (category === 'scan_limited') return 'Scan limited';
  if (category === 'scan_failed') return 'Scan failed';
  if (category === 'scan_aborted') return 'Scan aborted';
  if (status === 'running') return 'Scan running';
  if (status === 'pending') return 'Scan pending';
  return 'Scan completed';
}

function bodyForScan(scan: ScanSnapshot, category: NetworkAlertCategory): string {
  if (scan.summary) return scan.summary;
  if (category === 'scan_no_devices') {
    return 'The scan snapshot stored zero observations. This does not prove the LAN is empty under browser/WebView limits.';
  }
  if (category === 'scan_limited') {
    return 'The scan snapshot was finalized as limited by current platform constraints.';
  }
  return `Scan snapshot status: ${scan.status}; observed device count: ${scan.deviceCount}.`;
}

function itemFromScan(scan: ScanSnapshot): NetworkTimelineItem {
  const category = categoryForScan(scan);
  const occurredAt = scan.finishedAt ?? scan.startedAt;
  return {
    id: `scan:${scan.id}`,
    sourceType: 'scan_snapshot',
    sourceId: scan.id,
    category,
    attention: attentionForCategory(category),
    title: titleForScanStatus(scan.status, category),
    body: bodyForScan(scan, category),
    occurredAt,
    deviceId: null,
    scanId: scan.id,
    metadata: scan.metrics,
  };
}

function sortTimelineItems(items: NetworkTimelineItem[]): NetworkTimelineItem[] {
  return [...items].sort((a, b) => {
    const left = new Date(a.occurredAt).getTime();
    const right = new Date(b.occurredAt).getTime();
    return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
  });
}

function buildCounts(items: readonly NetworkTimelineItem[]): Partial<Record<NetworkAlertCategory, number>> {
  return items.reduce<Partial<Record<NetworkAlertCategory, number>>>((counts, item) => {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
    return counts;
  }, {});
}

function buildSummaryText(items: readonly NetworkTimelineItem[], attentionItems: readonly NetworkTimelineItem[]): string {
  if (items.length === 0) {
    return 'No scan snapshots or device events are stored yet.';
  }

  const latest = items[0];
  const attentionText = attentionItems.length > 0
    ? `${attentionItems.length} item(s) deserve review`
    : 'no review-worthy items in the recent timeline';

  return `Recent timeline: ${attentionText}. Latest: ${latest.title} at ${formatTime(latest.occurredAt)}.`;
}

export async function fetchNetworkTimeline(
  userId: string,
  options: FetchNetworkTimelineOptions = {},
): Promise<NetworkTimelineSummary> {
  if (!userId) {
    throw new Error('network timeline requires an authenticated user id');
  }

  const limit = safeLimit(options.limit, DEFAULT_TIMELINE_LIMIT, 100);
  const scanLimit = safeLimit(options.scanLimit, DEFAULT_SCAN_LIMIT, 50);
  const eventLimit = safeLimit(options.eventLimit, DEFAULT_EVENT_LIMIT, 200);

  const [devices, recentScans, recentEvents] = await Promise.all([
    listDevices(userId),
    listRecentScanSnapshots(userId, scanLimit),
    listRecentDeviceEvents(userId, { limit: eventLimit }),
  ]);

  const deviceLookup = new Map(devices.map((device) => [device.id, device]));
  const items = sortTimelineItems([
    ...recentScans.map(itemFromScan),
    ...recentEvents.map((event) => itemFromEvent(event, deviceLookup)),
  ]).slice(0, limit);
  const attentionItems = items.filter((item) => item.attention === 'attention');

  return {
    generatedAt: new Date().toISOString(),
    items,
    attentionItems,
    recentScans,
    recentEvents,
    countsByCategory: buildCounts(items),
    summaryText: buildSummaryText(items, attentionItems),
  };
}
