/**
 * Chooses browser vs native Android discovery based on runtime and registered Capacitor plugin.
 */

import { Capacitor } from '@capacitor/core';
import { browserSafeDiscoveryProvider } from './browserSafeDiscovery';
import { nativeAndroidDiscoveryProvider } from './nativeAndroidDiscovery';
import type { BrowserSafeDiscoveryProvider, NativeAndroidDiscoveryProvider } from './providers';

const NATIVE_SCANNER_PLUGIN_ID = 'NeoNetworkScanner';

export interface DiscoveryAvailabilityState {
  /** True when Capacitor reports the NeoNetworkScanner plugin is registered. */
  nativeScannerPluginRegistered: boolean;
  /** True when the app should route discovery through the native Android provider strategy. */
  useNativeAndroidDiscoveryPath: boolean;
}

export function evaluateDiscoveryAvailability(): DiscoveryAvailabilityState {
  const platform = typeof Capacitor?.getPlatform === 'function' ? Capacitor.getPlatform() : 'unknown';
  const nativeScannerPluginRegistered = Capacitor.isPluginAvailable(NATIVE_SCANNER_PLUGIN_ID);
  const useNativeAndroidDiscoveryPath =
    Capacitor.isNativePlatform() && platform === 'android' && nativeScannerPluginRegistered;

  return {
    nativeScannerPluginRegistered,
    useNativeAndroidDiscoveryPath,
  };
}

export type SelectedDiscoveryProvider = BrowserSafeDiscoveryProvider | NativeAndroidDiscoveryProvider;

export function selectDiscoveryProvider(): SelectedDiscoveryProvider {
  const { useNativeAndroidDiscoveryPath } = evaluateDiscoveryAvailability();
  return useNativeAndroidDiscoveryPath ? nativeAndroidDiscoveryProvider : browserSafeDiscoveryProvider;
}
