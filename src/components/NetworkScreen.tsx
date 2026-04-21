import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Wifi, WifiOff, Radio, X, Satellite, Router, ShieldAlert, Activity } from 'lucide-react';

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

export function NetworkScreen({ onClose }: { onClose: () => void }) {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [conn, setConn] = useState<NetInfo | null>(() => readNetworkInformation());

  const refreshConn = useCallback(() => {
    setConn(readNetworkInformation());
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="absolute inset-0 bg-[#030508] z-50 flex flex-col font-mono overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Device and network mission control"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,200,255,0.12),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(255,140,0,0.08),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(90deg,rgba(0,255,200,0.12)_1px,transparent_1px)] bg-[length:22px_100%]" />

      <header className="relative z-10 flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-cyan-500/20 bg-black/45">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <Satellite className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/70">Mission control</p>
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-100 truncate">
              Network &amp; device intel
            </h1>
            <p className="text-[10px] text-gray-500 mt-2 max-w-[300px] leading-relaxed">
              Live fields are browser-visible signals only. LAN discovery, router tables, and handset radio scans are
              not implemented in this client — sections below state that explicitly.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 rounded-full border border-white/15 bg-black/50 text-gray-300 hover:text-white hover:border-cyan-400/40 transition-colors"
          aria-label="Close mission control"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4 pb-10">
        <section className="rounded-lg border border-cyan-500/25 bg-[linear-gradient(180deg,rgba(10,14,20,0.92),rgba(4,6,10,0.96))] p-4 shadow-[0_0_24px_rgba(0,234,255,0.08)]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Radio className="w-4 h-4" aria-hidden />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Browser uplink</span>
            </div>
            {online ? (
              <Wifi className="w-6 h-6 text-neon-green drop-shadow-[0_0_8px_#22c55e]" aria-hidden />
            ) : (
              <WifiOff className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_#ef4444]" aria-hidden />
            )}
          </div>
          <div className="text-[11px] text-gray-300 leading-relaxed space-y-2">
            <p>
              <span className="text-gray-500 uppercase text-[9px] tracking-wider">Status</span>
              <br />
              {online
                ? 'This tab reports an active network path.'
                : 'This tab is offline — Supabase sync and protected AI routes will fail until connectivity returns.'}
            </p>
            {conn ? (
              <p>
                <span className="text-gray-500 uppercase text-[9px] tracking-wider">Network Information API</span>
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
                    <span className="text-orange-400">Data-saver / save-data hint is on.</span>
                  </>
                )}
              </p>
            ) : (
              <p className="text-gray-500 text-[10px]">
                Connection quality hints are not exposed by this browser (Network Information API unavailable).
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-orange-500/25 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-orange-300 mb-2">
            <Activity className="w-4 h-4" aria-hidden />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Local discovery sweep</h2>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
            mDNS / ARP / Wi-Fi neighbor lists and active port scans are{' '}
            <span className="text-orange-200 font-semibold">not available</span> from this web shell without a
            dedicated native agent and privileged APIs.
          </p>
          <div
            className="rounded border border-dashed border-gray-600 bg-black/50 px-3 py-4 text-center text-[10px] text-gray-500 uppercase tracking-[0.18em]"
            role="status"
          >
            Scan pipeline unavailable in this build
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-black/35 p-4">
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <Router className="w-4 h-4" aria-hidden />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Router / LAN control</h2>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Router configuration, SSID editing, DHCP reservations, and reboot actions are{' '}
            <span className="text-gray-300">not implemented</span> for this client and are not available from the browser
            sandbox. Nothing here performs configuration writes.
          </p>
        </section>

        <section className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 flex gap-2">
          <ShieldAlert className="w-4 h-4 text-fuchsia-300 shrink-0 mt-0.5" aria-hidden />
          <p className="text-[10px] text-fuchsia-100/90 leading-relaxed">
            Future network intelligence (asset inventory, flow telemetry, policy hooks) will plug into this surface once
            backend + device agents exist. Today this screen is intentionally limited to truthful browser signals.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
