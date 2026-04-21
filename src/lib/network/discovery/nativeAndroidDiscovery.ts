/**
 * Native Android discovery path: consumes real NeoNetworkScanner observations only.
 */

import { collectBrowserProbes } from './browserProbes';
import { normalizeNativeObservations } from './normalize';
import {
  NeoNetworkScanner,
  type CollectSubnetObservationsResult,
  type NativeNetworkContext,
} from './neoNetworkScannerPlugin';
import type { DiscoveryCollectionResult, NativeAndroidDiscoveryProvider } from './providers';
import type { NativeDeviceObservation } from '../types';
import type { PlatformCapabilities } from '../scanTypes';

const DEFAULT_MAX_HOSTS = 24;
const DEFAULT_PROBE_TIMEOUT_MS = 350;
const DEFAULT_PROXIMITY_RADIUS = 12;

function appendStringNotes(target: string[], value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const note of value) {
    if (typeof note !== 'string') continue;
    const trimmed = note.trim();
    if (trimmed.length > 0) {
      target.push(trimmed);
    }
  }
}

function dedupeNotes(notes: readonly string[]): string[] {
  return [...new Set(notes.map((note) => note.trim()).filter(Boolean))];
}

function formatNetworkContext(context: NativeNetworkContext | null | undefined): string | null {
  if (!context || typeof context !== 'object') return null;

  const parts: string[] = [];
  if (context.interfaceName) {
    parts.push(`interface ${context.interfaceName}`);
  }
  if (context.localIpAddress) {
    parts.push(`local IP ${context.localIpAddress}`);
  }
  if (context.gatewayIpAddress) {
    parts.push(`gateway ${context.gatewayIpAddress}`);
  }
  if (typeof context.subnetPrefixLength === 'number') {
    parts.push(`/${context.subnetPrefixLength} subnet`);
  }
  if (typeof context.probedHostCount === 'number') {
    parts.push(`probed ${context.probedHostCount} host(s)`);
  }
  if (typeof context.reachableHostCount === 'number') {
    parts.push(`reachable ${context.reachableHostCount}`);
  }

  return parts.length > 0 ? `Native Android network context: ${parts.join(', ')}.` : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function collect(capability: PlatformCapabilities): Promise<DiscoveryCollectionResult> {
  const probes = await collectBrowserProbes(capability);
  const extraNotes: string[] = [];

  if (!capability.hasNativeLanScanner) {
    extraNotes.push('Native Android LAN scanner plugin is not registered on this build.');
    return {
      observations: [],
      probes,
      capability,
      limitationNotes: dedupeNotes([...capability.limitationNotes, ...extraNotes]),
      scanPath: 'native_android',
      nativeSourceObservations: [],
    };
  }

  try {
    const result: CollectSubnetObservationsResult = await NeoNetworkScanner.collectSubnetObservations({
      maxHosts: DEFAULT_MAX_HOSTS,
      probeTimeoutMs: DEFAULT_PROBE_TIMEOUT_MS,
      proximityRadius: DEFAULT_PROXIMITY_RADIUS,
      includeGateway: true,
    });

    const nativeSourceObservations: NativeDeviceObservation[] = Array.isArray(result?.observations)
      ? result.observations
      : [];
    const observations = normalizeNativeObservations(nativeSourceObservations);

    appendStringNotes(extraNotes, result?.limitationNotes);

    const contextNote = formatNetworkContext(result?.networkContext);
    if (contextNote) {
      extraNotes.push(contextNote);
    }
    if (nativeSourceObservations.length === 0) {
      extraNotes.push('Native Android discovery returned no reachable hosts in the bounded probe window.');
    }

    return {
      observations,
      probes,
      capability,
      limitationNotes: dedupeNotes([...capability.limitationNotes, ...extraNotes]),
      scanPath: 'native_android',
      nativeSourceObservations,
    };
  } catch (error) {
    extraNotes.push(`Native Android discovery bridge failed: ${getErrorMessage(error)}`);
    return {
      observations: [],
      probes,
      capability,
      limitationNotes: dedupeNotes([...capability.limitationNotes, ...extraNotes]),
      scanPath: 'native_android',
      nativeSourceObservations: [],
    };
  }
}

export const nativeAndroidDiscoveryProvider: NativeAndroidDiscoveryProvider = {
  kind: 'native_android',
  collect,
};
