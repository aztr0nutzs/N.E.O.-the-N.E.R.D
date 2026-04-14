import { Settings, AlertTriangle, Terminal, Crosshair, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { NeuralVisualizer } from './NeuralVisualizer';
import { useNeural } from '../context/NeuralContext';

interface SidePanelLeftProps {
  activeWindows: {
    tasks: boolean;
    sensors: boolean;
    terminal: boolean;
    radar: boolean;
  };
  onToggle: (key: 'tasks' | 'sensors' | 'terminal' | 'radar') => void;
}

export function SidePanelLeft({ activeWindows, onToggle }: SidePanelLeftProps) {
  const { userPosition } = useNeural();
  const buttons = [
    { key: 'sensors', icon: <Settings className="w-5 h-5" />, color: 'blue', glow: '#00ffff' },
    { key: 'tasks', icon: <AlertTriangle className="w-5 h-5" />, color: 'orange', glow: '#f97316' },
    { key: 'terminal', icon: <Terminal className="w-5 h-5" />, color: 'green', glow: '#22c55e' },
    { key: 'radar', icon: <Crosshair className="w-5 h-5" />, color: 'magenta', glow: '#d946ef' },
  ] as const;

  return (
    <div className="relative flex flex-col items-center py-6 px-2 h-fit">
      {/* Decorative Frame Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-blue/50" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-blue/50" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-blue/50" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-blue/50" />
        
        {/* Vertical Side Lines */}
        <div className="absolute top-6 bottom-6 left-0 w-[1px] bg-gradient-to-b from-transparent via-cyber-blue/30 to-transparent" />
        <div className="absolute top-6 bottom-6 right-0 w-[1px] bg-gradient-to-b from-transparent via-cyber-blue/30 to-transparent" />
        
        {/* Accent Notches */}
        <div className="absolute top-1/2 -left-1 w-2 h-8 bg-cyber-blue/40 -translate-y-1/2 rounded-r" />
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        {/* Neural Activity Monitor */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-2">
            <Activity className="w-3 h-3 text-cyber-blue animate-pulse" />
            <span className="text-[8px] font-mono text-cyber-blue tracking-widest uppercase">Neural Activity</span>
          </div>
          <div className="bg-black/40 border border-cyber-blue/20 rounded p-1">
            <NeuralVisualizer />
          </div>
        </div>

        {/* Spatial Tracking Monitor */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Crosshair className="w-3 h-3 text-neon-green animate-pulse" />
            <span className="text-[8px] font-mono text-neon-green tracking-widest uppercase">Spatial Tracking</span>
          </div>
          <div className="bg-black/40 border border-neon-green/20 rounded p-2 flex items-center justify-center h-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.2)_0%,transparent_70%)]" />
            <motion.div 
              className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_10px_#39ff14]"
              animate={{ 
                x: userPosition.x * 20,
                y: userPosition.y * 10
              }}
              transition={{ type: 'spring', damping: 15 }}
            />
            <div className="absolute inset-0 border border-neon-green/10 pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-neon-green/5" />
            <div className="absolute left-1/2 top-0 w-[1px] h-full bg-neon-green/5" />
          </div>
        </div>

        {buttons.map((btn) => (
          <motion.button
            key={btn.key}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(btn.key)}
            className={`
              relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
              ${activeWindows[btn.key] 
                ? `bg-black/40 border-white shadow-[0_0_15px_${btn.glow}]` 
                : `bg-black/60 border-gray-700 hover:border-${btn.color}-500/50`
              }
            `}
            style={{
              borderColor: activeWindows[btn.key] ? btn.glow : undefined,
              color: activeWindows[btn.key] ? btn.glow : '#4b5563'
            }}
          >
            {btn.icon}
            
            {/* Active Indicator Ring */}
            {activeWindows[btn.key] && (
              <motion.div
                layoutId={`active-ring-${btn.key}`}
                className="absolute -inset-1 rounded-full border border-white/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
