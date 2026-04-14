import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Database, Network, Power, Settings } from 'lucide-react';

export function SidePanelRight() {
  const [cpuLoad, setCpuLoad] = useState(42);
  const [ramLoad, setRamLoad] = useState(65);
  const [netLoad, setNetLoad] = useState(12);
  const [isOverclocked, setIsOverclocked] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
      setRamLoad(prev => Math.min(100, Math.max(0, prev + (Math.random() * 4 - 2))));
      setNetLoad(prev => Math.min(100, Math.max(0, prev + (Math.random() * 6 - 3))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-20 h-fit bg-[#1a1d24]/90 backdrop-blur-md border-l-2 border-r-2 border-[#3a3f47] py-8 flex flex-col items-center gap-8 shadow-2xl">
      {/* Metallic Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      {/* Top Power Button */}
      <button 
        onClick={() => setIsOverclocked(!isOverclocked)}
        className={`relative w-10 h-10 rounded border-2 flex items-center justify-center transition-all ${isOverclocked ? 'border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
      >
        <Power className="w-5 h-5" />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap text-gray-500 uppercase tracking-tighter">
          Overclock
        </div>
      </button>

      {/* Stats Bars */}
      <div className="flex flex-col gap-6 w-full px-3">
        <StatBar label="CPU" value={cpuLoad} icon={<Cpu className="w-3 h-3" />} color={isOverclocked ? 'red' : 'blue'} />
        <StatBar label="RAM" value={ramLoad} icon={<Database className="w-3 h-3" />} color="blue" />
        <StatBar label="NET" value={netLoad} icon={<Network className="w-3 h-3" />} color="green" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-auto w-full px-2">
        <button className="w-full py-1 text-[8px] font-mono uppercase tracking-widest border border-neon-green/30 text-neon-green hover:bg-neon-green/10 rounded transition-colors">
          Prioritize
        </button>
        <button className="w-full py-1 text-[8px] font-mono uppercase tracking-widest border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 rounded transition-colors flex items-center justify-center gap-1">
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
      <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 uppercase">
        <div className="flex items-center gap-1">
          {icon}
          {label}
        </div>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className={`h-full ${barColor} ${glowColor}`}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', bounce: 0 }}
        />
      </div>
    </div>
  );
}
