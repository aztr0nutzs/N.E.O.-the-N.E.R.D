/**
 * Future native Android discovery path: consumes real bridge output only.
 * This pass wires the contract and returns empty observations until the plugin is implemented.
 */

import { collectBrowserProbes } from './browserProbes';
import type { DiscoveryCollectionResult, NativeAndroidDiscoveryProvider } from './providers';
import type { PlatformCapabilities } from '../scanTypes';

async function collect(capability: PlatformCapabilities): Promise<DiscoveryCollectionResult> {
  const probes = await collectBrowserProbes(capability);
  const extraNotes: string[] = [];

  if (capability.hasNativeLanScanner) {
    extraNotes.push(
      'NeoNetworkScanner native module is present; observation bridge calls are not wired in this TypeScript pass.',
    );
  } else {
    extraNotes.push('Native Android LAN scanner plugin is not registered on this build.');
  }

  // Future: await Capacitor plugin invoke → normalizeNativeObservations(batch).
  return {
    observations: [],
    probes,
    capability,
    limitationNotes: [...capability.limitationNotes, ...extraNotes],
    scanPath: 'native_android',
    nativeSourceObservations: [],
  };
}

export const nativeAndroidDiscoveryProvider: NativeAndroidDiscoveryProvider = {
  kind: 'native_android',
  collect,
};
