import React, { useCallback, useEffect, useState } from 'react';
import { Radar, Wifi, WifiOff } from 'lucide-react';
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

interface Props {
  onNavigate: (tab: MissionTab) => void;
}

export function NerdDeviceDiscoveryMission({ onNavigate }: Props) {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [conn, setConn] = useState<NetInfo | null>(() => readNetworkInformation());
  const [lastRefresh, setLastRefresh] = useState(() => new Date());

  const refreshConn = useCallback(() => {
    setConn(readNetworkInformation());
    setLastRefresh(new Date());
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }, []);

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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 pb-24 pt-14 custom-scrollbar">
      <header className="mb-4 flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-3">
          <Radar className="h-7 w-7 text-lime-400" />
          <div>
            <h1 className="text-lg font-black italic uppercase tracking-[0.18rem] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,210,255,0.65)]">
              Discovery grid
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2rem] text-zinc-500">Mission control (truthful scope)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshConn}
          className="rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-[10px] font-black italic uppercase tracking-[0.14rem] text-lime-400 active:scale-95"
        >
          Refresh
        </button>
      </header>

      <section className="relative mb-4 overflow-hidden rounded-2xl border border-cyan-500/15 bg-[linear-gradient(180deg,rgba(20,20,20,0.75),rgba(8,8,8,0.95))] p-4">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(45deg,#101010_25%,transparent_25%),linear-gradient(-45deg,#101010_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#101010_75%),linear-gradient(-45deg,transparent_75%,#101010_75%)] bg-[length:4px_4px]" />
        <div className="relative mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black italic uppercase tracking-[0.18rem] text-cyan-400">Browser-visible signals</p>
            <p className="text-[10px] font-bold italic text-zinc-500">
              No ARP/mDNS/SSDP sweep runs in this web client yet. The sweep graphic is decorative only.
            </p>
          </div>
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[9px] font-black italic uppercase text-cyan-400">
            LAN scan: off
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[280px] text-cyan-400/90">
          <div className="absolute inset-[8%] rounded-full border border-cyan-500/15" />
          <div className="absolute inset-[20%] rounded-full border border-cyan-500/22" />
          <div className="absolute inset-[32%] rounded-full border border-lime-400/30" />
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
            Decorative sweep — not discovering peers
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Requires native or server-side scan engine — not implemented."
          className="mt-4 w-full cursor-not-allowed rounded-xl border border-zinc-700 bg-zinc-900/60 py-3 text-[10px] font-black italic uppercase tracking-wider text-zinc-500"
        >
          Deep LAN scan (unavailable)
        </button>
      </section>

      <section className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-cyan-500/12 bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
          <div className="text-[10px] font-black italic uppercase text-cyan-400">Nodes</div>
          <div className="text-2xl font-black italic text-zinc-500">0</div>
          <div className="text-[10px] font-bold italic text-zinc-600">No device graph</div>
        </div>
        <div className="rounded-2xl border border-lime-500/12 bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
          <div className="text-[10px] font-black italic uppercase text-lime-400">Tab online</div>
          <div className="text-2xl font-black italic text-white">{online ? 'Yes' : 'No'}</div>
          <div className="text-[10px] font-bold italic text-zinc-500">navigator.onLine</div>
        </div>
        <div className="rounded-2xl border border-fuchsia-500/12 bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
          <div className="text-[10px] font-black italic uppercase text-fuchsia-400">Hints</div>
          <div className="text-2xl font-black italic text-zinc-400">{conn ? 'API' : '—'}</div>
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
              : 'Offline — sync and server-backed features fail until connectivity returns.'}
          </p>
          {conn ? (
            <p>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Network Information API</span>
              <br />
              Type: <span className="text-cyan-300">{conn.effectiveType ?? '—'}</span>
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
        <p className="text-[10px] leading-relaxed text-zinc-500">
          No host inventory is persisted or scanned from this client yet. When the scan engine ships, device cards will
          bind here with Supabase-backed rows.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('assistant')}
          className="mt-4 w-full rounded-lg border border-cyan-500/25 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/10"
        >
          Back to assistant shell
        </button>
      </section>
    </div>
  );
}
