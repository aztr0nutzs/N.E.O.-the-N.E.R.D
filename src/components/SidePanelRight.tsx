import React from 'react';
import { motion } from 'motion/react';
import { Activity, Layers, Radio, Power, Settings } from 'lucide-react';
import { useNeuralUi } from '../context/NeuralContext';

/**
 * Right rail: premium chassis ornament + one real control (Settings).
 * Load strips are synthetic HUD rhythm only — never host CPU/RAM/network telemetry.
 */
export function SidePanelRight({ onToggleSettings }: { onToggleSettings?: () => void }) {
  const { neuralSurge } = useNeuralUi();
  /** Synthetic 0–100 rhythm indices for visuals only (not measured hardware). */
  const syncIndex = neuralSurge ? 88 : 42;
  const bufferIndex = neuralSurge ? 78 : 52;
  const uplinkIndex = neuralSurge ? 72 : 28;

  return (
    <div className="relative w-20 h-fit bg-[linear-gradient(180deg,rgba(31,35,44,0.92),rgba(19,22,28,0.96))] backdrop-blur-md border-l-2 border-r-2 border-[#3a3f47] py-8 flex flex-col items-center gap-8 shadow-[0_20px_38px_rgba(0,0,0,0.38)] overflow-hidden">
      {/* Metallic Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_20%,transparent_78%,rgba(0,0,0,0.18))] pointer-events-none" />
      <div className="absolute left-2 right-2 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-blue/30 to-transparent pointer-events-none" />

      {/* Top indicator — real binding: neuralSurge (AI / voice activity pulse in app state). */}
      <div
        className={`relative w-10 h-10 rounded border-2 flex items-center justify-center transition-all duration-200 ${neuralSurge ? 'border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-gray-600 text-gray-400'}`}
        title={
          neuralSurge
            ? 'Live: neural activity pulse (AI or voice output active in this session).'
            : 'Live: idle — no AI/voice pulse right now. Strip meters below are ornamental only.'
        }
        aria-label={
          neuralSurge
            ? 'Neural activity pulse active for this session'
            : 'Neural activity idle; ornamental meters below are not hardware telemetry'
        }
      >
        <Power className="w-5 h-5" />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono whitespace-nowrap text-gray-500 uppercase tracking-[0.18em]">
          Neural
        </div>
      </div>

      {/* Ornamental strips — not CPU / RAM / network (browser cannot expose those truthfully here). */}
      <div
        className="flex flex-col gap-6 w-full px-3"
        role="group"
        aria-label="Decorative HUD rhythm strips. Not processor, memory, or interface throughput."
      >
        <p className="text-[7px] font-mono text-gray-500 uppercase tracking-[0.16em] leading-tight text-center px-0.5 border border-white/5 rounded py-1 bg-black/25">
          HUD FX only
        </p>
        <HudRhythmStrip
          label="Sync"
          shortLabel="SYN"
          value={syncIndex}
          icon={<Activity className="w-3 h-3" />}
          color={neuralSurge ? 'red' : 'blue'}
          title="Ornamental sync index (accented when neural pulse is active). Not CPU load."
        />
        <HudRhythmStrip
          label="Buffer"
          shortLabel="BUF"
          value={bufferIndex}
          icon={<Layers className="w-3 h-3" />}
          color="blue"
          title="Ornamental buffer index. Not RAM or storage pressure."
        />
        <HudRhythmStrip
          label="Uplink"
          shortLabel="UPL"
          value={uplinkIndex}
          icon={<Radio className="w-3 h-3" />}
          color="green"
          title="Ornamental uplink index. Not measured network throughput or signal strength."
        />
      </div>

      {/* Sole actionable control on this rail: opens real settings (local preferences). */}
      <div className="flex flex-col gap-3 mt-auto w-full px-2">
        <button
          type="button"
          onClick={onToggleSettings}
          disabled={!onToggleSettings}
          className="w-full py-1.5 text-[8px] font-mono uppercase tracking-[0.2em] border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 rounded transition-colors flex items-center justify-center gap-1 bg-black/20 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
          aria-label="Open operator settings"
          title="Operator settings — local preferences on this device"
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

function HudRhythmStrip({
  label,
  shortLabel,
  value,
  icon,
  color,
  title,
}: {
  label: string;
  shortLabel: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'green';
  title: string;
}) {
  const barColor = color === 'red' ? 'bg-red-500' : color === 'green' ? 'bg-neon-green' : 'bg-cyber-blue';
  const glowColor =
    color === 'red' ? 'shadow-[0_0_8px_#ef4444]' : color === 'green' ? 'shadow-[0_0_8px_#39ff14]' : 'shadow-[0_0_8px_#00ffff]';

  return (
    <div className="flex flex-col gap-1" title={title}>
      <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 uppercase tracking-[0.18em]">
        <div className="flex items-center gap-1 min-w-0">
          {icon}
          <span className="truncate" aria-hidden>
            {shortLabel}
          </span>
        </div>
        <span className="text-gray-500 shrink-0 tabular-nums" aria-hidden>
          {Math.round(value)}
        </span>
      </div>
      <span className="sr-only">
        {label}: decorative rhythm index {Math.round(value)} out of 100. Not hardware telemetry.
      </span>
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
