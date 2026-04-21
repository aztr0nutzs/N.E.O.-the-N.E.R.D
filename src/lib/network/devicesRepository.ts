/**
 * Supabase-backed repository for {@link DeviceRecord}.
 *
 * User scoping: every function takes an explicit `userId` and filters every
 * query by `user_id`. This layer complements (does not replace) the RLS
 * policies in supabase/sql/005_network_intel_rls.sql — both must hold.
 */

import { supabase } from '../supabase';
import { DEVICE_ROW_COLUMNS, mapDeviceRow, mapDeviceRows, type DeviceRow } from './mappers';
import type {
  DeviceObservationInput,
  DeviceRecord,
  DeviceStateUpdate,
  DeviceStatus,
} from './types';

const TABLE = 'network_devices';

function assertUserId(userId: string): void {
  if (!userId) {
    throw new Error('network devices repository requires an authenticated user id');
  }
}

/** Returns every device owned by the user, most-recently-seen first. */
export async function listDevices(userId: string): Promise<DeviceRecord[]> {
  assertUserId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .select(DEVICE_ROW_COLUMNS)
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false });

  if (error) {
    throw error;
  }

  return mapDeviceRows((data ?? []) as unknown as DeviceRow[]);
}

/** Returns a single device by id, or null if not found / not owned by user. */
export async function getDevice(userId: string, id: string): Promise<DeviceRecord | null> {
  assertUserId(userId);
  if (!id) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select(DEVICE_ROW_COLUMNS)
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDeviceRow(data as unknown as DeviceRow) : null;
}

/**
 * Finds a device by its stable identity hints. Mirrors the upsert strategy:
 *  1. prefer match on `mac_address` (strongest identity), then
 *  2. fall back to `ip_address` when mac is unknown.
 * Returns null when neither hint is usable or no row exists yet.
 */
export async function findDeviceByIdentity(
  userId: string,
  identity: { macAddress?: string | null; ipAddress?: string | null },
): Promise<DeviceRecord | null> {
  assertUserId(userId);

  const mac = identity.macAddress?.trim() || null;
  if (mac) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(DEVICE_ROW_COLUMNS)
      .eq('user_id', userId)
      .eq('mac_address', mac)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (data) {
      return mapDeviceRow(data as unknown as DeviceRow);
    }
  }

  const ip = identity.ipAddress?.trim() || null;
  if (ip) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(DEVICE_ROW_COLUMNS)
      .eq('user_id', userId)
      .eq('ip_address', ip)
      .is('mac_address', null)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (data) {
      return mapDeviceRow(data as unknown as DeviceRow);
    }
  }

  return null;
}

/**
 * Insert a new device row or update the existing row that matches the
 * observation's identity. Returns the resulting record along with a flag
 * indicating whether this was the first time the user saw this device.
 */
export async function upsertDeviceFromObservation(
  userId: string,
  observation: DeviceObservationInput,
): Promise<{ device: DeviceRecord; isNew: boolean }> {
  assertUserId(userId);
  if (!observation.ipAddress) {
    throw new Error('device observation requires an ipAddress');
  }

  const observedAt = observation.observedAt ?? new Date().toISOString();
  const existing = await findDeviceByIdentity(userId, {
    macAddress: observation.macAddress ?? null,
    ipAddress: observation.ipAddress,
  });

  const status: DeviceStatus = observation.status ?? 'online';

  if (existing) {
    const updatePayload: Record<string, unknown> = {
      ip_address: observation.ipAddress,
      last_seen_at: observedAt,
      status,
    };
    if (observation.macAddress !== undefined && existing.macAddress === null) {
      updatePayload.mac_address = observation.macAddress;
    }
    if (observation.hostname !== undefined) {
      updatePayload.hostname = observation.hostname;
    }
    if (observation.vendor !== undefined) {
      updatePayload.vendor = observation.vendor;
    }
    if (observation.deviceType !== undefined) {
      updatePayload.device_type = observation.deviceType;
    }
    if (observation.metadata !== undefined) {
      updatePayload.metadata = observation.metadata;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(updatePayload)
      .eq('user_id', userId)
      .eq('id', existing.id)
      .select(DEVICE_ROW_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return { device: mapDeviceRow(data as unknown as DeviceRow), isNew: false };
  }

  const insertPayload = {
    user_id: userId,
    ip_address: observation.ipAddress,
    mac_address: observation.macAddress ?? null,
    hostname: observation.hostname ?? null,
    vendor: observation.vendor ?? null,
    device_type: observation.deviceType ?? null,
    status,
    first_seen_at: observedAt,
    last_seen_at: observedAt,
    metadata: observation.metadata ?? {},
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(insertPayload)
    .select(DEVICE_ROW_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return { device: mapDeviceRow(data as unknown as DeviceRow), isNew: true };
}

/**
 * Updates user-controlled state (label, trust/favorite/ignored flags, notes,
 * tags, category). Returns the updated record.
 */
export async function updateDeviceState(
  userId: string,
  id: string,
  patch: DeviceStateUpdate,
): Promise<DeviceRecord> {
  assertUserId(userId);
  if (!id) {
    throw new Error('updateDeviceState requires a device id');
  }

  const payload: Record<string, unknown> = {};
  if (patch.label !== undefined) payload.label = patch.label;
  if (patch.deviceType !== undefined) payload.device_type = patch.deviceType;
  if (patch.trusted !== undefined) payload.trusted = patch.trusted;
  if (patch.favorite !== undefined) payload.favorite = patch.favorite;
  if (patch.ignored !== undefined) payload.ignored = patch.ignored;
  if (patch.notes !== undefined) payload.notes = patch.notes;
  if (patch.tags !== undefined) payload.tags = patch.tags;

  if (Object.keys(payload).length === 0) {
    const current = await getDevice(userId, id);
    if (!current) {
      throw new Error('device not found');
    }
    return current;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('user_id', userId)
    .eq('id', id)
    .select(DEVICE_ROW_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapDeviceRow(data as unknown as DeviceRow);
}

/** Marks a device offline without inserting a new observation. */
export async function markDeviceOffline(
  userId: string,
  id: string,
  at: string = new Date().toISOString(),
): Promise<DeviceRecord> {
  assertUserId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'offline' as DeviceStatus, last_seen_at: at })
    .eq('user_id', userId)
    .eq('id', id)
    .select(DEVICE_ROW_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapDeviceRow(data as unknown as DeviceRow);
}

export async function deleteDevice(userId: string, id: string): Promise<void> {
  assertUserId(userId);

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) {
    throw error;
  }
}
