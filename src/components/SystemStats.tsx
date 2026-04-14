import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, RefreshCw, Zap, Battery, Activity, Eye, Mic, Cpu } from 'lucide-react';
import { useNeural } from '../context/NeuralContext';

export function SystemStats() {
  const { isSystemsReady, isListening } = useNeural();
  const [power, setPower] = useState(68);
  const [reserve, setReserve] = useState(72);
  const [isRecharging, setIsRecharging] = useState(false);
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
      if (!isRecharging) {
        setPower(prev => Math.min(100, Math.max(0, prev + (Math.random() * 2 - 1.2))));
        setReserve(prev => Math.min(100, Math.max(0, prev + (Math.random() * 1 - 0.6))));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRecharging]);

  const handleRecharge = () => {
    if (isRecharging) return;
    setIsRecharging(true);
    const interval = setInterval(() => {
      setPower(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsRecharging(false);
          return 100;
        }
        return p + 2;
      });
    }, 100);
  };

  const runDiagnostic = () => {
    setDiagnosticMode(true);
    setTimeout(() => setDiagnosticMode(false), 3000);
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
          onClick={runDiagnostic}
          className="p-1 bg-black/40 rounded border border-cyber-blue/30 hover:bg-cyber-blue/20"
          title="Diagnostic"
        >
          <Shield className={`w-3 h-3 text-cyber-blue ${diagnosticMode ? 'animate-spin' : ''}`} />
        </button>
        <button 
          onClick={handleRecharge}
          className="p-1 bg-black/40 rounded border border-neon-green/30 hover:bg-neon-green/20"
          title="Recharge"
        >
          <RefreshCw className={`w-3 h-3 text-neon-green ${isRecharging ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Power Bar Overlay */}
      <div 
        className="absolute top-[35%] left-[25%] w-[45%] h-[10%] overflow-hidden rounded-r cursor-pointer"
        onClick={handleRecharge}
      >
         <motion.div 
           className={`h-full ${power < 20 ? 'bg-red-500' : 'bg-orange-500'} shadow-[0_0_10px_currentColor]`}
           animate={{ width: `${power}%` }} 
         />
         {isRecharging && (
           <motion.div 
             className="absolute inset-0 bg-white/20"
             animate={{ x: ['-100%', '100%'] }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           />
         )}
      </div>
      
      {/* Reserve Bar Overlay */}
      <div className="absolute top-[55%] left-[25%] w-[45%] h-[10%] overflow-hidden rounded-r">
         <motion.div 
           className="h-full bg-cyber-blue shadow-[0_0_10px_#00ffff]" 
           animate={{ width: `${reserve}%` }} 
         />
      </div>

      {/* Values */}
      <div className="absolute top-[32%] right-[15%] text-[10px] text-white font-bold drop-shadow-md">
        {Math.round(power)}%
      </div>
      <div className="absolute top-[52%] right-[15%] text-[10px] text-cyber-blue font-bold drop-shadow-md">
        {Math.round(reserve)}%
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
          <Zap className={`w-2 h-2 ${power < 20 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
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
