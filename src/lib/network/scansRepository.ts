/**
 * Supabase-backed repository for {@link ScanSnapshot}.
 *
 * A ScanSnapshot is created at the start of a scan (status `pending` or
 * `running`) and finalized when the scan completes, aborts, or fails.
 */

import { supabase } from '../supabase';
import { mapScanRow, mapScanRows, SCAN_ROW_COLUMNS, type ScanRow } from './mappers';
import type {
  ScanSnapshot,
  ScanSnapshotCreateInput,
  ScanSnapshotFinalizeInput,
} from './types';

const TABLE = 'network_scans';

function assertUserId(userId: string): void {
  if (!userId) {
    throw new Error('network scans repository requires an authenticated user id');
  }
}

export async function createScanSnapshot(
  userId: string,
  input: ScanSnapshotCreateInput = {},
): Promise<ScanSnapshot> {
  assertUserId(userId);

  const payload = {
    user_id: userId,
    started_at: input.startedAt ?? new Date().toISOString(),
    scope: input.scope ?? null,
    status: input.status ?? 'running',
    metrics: input.metrics ?? {},
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select(SCAN_ROW_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapScanRow(data as unknown as ScanRow);
}

export async function finalizeScanSnapshot(
  userId: string,
  id: string,
  input: ScanSnapshotFinalizeInput,
): Promise<ScanSnapshot> {
  assertUserId(userId);
  if (!id) {
    throw new Error('finalizeScanSnapshot requires a scan id');
  }

  const payload: Record<string, unknown> = {
    status: input.status,
    finished_at: input.finishedAt ?? new Date().toISOString(),
  };
  if (input.deviceCount !== undefined) payload.device_count = input.deviceCount;
  if (input.summary !== undefined) payload.summary = input.summary;
  if (input.metrics !== undefined) payload.metrics = input.metrics;

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('user_id', userId)
    .eq('id', id)
    .select(SCAN_ROW_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapScanRow(data as unknown as ScanRow);
}

export async function getScanSnapshot(
  userId: string,
  id: string,
): Promise<ScanSnapshot | null> {
  assertUserId(userId);
  if (!id) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select(SCAN_ROW_COLUMNS)
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapScanRow(data as unknown as ScanRow) : null;
}

export async function listRecentScanSnapshots(
  userId: string,
  limit = 20,
): Promise<ScanSnapshot[]> {
  assertUserId(userId);
  const safeLimit = Math.max(1, Math.min(limit, 200));

  const { data, error } = await supabase
    .from(TABLE)
    .select(SCAN_ROW_COLUMNS)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw error;
  }

  return mapScanRows((data ?? []) as unknown as ScanRow[]);
}

/** Returns the most recent scan snapshot for the user, if any. */
export async function getLastScanSnapshot(userId: string): Promise<ScanSnapshot | null> {
  assertUserId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .select(SCAN_ROW_COLUMNS)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapScanRow(data as unknown as ScanRow) : null;
}
