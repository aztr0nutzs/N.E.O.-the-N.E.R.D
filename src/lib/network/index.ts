/**
 * Public entry point for the N.E.O. network / device intelligence foundation.
 *
 * Consumers (UI, scan engine, assistant grounding) should import from
 * `src/lib/network` rather than the individual repository files to keep this
 * layer swappable.
 */

export type {
  DeviceActionResult,
  DeviceActionState,
  DeviceActionType,
  DeviceCategory,
  DeviceEvent,
  DeviceEventCreateInput,
  DeviceEventType,
  DeviceObservationInput,
  DeviceRecord,
  DeviceStateUpdate,
  DeviceStatus,
  NetworkSummary,
  ScanSnapshot,
  ScanSnapshotCreateInput,
  ScanSnapshotFinalizeInput,
  ScanStatus,
} from './types';

export {
  deleteDevice,
  findDeviceByIdentity,
  getDevice,
  listDevices,
  markDeviceOffline,
  updateDeviceState,
  upsertDeviceFromObservation,
} from './devicesRepository';

export {
  createScanSnapshot,
  finalizeScanSnapshot,
  getLastScanSnapshot,
  getScanSnapshot,
  listRecentScanSnapshots,
} from './scansRepository';

export {
  countRecentDeviceEvents,
  createDeviceEvent,
  listEventsForDevice,
  listRecentDeviceEvents,
} from './eventsRepository';

export { fetchNetworkSummary, summarizeDevices } from './networkSummary';

export type {
  BrowserProbeResult,
  NetworkInformationSnapshot,
  NetworkScanResult,
  PlatformCapabilities,
  RawDiscoveryResult,
  ScanCoordinatorStatus,
} from './scanService';

export {
  evaluatePlatformCapabilities,
  isNetworkScanRunning,
  scanCoordinator,
  startNetworkScan,
} from './scanService';

export type {
  DeviceActionRequest,
  DeviceHttpProbeOptions,
} from './deviceActions';

export {
  checkDevicePort,
  checkDeviceReachability,
  executeDeviceAction,
  openDeviceInterface,
  setDeviceFavorite,
  setDeviceIgnored,
  setDeviceTrusted,
  updateDeviceLabelAction,
  updateDeviceNotesAction,
  wakeDevice,
} from './deviceActions';
