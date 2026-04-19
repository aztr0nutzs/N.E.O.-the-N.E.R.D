import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Database, Network, Power, Settings } from 'lucide-react';
import { useNeuralUi } from '../context/NeuralContext';

export function SidePanelRight({ onToggleSettings }: { onToggleSettings?: () => void }) {
  const { neuralSurge } = useNeuralUi();
  /** Decorative load levels — not OS telemetry (unavailable in the browser without misleading RNG). */
  const cpuLoad = neuralSurge ? 88 : 42;
  const ramLoad = neuralSurge ? 78 : 52;
  const netLoad = neuralSurge ? 72 : 28;

  return (
    <div className="relative w-20 h-fit bg-[linear-gradient(180deg,rgba(31,35,44,0.92),rgba(19,22,28,0.96))] backdrop-blur-md border-l-2 border-r-2 border-[#3a3f47] py-8 flex flex-col items-center gap-8 shadow-[0_20px_38px_rgba(0,0,0,0.38)] overflow-hidden">
      {/* Metallic Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_20%,transparent_78%,rgba(0,0,0,0.18))] pointer-events-none" />
      <div className="absolute left-2 right-2 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-blue/30 to-transparent pointer-events-none" />
      
      {/* Top indicator — tied to active AI/speech pulse only (not hardware overclock). */}
      <div
        className={`relative w-10 h-10 rounded border-2 flex items-center justify-center transition-all duration-200 ${neuralSurge ? 'border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-gray-600 text-gray-400'}`}
        title={neuralSurge ? 'Neural activity pulse (AI / voice output active)' : 'Neural idle — bars are decorative, not CPU telemetry'}
        aria-label={neuralSurge ? 'Neural activity pulse active' : 'Neural activity idle'}
      >
        <Power className="w-5 h-5" />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap text-gray-500 uppercase tracking-[0.18em]">
          Neural
        </div>
      </div>

      {/* Stats Bars */}
      <div className="flex flex-col gap-6 w-full px-3">
        <StatBar label="CPU" value={cpuLoad} icon={<Cpu className="w-3 h-3" />} color={neuralSurge ? 'red' : 'blue'} />
        <StatBar label="RAM" value={ramLoad} icon={<Database className="w-3 h-3" />} color="blue" />
        <StatBar label="NET" value={netLoad} icon={<Network className="w-3 h-3" />} color="green" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-auto w-full px-2">
        <button
          type="button"
          onClick={onToggleSettings}
          className="w-full py-1.5 text-[8px] font-mono uppercase tracking-[0.2em] border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 rounded transition-colors flex items-center justify-center gap-1 bg-black/20"
          aria-label="Open AI configuration"
          title="AI configuration"
        >
          <Settings className="w-2 h-2" />
          Settings
        </button>
      </div>

      {/* Decorative Screws */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-700 border border-gray-600" />
    </div>
  );
}

function StatBar({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: 'blue' | 'red' | 'green' }) {
  const barColor = color === 'red' ? 'bg-red-500' : color === 'green' ? 'bg-neon-green' : 'bg-cyber-blue';
  const glowColor = color === 'red' ? 'shadow-[0_0_8px_#ef4444]' : color === 'green' ? 'shadow-[0_0_8px_#39ff14]' : 'shadow-[0_0_8px_#00ffff]';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 uppercase tracking-[0.18em]">
        <div className="flex items-center gap-1">
          {icon}
          {label}
        </div>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
        <motion.div 
          className={`h-full ${barColor} ${glowColor}`}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', bounce: 0, stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}
