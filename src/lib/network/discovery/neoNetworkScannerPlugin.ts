import { registerPlugin } from '@capacitor/core';
import type { NativeDeviceObservation } from '../types';

export interface NativeNetworkContext {
  interfaceName?: string | null;
  localIpAddress?: string | null;
  gatewayIpAddress?: string | null;
  subnetPrefixLength?: number | null;
  networkPrefixAddress?: string | null;
  usableHostCount?: number | null;
  probedHostCount?: number | null;
  reachableHostCount?: number | null;
  probeTimeoutMs?: number | null;
  proximityRadius?: number | null;
}

export interface CollectSubnetObservationsOptions {
  maxHosts?: number;
  probeTimeoutMs?: number;
  proximityRadius?: number;
  includeGateway?: boolean;
}

export interface CollectSubnetObservationsResult {
  observations: NativeDeviceObservation[];
  limitationNotes?: string[];
  networkContext?: NativeNetworkContext | null;
}

export interface NeoNetworkScannerPlugin {
  collectSubnetObservations(
    options?: CollectSubnetObservationsOptions,
  ): Promise<CollectSubnetObservationsResult>;
}

export const NeoNetworkScanner = registerPlugin<NeoNetworkScannerPlugin>('NeoNetworkScanner');
