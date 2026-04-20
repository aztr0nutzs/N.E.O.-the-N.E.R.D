import { Capacitor } from '@capacitor/core';
import { evaluateDiscoveryAvailability, selectDiscoveryProvider } from './discovery/capability';
import { listDevices, upsertDeviceFromObservation } from './devicesRepository';
import { createDeviceEvent } from './eventsRepository';
import {
  createScanSnapshot,
  finalizeScanSnapshot,
} from './scansRepository';
import type {
  BrowserProbeResult,
  NetworkInformationSnapshot,
  PlatformCapabilities,
} from './scanTypes';
import type {
  DeviceEvent,
  DeviceObservationInput,
  DeviceRecord,
  ScanSnapshot,
  ScanStatus,
} from './types';

export type ScanCoordinatorStatus = 'idle' | 'scanning' | 'completed' | 'failed' | 'limited';

export type {
  BrowserProbeResult,
  NetworkInformationSnapshot,
  PlatformCapabilities,
} from './scanTypes';

export interface RawDiscoveryResult {
  observations: DeviceObservationInput[];
  probes: BrowserProbeResult;
  capability: PlatformCapabilities;
  limitationNotes: string[];
  scanPath: 'browser_safe' | 'native_android';
  discoveryProviderKind: 'browser_safe' | 'native_android';
}

export interface NetworkScanResult {
  status: Exclude<ScanCoordinatorStatus, 'idle' | 'scanning'>;
  startedAt: string;
  finishedAt: string;
  scanSnapshot: ScanSnapshot | null;
  discoveredDevices: DeviceRecord[];
  knownDevices: DeviceRecord[];
  events: DeviceEvent[];
  capability: PlatformCapabilities;
  probes: BrowserProbeResult;
  limitationNotes: string[];
  summaryText: string;
  scanPath: RawDiscoveryResult['scanPath'];
  discoveryProviderKind: RawDiscoveryResult['discoveryProviderKind'];
}

const SCAN_SCOPE = 'browser-safe-network-visibility';
const ENGINE_VERSION = 'browser-safe-mvp-1';

function readNetworkInformation(): NetworkInformationSnapshot | null {
  if (typeof navigator === 'undefined') return null;
  const connection = (navigator as Navigator & { connection?: NetworkInformationSnapshot }).connection;
  if (!connection) return null;
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isHttpOrigin(origin: string): boolean {
  return origin.startsWith('http://') || origin.startsWith('https://');
}

export function evaluatePlatformCapabilities(): PlatformCapabilities {
  const hasWindow = typeof window !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';
  const platform = typeof Capacitor?.getPlatform === 'function' ? Capacitor.getPlatform() : 'unknown';
  const runtime = Capacitor.isNativePlatform()
    ? 'capacitor'
    : hasWindow && hasNavigator
      ? 'browser'
      : 'unknown';
  const hasFetch = typeof fetch === 'function';
  const hasAbortController = typeof AbortController === 'function';
  const discoveryAvailability = evaluateDiscoveryAvailability();
  const { nativeScannerPluginRegistered } = discoveryAvailability;
  const hasNativeLanScanner = nativeScannerPluginRegistered;
  const hasNetworkInformationApi = Boolean(
    hasNavigator && (navigator as Navigator & { connection?: NetworkInformationSnapshot }).connection,
  );
  const origin = hasWindow ? window.location.origin : '';
  const canCheckSameOriginReachability = hasFetch && hasAbortController && isHttpOrigin(origin);

  const limitationNotes = [
    'Browser and WebView sandboxes cannot enumerate arbitrary LAN hosts, ARP tables, Wi-Fi neighbors, MAC addresses, or vendor OUIs.',
  ];

  if (runtime === 'capacitor' && platform === 'android') {
    if (hasNativeLanScanner) {
      limitationNotes.push(
        'Native Android discovery performs bounded reachability probing plus local interface/gateway context; it does not guarantee MAC addresses, vendor OUIs, ARP tables, or Wi-Fi neighbor visibility.',
      );
    } else {
      limitationNotes.push('Capacitor Android is active, but this build exposes no native LAN scanner plugin.');
    }
  }

  if (!hasNetworkInformationApi) {
    limitationNotes.push('Network Information API hints are not exposed by this runtime.');
  }

  if (!canCheckSameOriginReachability) {
    limitationNotes.push('Same-origin reachability could not be probed from this runtime.');
  }

  limitationNotes.push('This MVP records real browser-visible probes and known inventory only; it does not synthesize devices.');

  const canEnumerateLanDevices = discoveryAvailability.useNativeAndroidDiscoveryPath;
  const canReadMacAddresses = false;
  const canReadArpTable = false;
  const canReadWifiNeighbors = false;

  return {
    runtime,
    platform,
    hasNavigatorOnline: hasNavigator && 'onLine' in navigator,
    hasNetworkInformationApi,
    hasFetch,
    hasAbortController,
    hasNativeLanScanner,
    canCheckBrowserOnline: hasNavigator && 'onLine' in navigator,
    canCheckSameOriginReachability,
    canEnumerateLanDevices,
    canReadMacAddresses,
    canReadArpTable,
    canReadWifiNeighbors,
    limitationNotes,
  };
}

async function runDiscovery(capability: PlatformCapabilities): Promise<RawDiscoveryResult> {
  const provider = selectDiscoveryProvider();
  const collected = await provider.collect(capability);
  return {
    observations: collected.observations,
    probes: collected.probes,
    capability: collected.capability,
    limitationNotes: collected.limitationNotes,
    scanPath: collected.scanPath,
    discoveryProviderKind: provider.kind,
  };
}

function buildSummary(raw: RawDiscoveryResult, discoveredCount: number, knownCount: number): string {
  const onlineState =
    raw.probes.navigatorOnline === null
      ? 'browser online state unavailable'
      : raw.probes.navigatorOnline
        ? 'browser reports online'
        : 'browser reports offline';
  const originState =
    raw.probes.sameOriginReachable === null
      ? 'same-origin probe unavailable'
      : raw.probes.sameOriginReachable
        ? 'same-origin probe reachable'
        : 'same-origin probe failed';

  const pathNote =
    raw.scanPath === 'native_android'
      ? 'Native Android discovery path selected; observations depend on the native bridge.'
      : 'Browser-safe discovery path; device observations require a native or server-side scanner for LAN visibility.';

  return [
    `Limited network visibility scan completed: ${onlineState}; ${originState}.`,
    `Observed ${discoveredCount} device(s) in this scan and refreshed ${knownCount} persisted inventory row(s).`,
    pathNote,
  ].join(' ');
}

function buildMetrics(raw: RawDiscoveryResult, discoveredCount: number, knownCount: number) {
  const discoveryAvailability = evaluateDiscoveryAvailability();
  return {
    engineVersion: ENGINE_VERSION,
    scope: SCAN_SCOPE,
    capability: raw.capability,
    probes: raw.probes,
    observedDeviceCount: discoveredCount,
    knownDeviceCount: knownCount,
    limitationNotes: raw.limitationNotes,
    scanPath: raw.scanPath,
    discoveryProviderKind: raw.discoveryProviderKind,
    discoveryAvailability,
  };
}

class ScanCoordinator {
  private activeScan: Promise<NetworkScanResult> | null = null;

  isScanning(): boolean {
    return this.activeScan !== null;
  }

  async startScan(userId: string): Promise<NetworkScanResult> {
    if (!userId) {
      throw new Error('network scan requires an authenticated user id');
    }
    if (this.activeScan) {
      throw new Error('network scan already running');
    }

    this.activeScan = this.executeScan(userId);
    try {
      return await this.activeScan;
    } finally {
      this.activeScan = null;
    }
  }

  private async executeScan(userId: string): Promise<NetworkScanResult> {
    const startedAt = new Date().toISOString();
    const capability = evaluatePlatformCapabilities();
    let scan: ScanSnapshot | null = null;
    const events: DeviceEvent[] = [];

    try {
      scan = await createScanSnapshot(userId, {
        scope: SCAN_SCOPE,
        status: 'running',
        startedAt,
        metrics: {
          engineVersion: ENGINE_VERSION,
          capability,
          limitationNotes: capability.limitationNotes,
          discoveryAvailability: evaluateDiscoveryAvailability(),
        },
      });

      events.push(
        await createDeviceEvent(userId, {
          scanId: scan.id,
          eventType: 'scan_started',
          message: 'Network scan started.',
          metadata: {
            engineVersion: ENGINE_VERSION,
            scope: SCAN_SCOPE,
            capability,
            discoveryAvailability: evaluateDiscoveryAvailability(),
          },
        }),
      );

      const raw = await runDiscovery(capability);
      const discoveredDevices: DeviceRecord[] = [];

      for (const observation of raw.observations) {
        const enriched: DeviceObservationInput = {
          ...observation,
          metadata: {
            ...(observation.metadata ?? {}),
            discoverySource:
              raw.scanPath === 'native_android' ? ('native_android' as const) : ('browser_safe' as const),
          },
        };
        const { device, isNew } = await upsertDeviceFromObservation(userId, enriched);
        discoveredDevices.push(device);
        events.push(
          await createDeviceEvent(userId, {
            deviceId: device.id,
            scanId: scan.id,
            eventType: isNew ? 'device_discovered' : 'device_seen',
            message: isNew ? 'New device detected by scan.' : 'Known device seen again by scan.',
            metadata: { observation: enriched },
          }),
        );
      }

      const knownDevices = await listDevices(userId);
      const summaryText = buildSummary(raw, discoveredDevices.length, knownDevices.length);
      const finalStatus: ScanStatus = raw.limitationNotes.length > 0 ? 'limited' : 'completed';
      const finishedAt = new Date().toISOString();
      const metrics = buildMetrics(raw, discoveredDevices.length, knownDevices.length);

      const finalizedScan = await finalizeScanSnapshot(userId, scan.id, {
        status: finalStatus,
        finishedAt,
        deviceCount: discoveredDevices.length,
        summary: summaryText,
        metrics,
      });

      if (finalStatus === 'limited') {
        events.push(
          await createDeviceEvent(userId, {
            scanId: finalizedScan.id,
            eventType: 'scan_limited',
            message: 'Scan limited by browser/WebView platform constraints.',
            metadata: { limitationNotes: raw.limitationNotes, capability },
          }),
        );
      }

      events.push(
        await createDeviceEvent(userId, {
          scanId: finalizedScan.id,
          eventType: 'scan_completed',
          message: summaryText,
          metadata: metrics,
        }),
      );

      return {
        status: finalStatus === 'limited' ? 'limited' : 'completed',
        startedAt,
        finishedAt,
        scanSnapshot: finalizedScan,
        discoveredDevices,
        knownDevices,
        events,
        capability,
        probes: raw.probes,
        limitationNotes: raw.limitationNotes,
        summaryText,
        scanPath: raw.scanPath,
        discoveryProviderKind: raw.discoveryProviderKind,
      };
    } catch (error) {
      const finishedAt = new Date().toISOString();
      const message = getErrorMessage(error);
      if (scan) {
        try {
          const failedScan = await finalizeScanSnapshot(userId, scan.id, {
            status: 'failed',
            finishedAt,
            deviceCount: 0,
            summary: `Network scan failed: ${message}`,
            metrics: {
              engineVersion: ENGINE_VERSION,
              capability,
              error: message,
            },
          });
          scan = failedScan;
          events.push(
            await createDeviceEvent(userId, {
              scanId: failedScan.id,
              eventType: 'note',
              message: `Network scan failed: ${message}`,
              metadata: { engineVersion: ENGINE_VERSION, error: message },
            }),
          );
        } catch {
          // If failure persistence also fails, return the original failure state below.
        }
      }

      const fallbackPath: RawDiscoveryResult['scanPath'] = 'browser_safe';
      const fallbackProvider: RawDiscoveryResult['discoveryProviderKind'] = 'browser_safe';

      return {
        status: 'failed',
        startedAt,
        finishedAt,
        scanSnapshot: scan,
        discoveredDevices: [],
        knownDevices: [],
        events,
        capability,
        probes: {
          navigatorOnline: capability.canCheckBrowserOnline && typeof navigator !== 'undefined' ? navigator.onLine : null,
          networkInformation: readNetworkInformation(),
          sameOriginReachable: null,
          sameOriginStatus: null,
          sameOriginLatencyMs: null,
          sameOriginError: null,
        },
        limitationNotes: capability.limitationNotes,
        summaryText: `Network scan failed: ${message}`,
        scanPath: fallbackPath,
        discoveryProviderKind: fallbackProvider,
      };
    }
  }
}

export const scanCoordinator = new ScanCoordinator();

export function isNetworkScanRunning(): boolean {
  return scanCoordinator.isScanning();
}

export function startNetworkScan(userId: string): Promise<NetworkScanResult> {
  return scanCoordinator.startScan(userId);
}
