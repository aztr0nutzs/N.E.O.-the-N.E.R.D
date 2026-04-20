/**
 * Browser/WebView-safe discovery: real connectivity probes only; no synthetic LAN hosts.
 */

import type { DiscoveryCollectionResult, BrowserSafeDiscoveryProvider } from './providers';
import type { PlatformCapabilities } from '../scanTypes';
import { collectBrowserProbes } from './browserProbes';

async function collect(
  capability: PlatformCapabilities,
): Promise<DiscoveryCollectionResult> {
  const probes = await collectBrowserProbes(capability);
  return {
    observations: [],
    probes,
    capability,
    limitationNotes: capability.limitationNotes,
    scanPath: 'browser_safe',
  };
}

export const browserSafeDiscoveryProvider: BrowserSafeDiscoveryProvider = {
  kind: 'browser_safe',
  collect,
};
