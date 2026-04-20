/**
 * Discovery provider contracts: browser-safe probes vs future native Android input.
 *
 * Persistence and UI consume normalized {@link DeviceObservationInput} only.
 * Native wire shapes are normalized in {@link ../discovery/normalize.ts}.
 */

import type { BrowserProbeResult, PlatformCapabilities } from '../scanTypes';
import type { DeviceObservationInput, NativeDeviceObservation } from '../types';

/** Result of a single discovery collection pass (before DB upsert). */
export interface DiscoveryCollectionResult {
  /** Normalized observations ready for {@link upsertDeviceFromObservation}. */
  observations: DeviceObservationInput[];
  probes: BrowserProbeResult;
  capability: PlatformCapabilities;
  limitationNotes: string[];
  /** Which logical path produced `observations`. */
  scanPath: 'browser_safe' | 'native_android';
  /** Original native payloads when `scanPath === 'native_android'` (for audit metrics only). */
  nativeSourceObservations?: readonly NativeDeviceObservation[];
}

export interface BrowserSafeDiscoveryProvider {
  readonly kind: 'browser_safe';
  collect(capability: PlatformCapabilities): Promise<DiscoveryCollectionResult>;
}

export interface NativeAndroidDiscoveryProvider {
  readonly kind: 'native_android';
  /**
   * Collect observations from the native bridge when implemented.
   * Must return an empty list when the bridge is absent or yields no data — never fabricated hosts.
   */
  collect(capability: PlatformCapabilities): Promise<DiscoveryCollectionResult>;
}

export type NetworkDiscoveryProvider = BrowserSafeDiscoveryProvider | NativeAndroidDiscoveryProvider;
