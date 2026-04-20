import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Radar, Wifi, WifiOff } from 'lucide-react';
import { useNeuralAuth } from '../../context/NeuralContext';
import {
  checkDeviceReachability,
  getLastScanSnapshot,
  listDevices,
  openDeviceInterface,
  setDeviceFavorite,
  setDeviceIgnored,
  setDeviceTrusted,
  startNetworkScan,
  type DeviceActionResult,
  type DeviceRecord,
  type NetworkScanResult,
  type ScanCoordinatorStatus,
  type ScanSnapshot,
} from '../../lib/network';
import type { MissionTab } from './MissionShell';

type NetInfo = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

function readNetworkInformation(): NetInfo | null {
  const c = (navigator as Navigator & { connection?: NetInfo }).connection;
  if (!c) return null;
  return {
    effectiveType: c.effectiveType,
    downlink: c.downlink,
    rtt: c.rtt,
    saveData: c.saveData,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatScanTime(scan: ScanSnapshot | null): string {
  if (!scan) return 'never';
  const timestamp = scan.finishedAt ?? scan.startedAt;
  return new Date(timestamp).toLocaleTimeString();
}

function scanBadge(status: ScanCoordinatorStatus): string {
  if (status === 'idle') return 'ready';
  if (status === 'scanning') return 'scanning';
  if (status === 'limited') return 'limited';
  if (status === 'failed') return 'failed';
  return 'complete';
}

function isDeviceRecord(value: unknown): value is DeviceRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'ipAddress' in value &&
    typeof (value as { id?: unknown }).id === 'string'
  );
}

interface Props {
  onNavigate: (tab: MissionTab) => void;
}

export function NerdDeviceDiscoveryMission({ onNavigate }: Props) {
  const { user } = useNeuralAuth();
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [conn, setConn] = useState<NetInfo | null>(() => readNetworkInformation());
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const [scanStatus, setScanStatus] = useState<ScanCoordinatorStatus>('idle');
  const [scanResult, setScanResult] = useState<NetworkScanResult | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [lastScan, setLastScan] = useState<ScanSnapshot | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<DeviceActionResult | null>(null);

  const refreshConn = useCallback(() => {
    setConn(readNetworkInformation());
    setLastRefresh(new Date());
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }, []);

  const loadNetworkInventory = useCallback(async () => {
    if (!user) {
      setDevices([]);
      setLastScan(null);
      return;
    }

    try {
      const [nextDevices, nextLastScan] = await Promise.all([
        listDevices(user.id),
        getLastScanSnapshot(user.id),
      ]);
      setDevices(nextDevices);
      setLastScan(nextLastScan);
    } catch (error) {
      setScanError(getErrorMessage(error));
    }
  }, [user]);

  const runScan = useCallback(async () => {
    refreshConn();
    if (!user) {
      setScanError('Sign in is required before scan snapshots can be persisted.');
      setScanStatus('failed');
      return;
    }

    setScanError(null);
    setScanStatus('scanning');
    try {
      const result = await startNetworkScan(user.id);
      setScanResult(result);
      setDevices(result.knownDevices);
      setLastScan(result.scanSnapshot);
      setScanStatus(result.status);
    } catch (error) {
      setScanStatus('failed');
      setScanError(getErrorMessage(error));
    }
  }, [refreshConn, user]);

  const replaceDevice = useCallback((device: DeviceRecord) => {
    setDevices((prev) => prev.map((item) => (item.id === device.id ? device : item)));
  }, []);

  const applyActionResult = useCallback((result: DeviceActionResult) => {
    setActionResult(result);
    const device = result.data?.device;
    if (isDeviceRecord(device)) {
      replaceDevice(device);
    }
  }, [replaceDevice]);

  const runDeviceAction = useCallback(async (
    device: DeviceRecord,
    action: 'reach' | 'open' | 'trust' | 'favorite' | 'ignore',
  ) => {
    if (!user) {
      setActionResult({
        actionType: 'ping',
        deviceId: device.id,
        state: 'unavailable',
        success: false,
        message: 'Sign in is required before device actions can run.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const busyKey = `${action}:${device.id}`;
    setActionBusyKey(busyKey);
    try {
      const result =
        action === 'reach'
          ? await checkDeviceReachability(user.id, device.id)
          : action === 'open'
            ? await openDeviceInterface(user.id, device.id, { device })
            : action === 'trust'
              ? await setDeviceTrusted(user.id, device.id, !device.trusted)
              : action === 'favorite'
                ? await setDeviceFavorite(user.id, device.id, !device.favorite)
                : await setDeviceIgnored(user.id, device.id, !device.ignored);
      applyActionResult(result);
    } catch (error) {
      setActionResult({
        actionType: action === 'reach' ? 'ping' : action === 'open' ? 'open_interface' : action,
        deviceId: device.id,
        state: 'unavailable',
        success: false,
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setActionBusyKey(null);
    }
  }, [applyActionResult, user]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const nav = navigator as Navigator & { connection?: EventTarget & NetInfo };
    const c = nav.connection;
    const onConn = () => refreshConn();
    c?.addEventListener?.('change', onConn);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      c?.removeEventListener?.('change', onConn);
    };
  }, [refreshConn]);

  useEffect(() => {
    void loadNetworkInventory();
  }, [loadNetworkInventory]);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#070707] pb-24 pt-0 custom-scrollbar"
      style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-20 mb-4 flex h-16 items-center justify-between border-b border-cyan-500/20 bg-black/85 px-5 shadow-[0_0_24px_rgba(0,210,255,0.06)] backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <Radar className="h-7 w-7 shrink-0 text-lime-400" aria-hidden />
          <div className="min-w-0">
            <h1 className="text-lg font-black italic uppercase tracking-[0.18rem] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,210,255,0.65)]">
              Discovery grid
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2rem] text-zinc-500">Mission control (truthful scope)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshConn}
          className="shrink-0 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-[10px] font-black italic uppercase tracking-[0.14rem] text-lime-400 active:scale-95"
          title="Refresh browser Network Information + onLine state"
        >
          Refresh
        </button>
      </header>

      <div className="min-h-0 flex-1 px-4">

      <section className="relative mb-4 overflow-hidden rounded-2xl border border-cyan-500/15 bg-[linear-gradient(180deg,rgba(20,20,20,0.75),rgba(8,8,8,0.95))] p-4">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(45deg,#101010_25%,transparent_25%),linear-gradient(-45deg,#101010_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#101010_75%),linear-gradient(-45deg,transparent_75%,#101010_75%)] bg-[length:4px_4px]" />
        <div className="relative mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black italic uppercase tracking-[0.18rem] text-cyan-400">Browser-visible signals</p>
            <p className="text-[10px] font-bold italic text-zinc-500">
              Scan engine is browser-safe: it records real link/probe signals and never fabricates LAN hosts.
            </p>
          </div>
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[9px] font-black italic uppercase text-cyan-400">
            Scan: {scanBadge(scanStatus)}
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[280px] text-cyan-400/90">
          <div className="absolute inset-[8%] rounded-full border border-cyan-500/15" />
          <div className="absolute inset-[20%] rounded-full border border-cyan-500/22" />
          <div className="absolute inset-[32%] rounded-full border border-lime-400/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[86%] h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
            <div className="absolute h-[86%] w-px bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent" />
          </div>
          <div
            className="absolute inset-[12%] left-1/2 top-1/2 h-[38%] w-[38%] origin-bottom-left animate-[spin_6s_linear_infinite] bg-gradient-to-tr from-transparent via-cyan-400/10 to-cyan-400/26"
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}
            aria-hidden
          />
          <div className="absolute inset-[28%] animate-[spin_6s_linear_infinite] rounded-full border border-dashed border-cyan-500/24" />
          <div className="pointer-events-none absolute inset-[41%] flex items-center justify-center rounded-full border border-cyan-500/40 bg-black/55 shadow-[0_0_28px_rgba(0,210,255,.18)]">
            <Wifi className="h-14 w-14 text-cyan-400" />
          </div>
          <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[8px] font-bold uppercase tracking-wider text-zinc-500">
            Browser-safe sweep - limited visibility
          </p>
        </div>

        <button
          type="button"
          disabled={scanStatus === 'scanning' || !user}
          onClick={runScan}
          title={
            user
              ? 'Run browser-safe scan: persists snapshot, real probes, and limitation notes.'
              : 'Sign in required before scan snapshots can be persisted.'
          }
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-[10px] font-black italic uppercase tracking-wider ${
            scanStatus === 'scanning' || !user
              ? 'cursor-not-allowed border-zinc-700 bg-zinc-900/60 text-zinc-500'
              : 'border-lime-400/35 bg-lime-400/10 text-lime-300 active:scale-95'
          }`}
        >
          {scanStatus === 'scanning' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {scanStatus === 'scanning' ? 'Scanning browser scope' : 'Run truthful scan'}
        </button>
        <div className="mt-3 rounded-xl border border-zinc-800 bg-black/45 p-3 text-[10px] leading-relaxed text-zinc-400">
          <p>
            <span className="font-black uppercase tracking-wider text-zinc-500">Last scan</span>
            <br />
            {lastScan ? `${lastScan.status} at ${formatScanTime(lastScan)}` : 'No persisted scan snapshot yet.'}
          </p>
          {(scanResult?.summaryText || scanError) && (
            <p className={scanError ? 'mt-2 text-red-300/90' : 'mt-2 text-cyan-100/90'}>
              {scanError ?? scanResult?.summaryText}
            </p>
          )}
        </div>
      </section>

      <section className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-cyan-500/12 bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
          <div className="text-[10px] font-black italic uppercase text-cyan-400">Nodes</div>
          <div className="text-2xl font-black italic text-zinc-500">{devices.length}</div>
          <div className="text-[10px] font-bold italic text-zinc-600">Persisted rows</div>
        </div>
        <div className="rounded-2xl border border-lime-500/12 bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
          <div className="text-[10px] font-black italic uppercase text-lime-400">Tab online</div>
          <div className="text-2xl font-black italic text-white">{online ? 'Yes' : 'No'}</div>
          <div className="text-[10px] font-bold italic text-zinc-500">navigator.onLine</div>
        </div>
        <div className="rounded-2xl border border-fuchsia-500/12 bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
          <div className="text-[10px] font-black italic uppercase text-fuchsia-400">Hints</div>
          <div className="text-2xl font-black italic text-zinc-400">{conn ? 'API' : '-'}</div>
          <div className="text-[10px] font-bold italic text-zinc-500">NetInfo</div>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/12 bg-[rgba(22,22,22,0.68)] p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black italic uppercase tracking-[0.14rem] text-white">Browser network</h2>
            <p className="text-[10px] font-bold italic text-zinc-500">
              Same truthful scope as the legacy network overlay. Refreshed: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          {online ? (
            <Wifi className="h-6 w-6 text-green-500" aria-hidden />
          ) : (
            <WifiOff className="h-6 w-6 text-red-500" aria-hidden />
          )}
        </div>
        <div className="space-y-2 text-[11px] leading-relaxed text-zinc-300">
          <p>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
            <br />
            {online
              ? 'This tab reports an active network path.'
              : 'Offline - sync and server-backed features fail until connectivity returns.'}
          </p>
          {conn ? (
            <p>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Network Information API</span>
              <br />
              Type: <span className="text-cyan-300">{conn.effectiveType ?? '-'}</span>
              {typeof conn.downlink === 'number' && (
                <>
                  <br />
                  Est. downlink: <span className="text-cyan-300">{conn.downlink.toFixed(1)} Mbps</span>
                </>
              )}
              {typeof conn.rtt === 'number' && (
                <>
                  <br />
                  RTT hint: <span className="text-cyan-300">{Math.round(conn.rtt)} ms</span>
                </>
              )}
              {conn.saveData === true && (
                <>
                  <br />
                  <span className="text-orange-400">Data-saver hint is on.</span>
                </>
              )}
            </p>
          ) : (
            <p className="text-[10px] text-zinc-500">Connection quality hints are not exposed by this browser.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-700 bg-black/50 p-4">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Discovered devices</h3>
        {devices.length > 0 ? (
          <p className="text-[10px] leading-relaxed text-zinc-500">
            {devices.length} Supabase-backed device row(s) exist. This browser-safe scan does not mark them online unless
            a real scanner observes them. Current scan observed {scanResult?.discoveredDevices.length ?? 0} device(s).
          </p>
        ) : (
          <p className="text-[10px] leading-relaxed text-zinc-500">
            No host inventory rows exist yet. This browser-safe scan can persist snapshots and limitations, but it cannot
            invent LAN devices without a native or server-side scanner.
          </p>
        )}
        {scanResult?.limitationNotes.length ? (
          <ul className="mt-3 space-y-1 text-[10px] leading-relaxed text-zinc-500">
            {scanResult.limitationNotes.slice(0, 3).map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        ) : null}
        {devices.length > 0 ? (
          <div className="mt-3 space-y-2">
            {devices.slice(0, 3).map((device) => (
              <div key={device.id} className="rounded-xl border border-cyan-500/10 bg-black/45 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black italic uppercase tracking-[0.08rem] text-cyan-200">
                      {device.label ?? device.hostname ?? device.ipAddress}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-600">
                      {device.ipAddress} | {device.status} | {device.macAddress ? 'MAC known' : 'MAC unavailable'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-[8px] font-black uppercase text-zinc-500">
                    Actions
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <ActionButton
                    label="Reach"
                    busy={actionBusyKey === `reach:${device.id}`}
                    onClick={() => runDeviceAction(device, 'reach')}
                    title="Browser HTTP probe only; not ICMP ping."
                  />
                  <ActionButton
                    label="Open"
                    busy={actionBusyKey === `open:${device.id}`}
                    onClick={() => runDeviceAction(device, 'open')}
                    title="Open candidate HTTP admin/interface URL."
                  />
                  <ActionButton
                    label={device.trusted ? 'Trusted' : 'Trust'}
                    busy={actionBusyKey === `trust:${device.id}`}
                    onClick={() => runDeviceAction(device, 'trust')}
                    title="Persist trusted flag."
                  />
                  <ActionButton
                    label={device.favorite ? 'Fav' : 'Star'}
                    busy={actionBusyKey === `favorite:${device.id}`}
                    onClick={() => runDeviceAction(device, 'favorite')}
                    title="Persist favorite flag."
                  />
                  <ActionButton
                    label={device.ignored ? 'Ignored' : 'Ignore'}
                    busy={actionBusyKey === `ignore:${device.id}`}
                    onClick={() => runDeviceAction(device, 'ignore')}
                    title="Persist ignored flag."
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {actionResult ? (
          <p className={`mt-3 rounded-lg border px-3 py-2 text-[10px] leading-relaxed ${
            actionResult.success
              ? 'border-lime-400/20 bg-lime-400/5 text-lime-100/90'
              : 'border-orange-400/20 bg-orange-400/5 text-orange-100/90'
          }`}>
            {actionResult.actionType}: {actionResult.state} - {actionResult.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onNavigate('assistant')}
          className="mt-4 w-full rounded-lg border border-cyan-500/25 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/10"
        >
          Back to assistant shell
        </button>
      </section>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  busy,
  onClick,
  title,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      title={title}
      className="min-h-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-1 text-[8px] font-black uppercase tracking-[0.04rem] text-cyan-100 disabled:cursor-wait disabled:text-zinc-500"
    >
      {busy ? '...' : label}
    </button>
  );
}
