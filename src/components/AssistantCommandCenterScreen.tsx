import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Cpu,
  MessageSquare,
  Radar,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Terminal,
  Wifi,
  X,
} from 'lucide-react';
import { useNeuralAuth, useNeuralRealtime, useNeuralSystem, useNeuralUi } from '../context/NeuralContext';

export interface AssistantCommandCenterScreenProps {
  onClose: () => void;
  onExpandChat: () => void;
  onOpenMissionLogs: () => void;
  onOpenNetwork: () => void;
  onOpenSettings: () => void;
  onOpenDiagnostics: () => void;
  onOpenSensors: () => void;
  onOpenTerminal: () => void;
}

/**
 * Full-screen assistant / operations hub. Visual layer is NERD command-center chrome;
 * every control maps to an existing in-app destination or is explicitly labeled decorative.
 */
export function AssistantCommandCenterScreen({
  onClose,
  onExpandChat,
  onOpenMissionLogs,
  onOpenNetwork,
  onOpenSettings,
  onOpenDiagnostics,
  onOpenSensors,
  onOpenTerminal,
}: AssistantCommandCenterScreenProps) {
  const { user } = useNeuralAuth();
  const { isSystemsReady, isListening, lastTranscript } = useNeuralSystem();
  const { audioData, userPosition } = useNeuralRealtime();
  const { currentModel, neuralSurge, effectiveHudMotionScale } = useNeuralUi();

  const motionPct = useMemo(() => {
    const mag = Math.hypot(userPosition.x, userPosition.y);
    return Math.min(100, Math.round(mag * 100));
  }, [userPosition.x, userPosition.y]);

  const spectralPct = useMemo(() => {
    if (audioData.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < audioData.length; i += 1) sum += audioData[i];
    return Math.min(100, Math.round((sum / audioData.length / 255) * 100));
  }, [audioData]);

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[120] flex flex-col bg-[#030506] text-white font-mono overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Assistant command center"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,234,255,0.12),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(255,96,0,0.08),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_4px]" />

      <header className="relative z-10 flex items-start justify-between gap-3 px-4 pt-4 pb-2 border-b border-cyan-500/20 bg-black/40">
        <div>
          <p className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/70 mb-1">N.E.O. · Assistant command center</p>
          <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200 drop-shadow-[0_0_12px_rgba(0,234,255,0.35)]">
            Operational hub
          </h1>
          <p className="text-[10px] text-gray-500 mt-2 max-w-[280px] leading-relaxed">
            Shortcuts open real panels and chat. Ring gauges below use the same live local signals as Environmental
            (only after sensors are armed).
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 rounded-full border border-white/15 bg-black/50 text-gray-300 hover:text-white hover:border-cyan-400/40 transition-colors"
          aria-label="Close command center"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-5 pb-8">
        <section className="grid grid-cols-2 gap-3">
          <StatTile
            label="Session"
            value={user?.email?.split('@')[0] ?? 'Signed in'}
            sub={user?.email ?? '—'}
            icon={<Cpu className="w-4 h-4 text-cyan-400" />}
          />
          <StatTile
            label="Model route"
            value={currentModel}
            sub="Protected /api/ai when you send chat"
            icon={<Activity className="w-4 h-4 text-neon-green" />}
          />
          <StatTile
            label="Local sensors"
            value={isSystemsReady ? 'ARMED' : 'STANDBY'}
            sub={isSystemsReady ? 'Motion + mic pipeline live' : 'Arm from startup gate after sign-in'}
            icon={<Radar className="w-4 h-4 text-fuchsia-400" />}
          />
          <StatTile
            label="Browser link"
            value={online ? 'ONLINE' : 'OFFLINE'}
            sub="Connectivity for Supabase + AI"
            icon={<Wifi className="w-4 h-4 text-bio-orange" />}
          />
        </section>

        <section className="relative rounded-lg border border-cyan-500/25 bg-black/45 p-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(0,234,255,0.15),transparent_40%,rgba(255,96,0,0.12),transparent_70%)]" />
          <p className="relative text-[9px] uppercase tracking-[0.22em] text-gray-500 mb-4">Local field (honest)</p>
          <div className="relative flex justify-around items-end gap-4 h-28">
            <RingGauge
              label="Motion"
              pct={isSystemsReady ? motionPct : null}
              unavailable={!isSystemsReady}
            />
            <RingGauge
              label="Acoustic"
              pct={isSystemsReady ? spectralPct : null}
              unavailable={!isSystemsReady}
            />
            <RingGauge
              label="HUD motion"
              pct={Math.round(effectiveHudMotionScale * 100)}
              unavailable={false}
              hint="Shell motion scale (preference)"
            />
          </div>
          {isListening && lastTranscript && (
            <p className="relative mt-3 text-[10px] text-cyan-200/90 border border-cyan-500/20 rounded px-2 py-1.5 bg-cyan-500/5">
              <span className="text-gray-500 uppercase tracking-wider mr-2">Voice</span>
              {lastTranscript}
            </p>
          )}
        </section>

        <section>
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 mb-2">Neural pulse (real state)</p>
          <div
            className={`rounded border px-3 py-2 text-[10px] flex items-center gap-2 ${
              neuralSurge
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-white/10 bg-white/5 text-gray-400'
            }`}
            title="Tied to AI / voice activity pulse in this session (not CPU load)."
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${neuralSurge ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-gray-600'}`}
            />
            {neuralSurge ? 'Neural surge active (AI or voice output)' : 'Neural surge idle'}
          </div>
        </section>

        <section>
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 mb-3">Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton icon={<MessageSquare className="w-4 h-4" />} label="Open chat" onClick={onExpandChat} />
            <ActionButton icon={<ScrollText className="w-4 h-4" />} label="Mission logs" onClick={onOpenMissionLogs} />
            <ActionButton icon={<Wifi className="w-4 h-4" />} label="Network intel" onClick={onOpenNetwork} />
            <ActionButton icon={<Settings className="w-4 h-4" />} label="Operator matrix" onClick={onOpenSettings} />
            <ActionButton icon={<Shield className="w-4 h-4" />} label="Diagnostics" onClick={onOpenDiagnostics} />
            <ActionButton icon={<SlidersHorizontal className="w-4 h-4" />} label="Environmental" onClick={onOpenSensors} />
            <ActionButton icon={<Terminal className="w-4 h-4" />} label="Terminal view" onClick={onOpenTerminal} />
          </div>
        </section>

        <p className="text-[9px] text-gray-600 leading-relaxed border border-white/5 rounded p-2 bg-black/30">
          Decorative HUD strips on the right rail stay in the main shell; they are not duplicated here so we do not
          imply duplicate telemetry.
        </p>
      </div>
    </motion.div>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,22,0.92),rgba(6,8,12,0.96))] p-3 shadow-[0_0_18px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 mb-2 text-[9px] uppercase tracking-[0.18em] text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-[11px] font-bold text-cyan-100 leading-tight break-all">{value}</div>
      <div className="text-[9px] text-gray-500 mt-1.5 leading-snug">{sub}</div>
    </div>
  );
}

function RingGauge({
  label,
  pct,
  unavailable,
  hint,
}: {
  label: string;
  pct: number | null;
  unavailable: boolean;
  hint?: string;
}) {
  const display = unavailable || pct === null ? '—' : `${pct}%`;
  const stroke = unavailable ? 'rgba(75,85,99,0.5)' : 'rgba(0,234,255,0.85)';
  const r = 36;
  const c = 2 * Math.PI * r;
  const p = unavailable || pct === null ? 0 : Math.min(1, Math.max(0, pct / 100)) * c;

  return (
    <div className="flex flex-col items-center gap-1 w-[100px]" title={hint}>
      <div className="relative w-[88px] h-[88px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeDasharray={`${p} ${c}`}
            strokeLinecap="round"
            className={unavailable ? '' : 'drop-shadow-[0_0_10px_rgba(0,234,255,0.45)]'}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
          {display}
        </div>
      </div>
      <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 text-center">
        {label}
        {unavailable && <span className="block text-[7px] text-orange-300/90 normal-case tracking-normal">Standby</span>}
      </span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded border border-cyan-500/25 bg-black/50 px-3 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/10 hover:border-cyan-400/45 transition-colors shadow-[0_0_14px_rgba(0,234,255,0.08)]"
    >
      <span className="text-cyan-400">{icon}</span>
      {label}
    </button>
  );
}
