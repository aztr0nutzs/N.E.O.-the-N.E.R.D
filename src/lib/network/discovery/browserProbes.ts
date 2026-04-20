/**
 * Shared browser reachability probes (navigator, Network Information API, same-origin fetch).
 */

import type {
  BrowserProbeResult,
  NetworkInformationSnapshot,
  PlatformCapabilities,
} from '../scanTypes';

const SAME_ORIGIN_TIMEOUT_MS = 3000;

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

export async function collectBrowserProbes(capability: PlatformCapabilities): Promise<BrowserProbeResult> {
  const sameOrigin = await probeSameOriginReachability(capability);
  return {
    navigatorOnline:
      capability.canCheckBrowserOnline && typeof navigator !== 'undefined' ? navigator.onLine : null,
    networkInformation: readNetworkInformation(),
    sameOriginReachable: sameOrigin.reachable,
    sameOriginStatus: sameOrigin.status,
    sameOriginLatencyMs: sameOrigin.latencyMs,
    sameOriginError: sameOrigin.error,
  };
}

async function probeSameOriginReachability(capability: PlatformCapabilities): Promise<{
  reachable: boolean | null;
  status: number | null;
  latencyMs: number | null;
  error: string | null;
}> {
  if (!capability.canCheckSameOriginReachability || typeof window === 'undefined') {
    return { reachable: null, status: null, latencyMs: null, error: null };
  }

  const controller = new AbortController();
  const started = performance.now();
  const timeout = window.setTimeout(() => controller.abort(), SAME_ORIGIN_TIMEOUT_MS);

  try {
    const response = await fetch(window.location.origin, {
      cache: 'no-store',
      method: 'GET',
      signal: controller.signal,
    });
    return {
      reachable: response.ok,
      status: response.status,
      latencyMs: Math.round(performance.now() - started),
      error: null,
    };
  } catch (error) {
    return {
      reachable: false,
      status: null,
      latencyMs: Math.round(performance.now() - started),
      error: getErrorMessage(error),
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
