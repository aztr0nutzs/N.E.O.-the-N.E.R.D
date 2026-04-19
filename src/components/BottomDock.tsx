import React from 'react';
import { Wifi, Battery, Shield, Zap, Cpu, Activity, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNeuralSystem } from '../context/NeuralContext';

export interface BottomDockActions {
  onNetworkClick?: () => void;
  onDiagnosticsClick?: () => void;
  onSensorsClick?: () => void;
  onTerminalClick?: () => void;
  onSettingsClick?: () => void;
  /** Center hub: assistant command center (real shortcuts into chat, logs, network, settings). */
  onCommandCenterClick?: () => void;
}

export function BottomDock({
  onNetworkClick,
  onDiagnosticsClick,
  onSensorsClick,
  onTerminalClick,
  onSettingsClick,
  onCommandCenterClick,
}: BottomDockActions) {
  const { isSystemsReady, isListening, toggleListening, lastTranscript } = useNeuralSystem();

  interface Slot {
    icon: React.ReactNode;
    color: string;
    label: string;
    title: string;
    active?: boolean;
    low?: boolean;
    onClick?: () => void;
    /** When true the slot is rendered as a static indicator (no button semantics). */
    displayOnly?: boolean;
  }

  // Every interactive slot maps to a real, existing destination in the app.
  // CELL is intentionally display-only — there is no real power action, so we
  // surface it honestly as a status indicator rather than a fake button.
  const slots: Slot[] = [
    {
      icon: <Shield className="w-5 h-5" />,
      color: 'blue',
      label: 'SECURE',
      title: 'Open system diagnostics',
      active: true,
      onClick: onDiagnosticsClick,
    },
    {
      icon: <Zap className="w-5 h-5" />,
      color: 'orange',
      label: 'POWER',
      title: 'Environmental panel (local motion, mic, browser signals when sensors are armed)',
      active: isSystemsReady,
      onClick: onSensorsClick,
    },
    {
      icon: <Wifi className="w-5 h-5" />,
      color: 'green',
      label: 'LINK',
      title: 'Browser network status (online / Network Information API)',
      active: isSystemsReady,
      onClick: onNetworkClick,
    },
    {
      icon: <Mic className="w-5 h-5" />,
      color: 'red',
      label: 'VOICE',
      title: isListening ? 'Stop voice input' : 'Start voice input',
      active: isListening,
      onClick: toggleListening,
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      color: 'blue',
      label: 'CORE',
      title: 'System terminal (display-only, no shell)',
      active: true,
      onClick: onTerminalClick,
    },
    {
      icon: <Battery className="w-5 h-5" />,
      color: 'red',
      label: 'CELL',
      title: 'Power cell status',
      active: true,
      low: true,
      displayOnly: true,
    },
    {
      icon: <Activity className="w-5 h-5" />,
      color: 'magenta',
      label: 'SYNC',
      title: 'Open AI configuration',
      active: true,
      onClick: onSettingsClick,
    },
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
            className="absolute -top-12 bg-[linear-gradient(180deg,rgba(0,0,0,0.92),rgba(6,16,20,0.88))] border border-cyber-blue/40 px-4 py-1.5 rounded-full text-[10px] font-mono text-cyber-blue shadow-[0_0_18px_rgba(0,255,255,0.18)] z-50 max-w-[82%] truncate tracking-[0.16em]"
          >
            <span className="opacity-50 mr-2">LISTENING:</span>
            {lastTranscript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dock Body */}
      <div className="dock-chassis relative w-[95%] h-16 bg-[linear-gradient(180deg,rgba(31,35,44,0.96),rgba(21,24,31,0.98))] border-2 border-[#3a3f47] rounded-lg flex items-center justify-around px-4 shadow-[0_18px_34px_rgba(0,0,0,0.42)] overflow-hidden">
        {/* Metallic Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.08),transparent_42%)] pointer-events-none" />
        <div className="absolute left-4 right-4 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-blue/35 to-transparent pointer-events-none" />
        
        {/* Center hub — opens assistant command center when wired; otherwise decorative only. */}
        {onCommandCenterClick ? (
          <motion.button
            type="button"
            onClick={onCommandCenterClick}
            aria-label="Assistant command center — operational hub"
            title="Assistant command center — shortcuts to chat, mission logs, network, and settings"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[linear-gradient(180deg,#111318,#090b0f)] rounded-full border-2 border-cyber-blue/45 flex items-center justify-center z-20 shadow-[0_0_26px_rgba(0,255,255,0.22)] cursor-pointer hover:border-cyber-blue/70"
          >
            <div className="w-10 h-10 rounded-full border border-cyber-blue/55 flex items-center justify-center shadow-[0_0_18px_rgba(0,255,255,0.14)_inset]">
              <div className="w-6 h-6 rounded-full bg-cyber-blue/25 flex items-center justify-center shadow-[0_0_18px_rgba(0,255,255,0.14)]">
                <div className="w-2 h-2 rounded-full bg-cyber-blue shadow-[0_0_10px_#00ffff]" />
              </div>
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-t-2 border-cyber-blue/40 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
            />
          </motion.button>
        ) : (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[linear-gradient(180deg,#111318,#090b0f)] rounded-full border-2 border-[#3a3f47] flex items-center justify-center z-20 shadow-[0_0_24px_rgba(0,0,0,0.5)]">
            <div className="w-10 h-10 rounded-full border border-cyber-blue/45 flex items-center justify-center shadow-[0_0_18px_rgba(0,255,255,0.12)_inset]">
              <div className="w-6 h-6 rounded-full bg-cyber-blue/20 flex items-center justify-center shadow-[0_0_18px_rgba(0,255,255,0.12)]">
                <div className="w-2 h-2 rounded-full bg-cyber-blue shadow-[0_0_10px_#00ffff]" />
              </div>
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-t-2 border-cyber-blue/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* Slots Left */}
        <div className="flex gap-2 z-10">
          {slots.slice(0, 3).map((slot, i) => (
            <DockSlot key={`left-${i}`} {...slot} />
          ))}
        </div>

        {/* Spacer for Center */}
        <div className="w-16" />

        {/* Slots Right */}
        <div className="flex gap-2 z-10">
          {slots.slice(3).map((slot, i) => (
            <DockSlot key={`right-${i}`} {...slot} />
          ))}
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
      <div className="mt-1 bg-[linear-gradient(180deg,#1a1d24,#12151b)] border-x-2 border-b-2 border-[#3a3f47] px-6 py-0.5 rounded-b-lg shadow-lg">
        <span className="text-[10px] font-mono font-black italic tracking-[0.24em] text-gray-400 uppercase">
          NERD LAUNCHER
        </span>
      </div>
    </div>
  );
}

interface DockSlotProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  title: string;
  active?: boolean;
  low?: boolean;
  onClick?: () => void;
  displayOnly?: boolean;
}

function DockSlot({ icon, color, label, title, active, low, onClick, displayOnly }: DockSlotProps) {
  const glowColor = color === 'green' ? 'shadow-[0_0_10px_#39ff14]' : color === 'red' ? 'shadow-[0_0_10px_#ef4444]' : color === 'orange' ? 'shadow-[0_0_10px_#f97316]' : color === 'magenta' ? 'shadow-[0_0_10px_#ff00ff]' : 'shadow-[0_0_10px_#00ffff]';
  const textColor = color === 'green' ? 'text-neon-green' : color === 'red' ? 'text-red-500' : color === 'orange' ? 'text-bio-orange' : color === 'magenta' ? 'text-fuchsia-500' : 'text-cyber-blue';
  const borderColor = color === 'green' ? 'border-neon-green/50' : color === 'red' ? 'border-red-500/50' : color === 'orange' ? 'border-bio-orange/50' : color === 'magenta' ? 'border-fuchsia-500/50' : 'border-cyber-blue/50';

  const chrome = (
    <>
      <div className="absolute inset-x-1 top-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      <div className={`${active ? textColor : 'text-gray-600'} ${active && low ? 'animate-pulse' : ''} z-10 transition-transform duration-200 group-hover:scale-105`}>
        {icon}
      </div>
      {active && (
        <div className={`absolute inset-0 opacity-20 ${glowColor} bg-current pointer-events-none`} />
      )}
      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/20" />
      <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-white/20" />
      <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/20" />
      <span className="sr-only">{label}</span>
    </>
  );

  const baseChrome = `w-10 h-12 rounded border ${active ? borderColor : 'border-gray-700'} bg-[linear-gradient(180deg,rgba(0,0,0,0.48),rgba(9,11,15,0.74))] flex items-center justify-center relative overflow-hidden group`;

  if (displayOnly || !onClick) {
    return (
      <div
        aria-label={`${label} — ${title}`}
        title={`${label} — ${title}`}
        className={`${baseChrome} opacity-90`}
      >
        {chrome}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`${label} — ${title}`}
      title={`${label} — ${title}`}
      whileHover={{ y: -1.5, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`${baseChrome} cursor-pointer hover:bg-white/5 transition-all duration-200`}
    >
      {chrome}
    </motion.button>
  );
}
