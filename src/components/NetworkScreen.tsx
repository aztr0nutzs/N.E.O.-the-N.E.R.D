import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Wifi, WifiOff, Radio, X } from 'lucide-react';

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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center p-4 overflow-y-auto custom-scrollbar"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 border border-gray-700 rounded-full text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        aria-label="Close network view"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-md flex flex-col gap-5 mt-14 relative z-10 pb-16 font-mono">
        <div className="bg-[#1a1c23] border-2 border-[#2a2d35] rounded-lg p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Radio className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Browser network</span>
            </div>
            {online ? (
              <Wifi className="w-6 h-6 text-green-500 drop-shadow-[0_0_8px_#22c55e]" aria-hidden />
            ) : (
              <WifiOff className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_#ef4444]" aria-hidden />
            )}
          </div>
          <div className="text-[11px] text-gray-300 leading-relaxed space-y-2">
            <p>
              <span className="text-gray-500 uppercase text-[9px] tracking-wider">Status</span>
              <br />
              {online ? 'This tab reports an active network path.' : 'This tab is offline — sync and server-backed features will fail until connectivity returns.'}
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
        </div>

        <div className="bg-[#1a1c23] border border-[#2a2d35] rounded-lg p-4 shadow-xl">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">Router / LAN control</h3>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Router configuration, SSID editing, device tables, and reboot actions are not implemented for this web client and are not available from the browser sandbox. Prior UI in this overlay was decorative only; it has been removed so nothing here implies a successful configuration change.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
