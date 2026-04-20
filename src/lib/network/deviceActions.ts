import { Capacitor } from '@capacitor/core';
import { getDevice, updateDeviceState } from './devicesRepository';
import { createDeviceEvent } from './eventsRepository';
import type {
  DeviceActionResult,
  DeviceActionState,
  DeviceActionType,
  DeviceEventType,
  DeviceRecord,
  DeviceStateUpdate,
} from './types';

const HTTP_PROBE_TIMEOUT_MS = 3000;
const FUTURE_NATIVE_ACTION_PLUGIN = 'NeoNetworkActions';

export interface DeviceActionRequest {
  actionType: DeviceActionType;
  value?: string | boolean | null;
  port?: number;
  url?: string;
  device?: DeviceRecord;
}

export interface DeviceHttpProbeOptions {
  port?: number;
  protocol?: 'http' | 'https';
  url?: string;
  device?: DeviceRecord;
}

function result(
  actionType: DeviceActionType,
  deviceId: string,
  state: DeviceActionState,
  success: boolean,
  message: string,
  data?: Record<string, unknown>,
): DeviceActionResult {
  return {
    actionType,
    deviceId,
    state,
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function metadataString(device: DeviceRecord, key: string): string | null {
  const value = device.metadata[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function bracketIpv6Host(host: string): string {
  if (host.includes(':') && !host.startsWith('[') && !host.endsWith(']')) {
    return `[${host}]`;
  }
  return host;
}

function validateHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function buildDeviceHttpUrl(device: DeviceRecord, options: DeviceHttpProbeOptions = {}): string | null {
  if (options.url) {
    return validateHttpUrl(options.url);
  }

  const metadataAdminUrl = metadataString(device, 'adminUrl');
  if (metadataAdminUrl) {
    const validated = validateHttpUrl(metadataAdminUrl);
    if (validated) return validated;
  }

  const host = normalizeText(device.hostname) ?? normalizeText(device.ipAddress);
  if (!host) return null;

  const protocol = options.protocol ?? (options.port === 443 ? 'https' : 'http');
  const port = options.port && options.port !== 80 && options.port !== 443 ? `:${options.port}` : '';
  return validateHttpUrl(`${protocol}://${bracketIpv6Host(host)}${port}/`);
}

function browserCanFetch(url: string): { ok: boolean; reason?: string } {
  if (typeof fetch !== 'function' || typeof AbortController !== 'function') {
    return { ok: false, reason: 'Fetch/AbortController is unavailable in this runtime.' };
  }
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'No browser window is available for this device action.' };
  }

  const parsed = new URL(url);
  if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
    return { ok: false, reason: 'HTTPS app context cannot truthfully probe HTTP device URLs because mixed content may be blocked.' };
  }

  return { ok: true };
}

async function loadDevice(userId: string, deviceId: string, knownDevice?: DeviceRecord): Promise<DeviceRecord> {
  if (knownDevice?.id === deviceId) return knownDevice;

  const device = await getDevice(userId, deviceId);
  if (!device) {
    throw new Error('device not found');
  }
  return device;
}

async function recordActionEvent(
  userId: string,
  deviceId: string,
  eventType: DeviceEventType,
  message: string,
  metadata: Record<string, unknown>,
): Promise<string | null> {
  try {
    const event = await createDeviceEvent(userId, {
      deviceId,
      eventType,
      message,
      metadata,
    });
    return event.id;
  } catch {
    return null;
  }
}

async function stateUpdateAction(
  userId: string,
  deviceId: string,
  actionType: DeviceActionType,
  patch: DeviceStateUpdate,
  eventType: DeviceEventType,
  message: string,
): Promise<DeviceActionResult> {
  const device = await updateDeviceState(userId, deviceId, patch);
  const eventId = await recordActionEvent(userId, deviceId, eventType, message, {
    actionType,
    patch,
  });

  return result(actionType, deviceId, 'real', true, message, {
    device,
    eventId,
  });
}

async function probeHttpUrl(url: string): Promise<{
  reached: boolean;
  responseType: string | null;
  status: number | null;
  latencyMs: number;
  error: string | null;
}> {
  const controller = new AbortController();
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const timeout = window.setTimeout(() => controller.abort(), HTTP_PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal,
    });
    const finished = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      reached: response.type === 'opaque' || response.ok || response.status > 0,
      responseType: response.type,
      status: response.status || null,
      latencyMs: Math.round(finished - started),
      error: null,
    };
  } catch (error) {
    const finished = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      reached: false,
      responseType: null,
      status: null,
      latencyMs: Math.round(finished - started),
      error: getErrorMessage(error),
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function setDeviceTrusted(
  userId: string,
  deviceId: string,
  trusted: boolean,
): Promise<DeviceActionResult> {
  return stateUpdateAction(
    userId,
    deviceId,
    'trust',
    { trusted },
    'device_trust_changed',
    trusted ? 'Device marked trusted.' : 'Device trust flag cleared.',
  );
}

export async function setDeviceFavorite(
  userId: string,
  deviceId: string,
  favorite: boolean,
): Promise<DeviceActionResult> {
  return stateUpdateAction(
    userId,
    deviceId,
    'favorite',
    { favorite },
    'device_favorite_changed',
    favorite ? 'Device marked favorite.' : 'Device favorite flag cleared.',
  );
}

export async function setDeviceIgnored(
  userId: string,
  deviceId: string,
  ignored: boolean,
): Promise<DeviceActionResult> {
  return stateUpdateAction(
    userId,
    deviceId,
    'ignore',
    { ignored },
    'device_ignored_changed',
    ignored ? 'Device marked ignored.' : 'Device ignore flag cleared.',
  );
}

export async function updateDeviceLabelAction(
  userId: string,
  deviceId: string,
  label: string | null,
): Promise<DeviceActionResult> {
  return stateUpdateAction(
    userId,
    deviceId,
    'label',
    { label: normalizeText(label) },
    'device_label_changed',
    normalizeText(label) ? 'Device label updated.' : 'Device label cleared.',
  );
}

export async function updateDeviceNotesAction(
  userId: string,
  deviceId: string,
  notes: string | null,
): Promise<DeviceActionResult> {
  return stateUpdateAction(
    userId,
    deviceId,
    'notes',
    { notes: normalizeText(notes) },
    'note',
    normalizeText(notes) ? 'Device notes updated.' : 'Device notes cleared.',
  );
}

export async function checkDeviceReachability(
  userId: string,
  deviceId: string,
  options: DeviceHttpProbeOptions = {},
): Promise<DeviceActionResult> {
  const device = await loadDevice(userId, deviceId);
  const url = buildDeviceHttpUrl(device, options);
  if (!url) {
    return result('ping', deviceId, 'unavailable', false, 'No valid HTTP(S) URL can be derived for this device.', {
      ipAddress: device.ipAddress,
      hostname: device.hostname,
    });
  }

  const availability = browserCanFetch(url);
  if (!availability.ok) {
    return result('ping', deviceId, 'unavailable', false, availability.reason ?? 'Browser fetch probe is unavailable.', {
      url,
    });
  }

  const probe = await probeHttpUrl(url);
  const message = probe.reached
    ? 'Browser HTTP reachability probe reached the device endpoint. This is not ICMP ping.'
    : 'Browser HTTP reachability probe could not reach the device endpoint. This does not prove the device is offline.';

  return result('ping', deviceId, 'partial', probe.reached, message, {
    url,
    probeKind: 'browser-http-fetch',
    ...probe,
  });
}

export async function openDeviceInterface(
  userId: string,
  deviceId: string,
  options: DeviceHttpProbeOptions = {},
): Promise<DeviceActionResult> {
  const device = options.device?.id === deviceId ? options.device : await loadDevice(userId, deviceId);
  const url = buildDeviceHttpUrl(device, options);
  if (!url) {
    return result('open_interface', deviceId, 'unavailable', false, 'No valid HTTP(S) interface URL is available for this device.', {
      ipAddress: device.ipAddress,
      hostname: device.hostname,
    });
  }

  if (typeof window === 'undefined' || typeof window.open !== 'function') {
    return result('open_interface', deviceId, 'unavailable', false, 'No browser window is available to open the device interface.', {
      url,
    });
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    return result('open_interface', deviceId, 'partial', false, 'Browser blocked the device interface window.', {
      url,
    });
  }

  return result('open_interface', deviceId, 'partial', true, 'Opened candidate device interface URL; admin availability is not verified.', {
    url,
  });
}

export async function checkDevicePort(
  userId: string,
  deviceId: string,
  port: number,
  protocol?: 'http' | 'https',
): Promise<DeviceActionResult> {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return result('port_check', deviceId, 'unavailable', false, 'Port check requires a TCP port from 1 to 65535.', {
      port,
    });
  }

  const device = await loadDevice(userId, deviceId);
  const url = buildDeviceHttpUrl(device, { port, protocol });
  if (!url) {
    return result('port_check', deviceId, 'unavailable', false, 'No valid HTTP(S) URL can be derived for this port check.', {
      port,
    });
  }

  const availability = browserCanFetch(url);
  if (!availability.ok) {
    return result('port_check', deviceId, 'unavailable', false, availability.reason ?? 'Browser port probe is unavailable.', {
      port,
      url,
    });
  }

  const probe = await probeHttpUrl(url);
  const message = probe.reached
    ? 'Browser HTTP(S) service probe reached the target port. This is not a raw TCP port scan.'
    : 'Browser HTTP(S) service probe could not reach the target port. This does not prove the port is closed.';

  return result('port_check', deviceId, 'partial', probe.reached, message, {
    port,
    url,
    probeKind: 'browser-http-fetch',
    ...probe,
  });
}

export async function wakeDevice(
  userId: string,
  deviceId: string,
): Promise<DeviceActionResult> {
  const device = await loadDevice(userId, deviceId);
  const nativeAvailable = Capacitor.isPluginAvailable(FUTURE_NATIVE_ACTION_PLUGIN);

  if (!nativeAvailable) {
    return result(
      'wake_on_lan',
      deviceId,
      'unavailable',
      false,
      'Wake-on-LAN is unavailable in this build; it requires a native or server-side packet sender.',
      {
        hasMacAddress: Boolean(device.macAddress),
        nativePlugin: FUTURE_NATIVE_ACTION_PLUGIN,
      },
    );
  }

  return result(
    'wake_on_lan',
    deviceId,
    'unavailable',
    false,
    'Wake-on-LAN native plugin contract is detected but no executor is wired in this MVP.',
    {
      hasMacAddress: Boolean(device.macAddress),
      nativePlugin: FUTURE_NATIVE_ACTION_PLUGIN,
    },
  );
}

export async function executeDeviceAction(
  userId: string,
  deviceId: string,
  request: DeviceActionRequest,
): Promise<DeviceActionResult> {
  switch (request.actionType) {
    case 'ping':
      return checkDeviceReachability(userId, deviceId, { url: request.url, device: request.device });
    case 'open_interface':
      return openDeviceInterface(userId, deviceId, { url: request.url, device: request.device });
    case 'port_check':
      return checkDevicePort(userId, deviceId, request.port ?? 80);
    case 'wake_on_lan':
      return wakeDevice(userId, deviceId);
    case 'trust':
      return setDeviceTrusted(userId, deviceId, Boolean(request.value));
    case 'favorite':
      return setDeviceFavorite(userId, deviceId, Boolean(request.value));
    case 'ignore':
      return setDeviceIgnored(userId, deviceId, Boolean(request.value));
    case 'label':
    case 'rename':
      return updateDeviceLabelAction(userId, deviceId, typeof request.value === 'string' ? request.value : null);
    case 'notes':
      return updateDeviceNotesAction(userId, deviceId, typeof request.value === 'string' ? request.value : null);
    default:
      return result(request.actionType, deviceId, 'unavailable', false, 'This device action is not wired in the MVP.', {
        request: isRecord(request) ? request : {},
      });
  }
}
