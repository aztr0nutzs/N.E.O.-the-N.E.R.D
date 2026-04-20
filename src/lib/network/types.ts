/**
 * Canonical domain models for the N.E.O. network / device intelligence layer.
 *
 * These types are the single source of truth consumed by repository functions,
 * future scan-engine pipelines, future device action pipelines, and the
 * assistant summarization layer. UI-facing code should import from this file
 * rather than re-deriving shapes from Supabase row types.
 *
 * Persistence mapping:
 *   - DeviceRecord     <-> public.network_devices
 *   - ScanSnapshot     <-> public.network_scans
 *   - DeviceEvent      <-> public.network_events
 *   - NetworkSummary      computed on read from the tables above
 *   - DeviceActionResult  computed, NOT currently persisted
 */

/** Online state reported for a device from the most recent observation. */
export type DeviceStatus = 'online' | 'offline' | 'unknown';

/**
 * Canonical, free-form device category label. Kept as a string literal union
 * so the UI and assistant share a closed vocabulary for grouping / summaries,
 * while the database column itself stays a plain text field to allow future
 * additions without a migration.
 */
export type DeviceCategory =
  | 'router'
  | 'access_point'
  | 'computer'
  | 'phone'
  | 'tablet'
  | 'tv'
  | 'console'
  | 'iot'
  | 'printer'
  | 'camera'
  | 'server'
  | 'nas'
  | 'unknown';

/** Lifecycle state of a single scan invocation. */
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'aborted' | 'limited';

/** Event kinds written to public.network_events. Append-only. */
export type DeviceEventType =
  | 'device_discovered'
  | 'device_seen'
  | 'device_went_offline'
  | 'device_became_online'
  | 'device_trust_changed'
  | 'device_favorite_changed'
  | 'device_ignored_changed'
  | 'device_label_changed'
  | 'device_deleted'
  | 'scan_started'
  | 'scan_limited'
  | 'scan_completed'
  | 'note';

/**
 * Action vocabulary for the future device action executor. Not persisted yet,
 * but defined here so that the scan engine / assistant can plan actions against
 * a stable contract before the executor ships.
 */
export type DeviceActionType =
  | 'ping'
  | 'open_interface'
  | 'wake_on_lan'
  | 'port_check'
  | 'trust'
  | 'favorite'
  | 'ignore'
  | 'label'
  | 'notes'
  | 'rename'
  | 'delete'
  | 'rescan';

/** Truthfulness state for a device action execution path. */
export type DeviceActionState = 'real' | 'partial' | 'unavailable';

/**
 * A single discovered device owned by one user. `id` is a stable UUID minted
 * on first observation. `firstSeenAt` never moves; `lastSeenAt` advances with
 * each confirmed observation.
 */
export interface DeviceRecord {
  id: string;
  userId: string;
  ipAddress: string;
  macAddress: string | null;
  hostname: string | null;
  vendor: string | null;
  label: string | null;
  deviceType: DeviceCategory | null;
  status: DeviceStatus;
  trusted: boolean;
  favorite: boolean;
  ignored: boolean;
  notes: string | null;
  tags: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  /**
   * Free-form structured payload for scanner-specific hints (open ports, TTLs,
   * OS fingerprint guesses, etc.). Kept as a controlled JSON bag so additions
   * do not require migrations.
   */
  metadata: Record<string, unknown>;
}

/**
 * Where an observation entered the pipeline (browser probes vs native bridge).
 * Stored under `metadata` for auditability and assistant grounding.
 */
export type DiscoverySourceKind = 'browser_safe' | 'native_android';

/**
 * Optional per-field provenance when a native layer can prove some fields but not others.
 */
export type ObservationField =
  | 'ipAddress'
  | 'macAddress'
  | 'hostname'
  | 'vendor'
  | 'deviceType'
  | 'status';

/** How a field was obtained; `absent` means the field was not reported by the source. */
export type FieldProvenanceState = 'reported' | 'inferred' | 'absent';

/**
 * Wire-format from a future Android native discovery implementation (ARP/neighbor/scan).
 * Must not be persisted directly — normalize to {@link DeviceObservationInput} first.
 */
export interface NativeDeviceObservation {
  /** Idempotency hint for deduplication within a batch (native-generated, optional). */
  nativeObservationId?: string;
  ipAddress: string;
  observedAt?: string;
  macAddress?: string | null;
  hostname?: string | null;
  vendor?: string | null;
  deviceType?: DeviceCategory | null;
  status?: DeviceStatus;
  /**
   * Optional structured provenance from native code (never manufactured in JS).
   */
  fieldProvenance?: Partial<Record<ObservationField, FieldProvenanceState>>;
  metadata?: Record<string, unknown>;
}

/** Observation payload passed into {@link upsertDeviceFromObservation}. */
export interface DeviceObservationInput {
  ipAddress: string;
  macAddress?: string | null;
  hostname?: string | null;
  vendor?: string | null;
  deviceType?: DeviceCategory | null;
  status?: DeviceStatus;
  observedAt?: string;
  metadata?: Record<string, unknown>;
}

/** Partial state update for user-controlled device attributes. */
export interface DeviceStateUpdate {
  label?: string | null;
  deviceType?: DeviceCategory | null;
  trusted?: boolean;
  favorite?: boolean;
  ignored?: boolean;
  notes?: string | null;
  tags?: string[];
}

/**
 * One scan invocation. The row is created in `pending` / `running` state when
 * a scan starts and finalized via {@link finalizeScanSnapshot} when it ends.
 */
export interface ScanSnapshot {
  id: string;
  userId: string;
  startedAt: string;
  finishedAt: string | null;
  scope: string | null;
  deviceCount: number;
  status: ScanStatus;
  summary: string | null;
  metrics: Record<string, unknown>;
}

export interface ScanSnapshotCreateInput {
  scope?: string | null;
  status?: ScanStatus;
  startedAt?: string;
  metrics?: Record<string, unknown>;
}

export interface ScanSnapshotFinalizeInput {
  status: ScanStatus;
  finishedAt?: string;
  deviceCount?: number;
  summary?: string | null;
  metrics?: Record<string, unknown>;
}

/**
 * Append-only event row describing a meaningful change in device intelligence.
 * Consumers include history UI panels and the assistant (e.g. "what changed on
 * my network in the last hour?").
 */
export interface DeviceEvent {
  id: string;
  userId: string;
  deviceId: string | null;
  scanId: string | null;
  eventType: DeviceEventType;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DeviceEventCreateInput {
  deviceId?: string | null;
  scanId?: string | null;
  eventType: DeviceEventType;
  message?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Aggregate, read-only view of the user's current network intelligence state.
 * Computed from the devices / scans / events tables — not persisted.
 */
export interface NetworkSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  unknownDevices: number;
  trustedDevices: number;
  favoriteDevices: number;
  ignoredDevices: number;
  /** Devices first observed within the last 24 hours. */
  newDevices: number;
  /**
   * Heuristic: devices that are neither trusted, favorite, nor ignored. This is
   * the raw bucket the assistant should triage; actual "threat" classification
   * is a later phase.
   */
  unclassifiedDevices: number;
  /** Events created in the last 24 hours (excluding routine "seen" pings). */
  recentChanges: number;
  lastScan: ScanSnapshot | null;
  generatedAt: string;
}

/**
 * Canonical return shape for every device action executed by the future action
 * executor. Currently produced locally only — no persistence column today.
 */
export interface DeviceActionResult {
  actionType: DeviceActionType;
  deviceId: string;
  state: DeviceActionState;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}
