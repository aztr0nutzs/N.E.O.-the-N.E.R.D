/**
 * Maps native discovery wire payloads into {@link DeviceObservationInput}.
 * JS must not invent MACs, vendors, or hostnames — only pass through native-reported values.
 */

import type {
  DeviceObservationInput,
  NativeDeviceObservation,
} from '../types';

function trimOrNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const t = String(value).trim();
  return t.length > 0 ? t : null;
}

/** Minimal sanity check — full validation belongs in native code. */
function isPlausibleIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

function isPlausibleIp(ip: string): boolean {
  if (isPlausibleIPv4(ip)) return true;
  if (ip.includes(':')) {
    const compact = ip.replace(/^\[|\]$/g, '');
    return compact.length >= 2 && compact.length <= 45;
  }
  return false;
}

export function normalizeNativeObservationToDeviceInput(
  native: NativeDeviceObservation,
): DeviceObservationInput | null {
  const ip = trimOrNull(native.ipAddress);
  if (!ip || !isPlausibleIp(ip)) {
    return null;
  }

  const observedAt = native.observedAt?.trim() || undefined;
  const macAddress = trimOrNull(native.macAddress);
  const hostname = trimOrNull(native.hostname);
  const vendor = trimOrNull(native.vendor);

  return {
    ipAddress: ip,
    observedAt,
    macAddress,
    hostname,
    vendor,
    deviceType: native.deviceType ?? null,
    status: native.status,
    metadata: {
      ...(native.metadata && typeof native.metadata === 'object' ? native.metadata : {}),
      discoverySource: 'native_android' as const,
      ...(native.nativeObservationId
        ? { nativeObservationId: native.nativeObservationId }
        : {}),
      ...(native.fieldProvenance ? { fieldProvenance: native.fieldProvenance } : {}),
    },
  };
}

export function normalizeNativeObservations(
  batch: readonly NativeDeviceObservation[],
): DeviceObservationInput[] {
  const out: DeviceObservationInput[] = [];
  for (const n of batch) {
    const normalized = normalizeNativeObservationToDeviceInput(n);
    if (normalized) {
      out.push(normalized);
    }
  }
  return out;
}
