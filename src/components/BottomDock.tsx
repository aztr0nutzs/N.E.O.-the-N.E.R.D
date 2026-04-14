import type { ReactNode } from 'react';
import { Wifi, Battery, Shield, Zap, Cpu, Activity, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNeural } from '../context/NeuralContext';

export function BottomDock({ onNetworkClick }: { onNetworkClick?: () => void }) {
  const { isSystemsReady, isListening, toggleListening, lastTranscript } = useNeural();
  interface Slot {
    icon: ReactNode;
    color: string;
    active?: boolean;
    low?: boolean;
    onClick?: () => void;
  }

  const slots: Slot[] = [
    { icon: <Shield className="w-5 h-5" />, color: 'blue', active: true },
    { icon: <Zap className="w-5 h-5" />, color: 'orange', active: true },
    { icon: <Wifi className="w-5 h-5" />, color: 'green', active: isSystemsReady, onClick: onNetworkClick },
    { icon: <Mic className="w-5 h-5" />, color: 'red', active: isListening, onClick: toggleListening },
    { icon: <Cpu className="w-5 h-5" />, color: 'blue', active: true },
    { icon: <Battery className="w-5 h-5" />, color: 'red', active: true, low: true },
    { icon: <Activity className="w-5 h-5" />, color: 'magenta', active: isSystemsReady },
  ];

  return (
    <div className="relative w-full h-24 flex flex-col items-center">
      {/* Transcript Overlay */}
      <AnimatePresence>
        {isListening && lastTranscript && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-12 bg-black/80 border border-cyber-blue/50 px-4 py-1 rounded-full text-[10px] font-mono text-cyber-blue shadow-[0_0_15px_rgba(0,255,255,0.2)] z-50 max-w-[80%] truncate"
          >
            <span className="opacity-50 mr-2">LISTENING:</span>
            {lastTranscript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dock Body */}
      <div className="relative w-[95%] h-16 bg-[#1a1d24] border-2 border-[#3a3f47] rounded-lg flex items-center justify-around px-4 shadow-2xl overflow-hidden">
        {/* Metallic Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        {/* Center Circular Element */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#111318] rounded-full border-2 border-[#3a3f47] flex items-center justify-center z-20">
          <div className="w-10 h-10 rounded-full border border-cyber-blue/50 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-cyber-blue/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyber-blue shadow-[0_0_10px_#00ffff]" />
            </div>
          </div>
          {/* Radar Sweep */}
          <motion.div 
            className="absolute inset-0 rounded-full border-t-2 border-cyber-blue/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Slots Left */}
        <div className="flex gap-2 z-10">
          {slots.slice(0, 3).map((slot, i) => {
            const { icon, color, active, low, onClick } = slot;
            return <DockSlot key={i} icon={icon} color={color} active={active} low={low} onClick={onClick} />;
          })}
        </div>

        {/* Spacer for Center */}
        <div className="w-16" />

        {/* Slots Right */}
        <div className="flex gap-2 z-10">
          {slots.slice(3).map((slot, i) => {
            const { icon, color, active, low, onClick } = slot;
            return <DockSlot key={i} icon={icon} color={color} active={active} low={low} onClick={onClick} />;
          })}
        </div>

        {/* Decorative Lights */}
        <div className="absolute bottom-1 left-1/4 flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-orange-500/50 shadow-[0_0_5px_#f97316]" />
          ))}
        </div>
        <div className="absolute bottom-1 right-1/4 flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-orange-500/50 shadow-[0_0_5px_#f97316]" />
          ))}
        </div>
      </div>

      {/* Label Bar */}
      <div className="mt-1 bg-[#1a1d24] border-x-2 border-b-2 border-[#3a3f47] px-6 py-0.5 rounded-b-lg shadow-lg">
        <span className="text-[10px] font-mono font-black italic tracking-[0.2em] text-gray-400 uppercase">
          NERD LAUNCHER
        </span>
      </div>
    </div>
  );
}

interface DockSlotProps {
  icon: ReactNode;
  color: string;
  active?: boolean;
  low?: boolean;
  onClick?: () => void;
}

function DockSlot({ icon, color, active, low, onClick }: DockSlotProps) {
  const glowColor = color === 'green' ? 'shadow-[0_0_10px_#39ff14]' : color === 'red' ? 'shadow-[0_0_10px_#ef4444]' : color === 'orange' ? 'shadow-[0_0_10px_#f97316]' : 'shadow-[0_0_10px_#00ffff]';
  const textColor = color === 'green' ? 'text-neon-green' : color === 'red' ? 'text-red-500' : color === 'orange' ? 'text-bio-orange' : 'text-cyber-blue';
  const borderColor = color === 'green' ? 'border-neon-green/50' : color === 'red' ? 'border-red-500/50' : color === 'orange' ? 'border-bio-orange/50' : 'border-cyber-blue/50';

  return (
    <div 
      onClick={onClick}
      className={`w-10 h-12 rounded border ${active ? borderColor : 'border-gray-700'} bg-black/40 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-colors`}
    >
      <div className={`${active ? textColor : 'text-gray-600'} ${active && low ? 'animate-pulse' : ''} z-10`}>
        {icon}
      </div>
      {active && (
        <div className={`absolute inset-0 opacity-20 ${glowColor} bg-current pointer-events-none`} />
      )}
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/20" />
      <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-white/20" />
      <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/20" />
    </div>
  );
}
