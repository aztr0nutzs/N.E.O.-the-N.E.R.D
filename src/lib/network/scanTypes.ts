/**
 * Shared scan/capability shapes used by {@link scanService} and discovery providers.
 */

export interface NetworkInformationSnapshot {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface PlatformCapabilities {
  runtime: 'browser' | 'capacitor' | 'unknown';
  platform: string;
  hasNavigatorOnline: boolean;
  hasNetworkInformationApi: boolean;
  hasFetch: boolean;
  hasAbortController: boolean;
  hasNativeLanScanner: boolean;
  canCheckBrowserOnline: boolean;
  canCheckSameOriginReachability: boolean;
  canEnumerateLanDevices: boolean;
  canReadMacAddresses: boolean;
  canReadArpTable: boolean;
  canReadWifiNeighbors: boolean;
  limitationNotes: string[];
}

export interface BrowserProbeResult {
  navigatorOnline: boolean | null;
  networkInformation: NetworkInformationSnapshot | null;
  sameOriginReachable: boolean | null;
  sameOriginStatus: number | null;
  sameOriginLatencyMs: number | null;
  sameOriginError: string | null;
}
