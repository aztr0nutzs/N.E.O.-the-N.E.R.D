/**
 * Supabase-backed repository for {@link DeviceEvent}.
 *
 * Events are append-only. The underlying RLS policies intentionally omit
 * update/delete grants; repository functions here mirror that contract.
 */

import { supabase } from '../supabase';
import { EVENT_ROW_COLUMNS, mapEventRow, mapEventRows, type EventRow } from './mappers';
import type { DeviceEvent, DeviceEventCreateInput } from './types';

const TABLE = 'network_events';

export interface ListEventOptions {
  limit?: number;
  deviceId?: string;
  sinceIso?: string;
}

function assertUserId(userId: string): void {
  if (!userId) {
    throw new Error('network events repository requires an authenticated user id');
  }
}

export async function createDeviceEvent(
  userId: string,
  input: DeviceEventCreateInput,
): Promise<DeviceEvent> {
  assertUserId(userId);
  if (!input.eventType) {
    throw new Error('createDeviceEvent requires an eventType');
  }

  const payload = {
    user_id: userId,
    device_id: input.deviceId ?? null,
    scan_id: input.scanId ?? null,
    event_type: input.eventType,
    message: input.message ?? null,
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select(EVENT_ROW_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapEventRow(data as unknown as EventRow);
}

export async function listRecentDeviceEvents(
  userId: string,
  options: ListEventOptions = {},
): Promise<DeviceEvent[]> {
  assertUserId(userId);

  const limit = Math.max(1, Math.min(options.limit ?? 50, 500));
  let query = supabase
    .from(TABLE)
    .select(EVENT_ROW_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.deviceId) {
    query = query.eq('device_id', options.deviceId);
  }
  if (options.sinceIso) {
    query = query.gte('created_at', options.sinceIso);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return mapEventRows((data ?? []) as unknown as EventRow[]);
}

export async function listEventsForDevice(
  userId: string,
  deviceId: string,
  limit = 50,
): Promise<DeviceEvent[]> {
  return listRecentDeviceEvents(userId, { deviceId, limit });
}

/** Count events newer than `sinceIso`, optionally filtered by type. */
export async function countRecentDeviceEvents(
  userId: string,
  sinceIso: string,
  excludeTypes: readonly string[] = [],
): Promise<number> {
  assertUserId(userId);

  let query = supabase
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceIso);

  if (excludeTypes.length > 0) {
    query = query.not('event_type', 'in', `(${excludeTypes.map((t) => `"${t}"`).join(',')})`);
  }

  const { error, count } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
}
