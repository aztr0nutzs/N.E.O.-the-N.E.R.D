/**
 * Row <-> model mappers for the network intelligence layer.
 *
 * All Supabase rows are treated as unknown-shaped payloads and narrowed here so
 * every other module consumes strongly-typed {@link DeviceRecord},
 * {@link ScanSnapshot}, and {@link DeviceEvent} values.
 */

import type {
  DeviceCategory,
  DeviceEvent,
  DeviceEventType,
  DeviceRecord,
  DeviceStatus,
  ScanSnapshot,
  ScanStatus,
} from './types';

// Intentionally wide shapes: Supabase JS does not ship typed generics on this
// branch, and the column set is authoritative via migrations rather than
// generated types.
interface DeviceRow {
  id: string;
  user_id: string;
  ip_address: string;
  mac_address: string | null;
  hostname: string | null;
  vendor: string | null;
  label: string | null;
  device_type: string | null;
  status: string;
  trusted: boolean;
  favorite: boolean;
  ignored: boolean;
  notes: string | null;
  tags: string[] | null;
  first_seen_at: string;
  last_seen_at: string;
  metadata: Record<string, unknown> | null;
}

interface ScanRow {
  id: string;
  user_id: string;
  started_at: string;
  finished_at: string | null;
  scope: string | null;
  device_count: number;
  status: string;
  summary: string | null;
  metrics: Record<string, unknown> | null;
}

interface EventRow {
  id: string;
  user_id: string;
  device_id: string | null;
  scan_id: string | null;
  event_type: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const DEVICE_STATUSES: readonly DeviceStatus[] = ['online', 'offline', 'unknown'];
const SCAN_STATUSES: readonly ScanStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
  'aborted',
];
const EVENT_TYPES: readonly DeviceEventType[] = [
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
  'note',
];
const DEVICE_CATEGORIES: readonly DeviceCategory[] = [
  'router',
  'access_point',
  'computer',
  'phone',
  'tablet',
  'tv',
  'console',
  'iot',
  'printer',
  'camera',
  'server',
  'nas',
  'unknown',
];

function normalizeDeviceStatus(value: string): DeviceStatus {
  return (DEVICE_STATUSES as readonly string[]).includes(value)
    ? (value as DeviceStatus)
    : 'unknown';
}

function normalizeScanStatus(value: string): ScanStatus {
  return (SCAN_STATUSES as readonly string[]).includes(value)
    ? (value as ScanStatus)
    : 'pending';
}

function normalizeEventType(value: string): DeviceEventType {
  return (EVENT_TYPES as readonly string[]).includes(value)
    ? (value as DeviceEventType)
    : 'note';
}

function normalizeDeviceCategory(value: string | null): DeviceCategory | null {
  if (value === null || value === undefined) return null;
  return (DEVICE_CATEGORIES as readonly string[]).includes(value)
    ? (value as DeviceCategory)
    : 'unknown';
}

export function mapDeviceRow(row: DeviceRow): DeviceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    ipAddress: row.ip_address,
    macAddress: row.mac_address,
    hostname: row.hostname,
    vendor: row.vendor,
    label: row.label,
    deviceType: normalizeDeviceCategory(row.device_type),
    status: normalizeDeviceStatus(row.status),
    trusted: row.trusted,
    favorite: row.favorite,
    ignored: row.ignored,
    notes: row.notes,
    tags: Array.isArray(row.tags) ? row.tags : [],
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    metadata: row.metadata ?? {},
  };
}

export function mapDeviceRows(rows: readonly DeviceRow[]): DeviceRecord[] {
  return rows.map(mapDeviceRow);
}

export function mapScanRow(row: ScanRow): ScanSnapshot {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    scope: row.scope,
    deviceCount: row.device_count,
    status: normalizeScanStatus(row.status),
    summary: row.summary,
    metrics: row.metrics ?? {},
  };
}

export function mapScanRows(rows: readonly ScanRow[]): ScanSnapshot[] {
  return rows.map(mapScanRow);
}

export function mapEventRow(row: EventRow): DeviceEvent {
  return {
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id,
    scanId: row.scan_id,
    eventType: normalizeEventType(row.event_type),
    message: row.message,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export function mapEventRows(rows: readonly EventRow[]): DeviceEvent[] {
  return rows.map(mapEventRow);
}

/** Column list used by repository selects — keep in sync with migrations. */
export const DEVICE_ROW_COLUMNS =
  'id, user_id, ip_address, mac_address, hostname, vendor, label, device_type, ' +
  'status, trusted, favorite, ignored, notes, tags, first_seen_at, last_seen_at, metadata';

export const SCAN_ROW_COLUMNS =
  'id, user_id, started_at, finished_at, scope, device_count, status, summary, metrics';

export const EVENT_ROW_COLUMNS =
  'id, user_id, device_id, scan_id, event_type, message, metadata, created_at';

export type { DeviceRow, ScanRow, EventRow };
