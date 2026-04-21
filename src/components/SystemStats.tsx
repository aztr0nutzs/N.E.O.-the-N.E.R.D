import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, RefreshCw, Zap, Eye, Mic, Cpu } from 'lucide-react';
import { useNeuralSystem } from '../context/NeuralContext';

interface BatteryManagerLike {
  level: number;
  charging: boolean;
  addEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
  removeEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
}

function readJsHeapRatio(): number | null {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
  };
  const m = perf.memory;
  if (!m?.totalJSHeapSize) return null;
  return Math.min(100, Math.max(0, (m.usedJSHeapSize / m.totalJSHeapSize) * 100));
}

export function SystemStats({ onOpenDiagnostics }: { onOpenDiagnostics?: () => void }) {
  const { isSystemsReady, isListening } = useNeuralSystem();
  const [powerPct, setPowerPct] = useState<number | null>(null);
  const [batteryCharging, setBatteryCharging] = useState(false);
  const [batterySupported, setBatterySupported] = useState(false);
  const [reservePct, setReservePct] = useState<number | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);

  const refreshBattery = useCallback(async () => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (typeof nav.getBattery !== 'function') {
      setBatterySupported(false);
      setPowerPct(null);
      return;
    }
    try {
      const bat = await nav.getBattery();
      setBatterySupported(true);
      setPowerPct(Math.round(bat.level * 100));
      setBatteryCharging(bat.charging);
    } catch {
      setBatterySupported(false);
      setPowerPct(null);
    }
  }, []);

  const refreshReserve = useCallback(() => {
    const r = readJsHeapRatio();
    setReservePct(r !== null ? Math.round(r) : null);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshReserve();
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshReserve]);

  useEffect(() => {
    void refreshBattery();
  }, [refreshBattery]);

  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (typeof nav.getBattery !== 'function') return;
    let bat: BatteryManagerLike | null = null;
    const onLevel = () => {
      if (!bat) return;
      setPowerPct(Math.round(bat.level * 100));
    };
    const onCharging = () => {
      if (!bat) return;
      setBatteryCharging(bat.charging);
    };
    void nav.getBattery().then((b) => {
      bat = b;
      b.addEventListener('levelchange', onLevel);
      b.addEventListener('chargingchange', onCharging);
    });
    return () => {
      if (bat) {
        bat.removeEventListener('levelchange', onLevel);
        bat.removeEventListener('chargingchange', onCharging);
      }
    };
  }, []);

  const runDiagnostic = () => {
    if (onOpenDiagnostics) {
      onOpenDiagnostics();
      setDiagnosticMode(true);
      setTimeout(() => setDiagnosticMode(false), 1200);
      return;
    }
    setDiagnosticMode(true);
    setTimeout(() => setDiagnosticMode(false), 1200);
  };

  const handleRefreshReadings = () => {
    void refreshBattery();
    refreshReserve();
  };

  return (
    <div 
      className="w-full h-full relative flex flex-col font-mono select-none overflow-hidden group"
      style={{
        backgroundImage: "url('/image_0.png')",
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Interactive Controls Overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          type="button"
          onClick={runDiagnostic}
          className="p-1 bg-black/40 rounded border border-cyber-blue/30 hover:bg-cyber-blue/20"
          title={onOpenDiagnostics ? 'Open system diagnostics' : 'Diagnostics (no panel wired)'}
        >
          <Shield className={`w-3 h-3 text-cyber-blue ${diagnosticMode ? 'animate-spin' : ''}`} />
        </button>
        <button 
          type="button"
          onClick={handleRefreshReadings}
          className="p-1 bg-black/40 rounded border border-neon-green/30 hover:bg-neon-green/20 disabled:opacity-40 disabled:cursor-not-allowed"
          title={
            batterySupported
              ? 'Refresh battery and memory readings'
              : 'Refresh readings (battery API not available on this device)'
          }
        >
          <RefreshCw className="w-3 h-3 text-neon-green" />
        </button>
      </div>

      {/* Power Bar Overlay — Battery API when available */}
      <div 
        className="absolute top-[35%] left-[25%] w-[45%] h-[10%] overflow-hidden rounded-r cursor-pointer"
        onClick={handleRefreshReadings}
        title="Tap to refresh battery reading"
        role="presentation"
      >
         <motion.div 
           className={`h-full ${(powerPct ?? 100) < 20 ? 'bg-red-500' : 'bg-orange-500'} shadow-[0_0_10px_currentColor]`}
           animate={{ width: `${powerPct ?? 0}%` }} 
         />
         {batterySupported && batteryCharging && (
           <motion.div 
             className="absolute inset-0 bg-white/20"
             animate={{ x: ['-100%', '100%'] }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           />
         )}
      </div>
      
      {/* Reserve Bar Overlay — JS heap ratio in Chromium; otherwise unavailable */}
      <div
        className="absolute top-[55%] left-[25%] w-[45%] h-[10%] overflow-hidden rounded-r"
        title={reservePct !== null ? 'JavaScript heap utilization (Chromium)' : 'Memory bar not available in this browser'}
      >
         <motion.div 
           className="h-full bg-cyber-blue shadow-[0_0_10px_#00ffff]" 
           animate={{ width: `${reservePct ?? 0}%` }} 
         />
      </div>

      {/* Values */}
      <div className="absolute top-[32%] right-[15%] text-[10px] text-white font-bold drop-shadow-md">
        {batterySupported && powerPct !== null ? `${powerPct}%` : '—'}
      </div>
      <div className="absolute top-[52%] right-[15%] text-[10px] text-cyber-blue font-bold drop-shadow-md">
        {reservePct !== null ? `${reservePct}%` : '—'}
      </div>

      {/* Diagnostic Sweep */}
      <AnimatePresence>
        {diagnosticMode && (
          <motion.div 
            initial={{ top: '-100%' }}
            animate={{ top: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-cyber-blue/50 shadow-[0_0_15px_#00ffff] z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Status Indicators */}
      <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[8px] text-gray-400">
        <div className="flex items-center gap-1">
          <Zap className={`w-2 h-2 ${batterySupported && powerPct !== null && powerPct < 20 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
          <span>PWR</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className={`w-2 h-2 ${isSystemsReady ? 'text-neon-green' : 'text-gray-600'}`} />
          <span>VIS</span>
        </div>
        <div className="flex items-center gap-1">
          <Mic className={`w-2 h-2 ${isListening ? 'text-neon-green animate-pulse' : 'text-gray-600'}`} />
          <span>AUD</span>
        </div>
        <div className="flex items-center gap-1">
          <Cpu className={`w-2 h-2 ${isSystemsReady ? 'text-cyber-blue animate-pulse' : 'text-gray-600'}`} />
          <span>NRL</span>
        </div>
      </div>
    </div>
  );
}
