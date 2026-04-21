import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Brain,
  Cpu,
  ExternalLink,
  Flag,
  History,
  MessageSquare,
  Mic,
  MicOff,
  Radar,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Terminal,
  Wifi,
  X,
} from 'lucide-react';
import { useNeuralAuth, useNeuralRealtime, useNeuralSystem, useNeuralUi } from '../context/NeuralContext';
import { fetchAssistantNetworkIntel, type AssistantNetworkIntel } from '../lib/network';

export interface AssistantCommandCenterScreenProps {
  /** When true, sits inside MissionShell (no fixed fullscreen / no duplicate close control). */
  embedded?: boolean;
  onClose: () => void;
  onExpandChat: () => void;
  onOpenMissionLogs: () => void;
  onOpenNetwork: () => void;
  onOpenSettings: () => void;
  onOpenDiagnostics: () => void;
  onOpenSensors: () => void;
  onOpenTerminal: () => void;
  selectedDeviceId?: string | null;
}

type UiMode = 'text' | 'voice' | 'agent';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatTimelineTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function lastScanPathLabel(networkIntel: AssistantNetworkIntel | null): string {
  const scanPath = networkIntel?.lastScan?.metrics?.scanPath;
  if (scanPath === 'native_android') return 'Native Android bounded reachability';
  if (scanPath === 'browser_safe') return 'Browser-safe limited visibility';
  return 'No stored scan path yet';
}

function selectedDeviceHeading(selectedDeviceId: string | null, selectedDeviceTitle: string | null): string {
  if (selectedDeviceTitle) return selectedDeviceTitle;
  if (selectedDeviceId) return 'Refreshing selected device';
  return 'No device selected';
}

/**
 * Assistant command center — visual fidelity from nerd_assistant_command_center.html.
 * Controls are wired to real destinations or explicitly marked unavailable / decorative.
 */
export function AssistantCommandCenterScreen({
  embedded = false,
  onClose,
  onExpandChat,
  onOpenMissionLogs,
  onOpenNetwork,
  onOpenSettings,
  onOpenDiagnostics,
  onOpenSensors,
  onOpenTerminal,
  selectedDeviceId = null,
}: AssistantCommandCenterScreenProps) {
  const { user } = useNeuralAuth();
  const { isSystemsReady, isListening, lastTranscript, toggleListening } = useNeuralSystem();
  const { audioData, userPosition } = useNeuralRealtime();
  const { currentModel, neuralSurge, effectiveHudMotionScale } = useNeuralUi();
  const [uiMode, setUiMode] = useState<UiMode>('text');
  const [readoutTick, setReadoutTick] = useState(0);
  const [networkIntel, setNetworkIntel] = useState<AssistantNetworkIntel | null>(null);
  const [networkIntelLoading, setNetworkIntelLoading] = useState(false);
  const [networkIntelError, setNetworkIntelError] = useState<string | null>(null);
  const selectedDeviceRequestVersionRef = useRef(0);

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

  const intentLabel = useMemo(() => {
    if (lastTranscript && isListening) return 'Voice capture';
    if (lastTranscript) return 'Voice (idle)';
    return 'Operator assist';
  }, [isListening, lastTranscript]);

  const modeLabel = useMemo(() => {
    if (uiMode === 'voice') return 'Voice';
    if (uiMode === 'agent') return 'Agent';
    return 'Text';
  }, [uiMode]);

  const syncReadout = useCallback(() => {
    setReadoutTick((t) => t + 1);
  }, []);

  const loadNetworkIntel = useCallback(async () => {
    if (!user) {
      setNetworkIntel(null);
      setNetworkIntelError(null);
      return;
    }

    const requestVersion = selectedDeviceRequestVersionRef.current + 1;
    selectedDeviceRequestVersionRef.current = requestVersion;
    setNetworkIntelLoading(true);
    setNetworkIntelError(null);
    try {
      const nextIntel = await fetchAssistantNetworkIntel(user.id, { selectedDeviceId: selectedDeviceId ?? undefined });
      if (requestVersion === selectedDeviceRequestVersionRef.current) {
        setNetworkIntel(nextIntel);
      }
    } catch (error) {
      if (requestVersion === selectedDeviceRequestVersionRef.current) {
        setNetworkIntelError(getErrorMessage(error));
      }
    } finally {
      if (requestVersion === selectedDeviceRequestVersionRef.current) {
        setNetworkIntelLoading(false);
      }
    }
  }, [selectedDeviceId, user]);

  useEffect(() => {
    void loadNetworkIntel();
  }, [loadNetworkIntel]);

  const voiceBarsActive = isSystemsReady && isListening;

  const bufferLines = useMemo(() => {
    void readoutTick;
    const t = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return [
      { c: 'text-cyan-400' as const, t, msg: `Session: ${user?.email ?? '—'}` },
      { c: 'text-lime-400' as const, t, msg: `Browser link: ${online ? 'online' : 'offline'}` },
      {
        c: 'text-fuchsia-400' as const,
        t,
        msg: `Local sensors: ${isSystemsReady ? 'armed' : 'standby'} · motion ${isSystemsReady ? `${motionPct}%` : '—'}`,
      },
      { c: 'text-cyan-400' as const, t, msg: `Last voice: ${lastTranscript || '—'}` },
    ];
  }, [readoutTick, user?.email, online, isSystemsReady, motionPct, lastTranscript]);

  const selectedDeviceContext = networkIntel?.selectedDevice ?? null;
  const selectedDeviceBrief = selectedDeviceContext?.device ?? null;

  const selectedDeviceHistory = useMemo(
    () => selectedDeviceContext?.recentEvents ?? [],
    [selectedDeviceContext],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        embedded
          ? 'relative z-10 flex h-full min-h-0 flex-col overflow-hidden bg-[#0b0b0b] font-mono text-white'
          : 'absolute inset-0 z-[120] flex flex-col overflow-hidden bg-[#0b0b0b] font-mono text-white'
      }
      role="dialog"
      aria-modal="true"
      aria-label="Assistant command center"
      style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,210,255,0.03)_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,210,255,0.10),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(255,81,250,0.08),transparent_24%),linear-gradient(180deg,#0b0b0b,#000000_55%,#040404)]" />

      {/* Sticky header — nerd_assistant_command_center.html */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-cyan-500/20 bg-black/85 px-5 shadow-[0_0_24px_rgba(0,210,255,0.08)] backdrop-blur-xl">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Brain className="h-7 w-7 shrink-0 text-cyan-400" aria-hidden />
          <div className="min-w-0">
            <h1 className="text-lg font-black italic uppercase tracking-[0.18rem] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,210,255,0.65)]">
              Assistant Core
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.22rem] text-zinc-500">N.E.R.D. director shell</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-lime-400/20 bg-lime-400/10 px-2.5 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#2ff801] shadow-[0_0_10px_#2ff801]" />
            <span className="text-[10px] font-black italic uppercase tracking-[0.15rem] text-lime-400">
              {user && online ? 'Ready' : 'Degraded'}
            </span>
          </div>
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 bg-black/50 p-2 text-gray-300 transition-colors hover:border-cyan-400/40 hover:text-white"
              aria-label="Close command center"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4 custom-scrollbar">
        <section className="relative mb-4 overflow-hidden rounded-2xl border border-[rgba(114,220,255,0.12)] bg-[rgba(22,22,22,0.68)] p-4 shadow-[0_0_24px_rgba(0,210,255,0.12)] backdrop-blur-md">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #111 25%, transparent 25%),
                linear-gradient(-45deg, #111 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #111 75%),
                linear-gradient(-45deg, transparent 75%, #111 75%)`,
              backgroundSize: '4px 4px',
              backgroundColor: '#080808',
            }}
          />
          <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[rgba(114,220,255,0.38)]" />
          <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-[rgba(114,220,255,0.38)]" />
          <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-[rgba(114,220,255,0.38)]" />
          <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[rgba(114,220,255,0.38)]" />

          <div className="relative mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black italic uppercase tracking-[0.2rem] text-cyan-400">
                Neural assistant reactor
              </p>
              <p className="text-[10px] font-bold italic text-zinc-500">
                Chat, tasks, and discovery shortcuts below — gauges use the same signals as Environmental when sensors are
                armed.
              </p>
            </div>
            <button
              type="button"
              onClick={syncReadout}
              className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-black italic uppercase tracking-[0.14rem] text-cyan-400 active:scale-95"
              title="Refresh on-screen readouts from live app state (no simulated cycle)"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Sync
            </button>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center">
            <div className="absolute inset-[8%] rounded-full border border-cyan-500/12" />
            <div className="absolute inset-[18%] rounded-full border border-cyan-500/18 [animation:neo-assist-spin_18s_linear_infinite]" />
            <div className="absolute inset-[28%] rounded-full border border-dashed border-lime-400/30 [animation:neo-assist-spin-rev_14s_linear_infinite]" />
            <div className="absolute inset-[38%] rounded-full border border-fuchsia-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute h-[82%] w-px bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent" />
              <div className="absolute h-px w-[82%] bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-cyan-400/50 bg-black/60 shadow-[0_0_40px_rgba(0,210,255,.22)] [animation:neo-assist-pulse_2.8s_ease-in-out_infinite]">
                <div className="absolute inset-3 rounded-full border border-cyan-500/25" />
                <Activity className="h-14 w-14 text-cyan-400 drop-shadow-[0_0_14px_rgba(0,210,255,.65)]" aria-hidden />
              </div>
            </div>

            <div className="absolute left-[10%] top-[14%] rounded-lg border border-cyan-500/25 bg-black/65 px-2 py-1.5 text-[9px] font-black italic uppercase tracking-[0.12rem] text-cyan-400">
              Intent: <span className="text-cyan-100">{intentLabel}</span>
            </div>
            <div className="absolute right-[9%] top-[19%] rounded-lg border border-lime-400/25 bg-black/65 px-2 py-1.5 text-[9px] font-black italic uppercase tracking-[0.12rem] text-lime-400">
              Confidence: <span className="text-lime-100">N/A</span>
            </div>
            <div className="absolute bottom-[16%] left-[12%] rounded-lg border border-fuchsia-500/25 bg-black/65 px-2 py-1.5 text-[9px] font-black italic uppercase tracking-[0.12rem] text-fuchsia-400">
              UI focus: <span className="text-fuchsia-100">{modeLabel}</span>
            </div>
            <div className="absolute bottom-[12%] right-[10%] rounded-lg border border-cyan-500/25 bg-black/65 px-2 py-1.5 text-[9px] font-black italic uppercase tracking-[0.12rem] text-zinc-300">
              Model: <span className="text-white">{currentModel}</span>
            </div>
            <p className="pointer-events-none absolute -bottom-1 left-0 right-0 text-center text-[8px] font-bold italic text-zinc-600">
              Intent confidence is not modeled in-app — label avoids fake percentages.
            </p>
          </div>

          <div className="relative z-10 mt-3 grid grid-cols-3 gap-2">
            {(
              [
                { id: 'text' as const, label: 'Text' },
                { id: 'voice' as const, label: 'Voice' },
                { id: 'agent' as const, label: 'Agent' },
              ] as const
            ).map(({ id, label }) => {
              const on = uiMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUiMode(id)}
                  className={`rounded-xl border px-2 py-2 text-[10px] font-black italic uppercase tracking-[0.12rem] transition-colors ${
                    on
                      ? 'border-cyan-500/42 bg-cyan-500/10 text-cyan-200 shadow-[inset_0_0_16px_rgba(0,210,255,.22)]'
                      : 'border-zinc-700 bg-zinc-900/70 text-zinc-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="relative z-10 mt-2 text-[9px] leading-relaxed text-zinc-600">
            UI focus is display-only (which lane you are thinking in). Chat is typed; voice capture uses the dock mic when
            sensors are armed. Multi-agent routing is not shipped — &ldquo;Agent&rdquo; is a future lane label.
          </p>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(114,220,255,0.12)] bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
            <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="mb-2 flex items-center gap-2">
              <Mic className="h-4 w-4 text-cyan-400" />
              <h2 className="text-[11px] font-black italic uppercase tracking-[0.12rem] text-cyan-400">Voice activity</h2>
            </div>
            <div className="flex h-20 items-end justify-center gap-1.5 rounded-xl border border-cyan-500/15 bg-black/55 px-3 pb-4">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const hPct = voiceBarsActive
                  ? Math.max(14, Math.min(92, 22 + spectralPct * 0.55 + Math.sin((readoutTick + i) * 0.7) * 8))
                  : 18;
                return (
                  <div
                    key={i}
                    className={`w-2 rounded-full shadow-[0_0_10px_rgba(114,220,255,.6)] transition-[height] duration-150 ${
                      i === 3 ? 'bg-lime-400 shadow-[0_0_10px_rgba(47,248,1,.5)]' : i === 4 ? 'bg-fuchsia-400' : 'bg-cyan-400'
                    } ${voiceBarsActive ? '' : 'opacity-40'}`}
                    style={{ height: `${hPct}%` }}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-[10px] font-bold italic text-zinc-500">
              Bars reflect mic spectrum when listening and sensors are armed; otherwise idle.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[rgba(114,220,255,0.12)] bg-[rgba(22,22,22,0.68)] p-3 backdrop-blur-md">
            <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-lime-400/10 blur-2xl" />
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-lime-400" />
              <h2 className="text-[11px] font-black italic uppercase tracking-[0.12rem] text-lime-400">Pipeline</h2>
            </div>
            <div className="space-y-2">
              <PipelineRow label="Browser link" value={online ? 'Up' : 'Down'} ok={online} />
              <PipelineRow
                label="Stored devices"
                value={networkIntel ? String(networkIntel.summary.totalDevices) : user ? '...' : 'N/A'}
                ok={Boolean(networkIntel && networkIntel.summary.totalDevices > 0)}
              />
              <p className="text-[9px] font-bold italic leading-relaxed text-zinc-500">
                LAN / device graph: <span className="text-zinc-400">stored rows</span> only — not full LAN coverage.
              </p>
              <p className="text-[9px] font-bold italic leading-relaxed text-zinc-500">
                Last scan: <span className="text-zinc-400">{networkIntel?.lastScan?.status ?? 'none'}</span> — {lastScanPathLabel(networkIntel)}.
              </p>
            </div>
            <p className="mt-2 text-[10px] font-bold italic text-zinc-500">
              No fake progress — assistant network data is read from Supabase rows and current capability checks.
            </p>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-[rgba(114,220,255,0.12)] bg-[rgba(12,12,14,0.85)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black italic uppercase tracking-[0.14rem] text-white">Network intelligence</h2>
              <p className="text-[10px] font-bold italic text-zinc-500">Assistant-facing summary from stored devices, scans, and events.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                syncReadout();
                void loadNetworkIntel();
              }}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-black italic uppercase tracking-[0.12rem] text-cyan-400"
              title="Refresh assistant network intelligence from Supabase-backed rows"
            >
              Refresh
            </button>
          </div>
          {networkIntelLoading && !networkIntel ? (
            <p className="text-[10px] font-bold italic text-zinc-500">Loading stored network intelligence...</p>
          ) : networkIntelError ? (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[10px] text-red-100">
              {networkIntelError}
            </p>
          ) : networkIntel ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <IntelMetric label="Known" value={networkIntel.summary.totalDevices} />
                <IntelMetric label="Trusted" value={networkIntel.summary.trustedDevices} />
                <IntelMetric label="Favorite" value={networkIntel.summary.favoriteDevices} />
                <IntelMetric label="Ignored" value={networkIntel.summary.ignoredDevices} />
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-400">{networkIntel.networkSummaryText}</p>
              <p className="text-[10px] leading-relaxed text-zinc-500">{networkIntel.changeSummaryText}</p>
              <div className="grid grid-cols-2 gap-2">
                <IntelMetric label="Timeline" value={networkIntel.timeline.items.length} />
                <IntelMetric label="Review" value={networkIntel.timeline.attentionItems.length} />
              </div>
              {networkIntel.timeline.items.length > 0 ? (
                <div className="space-y-2">
                  {networkIntel.timeline.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-xl border border-orange-400/10 bg-black/35 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black italic uppercase tracking-[0.1rem] text-orange-200">
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.1rem] text-zinc-600">
                          {formatTimelineTime(item.occurredAt)}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold italic leading-relaxed text-zinc-500">{item.body}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-600">No scan snapshots or device events are stored yet.</p>
              )}
              {networkIntel.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {networkIntel.recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.id} className="rounded-xl border border-cyan-500/10 bg-black/40 px-3 py-2">
                      <div className="text-[10px] font-black italic uppercase tracking-[0.1rem] text-cyan-300">{rec.title}</div>
                      <div className="text-[10px] font-bold italic leading-relaxed text-zinc-500">{rec.body}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-600">No action recommendation is available until device or scan data exists.</p>
              )}
              <p className="rounded-lg border border-orange-500/15 bg-orange-500/5 px-3 py-2 text-[10px] leading-relaxed text-orange-100/80">
                Limit: {networkIntel.limitationNotes[0]}
              </p>
            </div>
          ) : (
            <p className="text-[10px] font-bold italic text-zinc-500">Sign in to load Supabase-backed network intelligence.</p>
          )}
        </section>

        <section className="mb-4 rounded-2xl border border-[rgba(114,220,255,0.12)] bg-[rgba(12,12,14,0.85)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black italic uppercase tracking-[0.14rem] text-white">Selected device</h2>
              <p className="text-[10px] font-bold italic text-zinc-500">
                Device-specific operator context from the current mission selection.
              </p>
            </div>
            <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-black italic uppercase tracking-[0.12rem] text-cyan-300">
              {selectedDeviceBrief ? 'linked' : 'none'}
            </span>
          </div>
          {selectedDeviceBrief ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-cyan-500/10 bg-black/40 px-3 py-3">
                <div className="text-[11px] font-black italic uppercase tracking-[0.1rem] text-cyan-300">
                  {selectedDeviceHeading(selectedDeviceId, selectedDeviceBrief?.title ?? null)}
                </div>
                <div className="mt-1 text-[10px] font-bold italic leading-relaxed text-zinc-500">
                  IP {selectedDeviceBrief.ipAddress} · status {selectedDeviceBrief.status} · trusted {selectedDeviceBrief.trusted ? 'yes' : 'no'} · ignored {selectedDeviceBrief.ignored ? 'yes' : 'no'}
                </div>
                <div className="mt-2 text-[10px] leading-relaxed text-zinc-400">
                  {selectedDeviceBrief.hostname
                    ? `Hostname is currently ${selectedDeviceBrief.hostname}.`
                    : 'Hostname is currently unavailable from the stored record.'}
                  {' '}
                  {selectedDeviceBrief.notes
                    ? `Operator notes: ${selectedDeviceBrief.notes}`
                    : 'No operator notes are stored yet.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <SelectedDeviceCard
                  icon={<History className="h-4 w-4 text-orange-300" />}
                  title="What changed?"
                  body={
                    selectedDeviceHistory.length > 0
                      ? selectedDeviceHistory.map((item) => `${item.eventType}: ${item.message ?? 'No extra detail recorded.'}`).join(' ')
                      : 'No recent stored events are linked to this device yet.'
                  }
                />
                <SelectedDeviceCard
                  icon={<Flag className="h-4 w-4 text-lime-300" />}
                  title="What can I do?"
                  body={selectedDeviceBrief.availableActions
                    .slice(0, 4)
                    .map((action) => `${action.label} (${action.state})`)
                    .join(', ')}
                />
              </div>

              <div className="space-y-2">
                {selectedDeviceBrief.availableActions.slice(0, 5).map((action) => (
                  <div key={`${selectedDeviceBrief.id}:${action.actionType}`} className="rounded-xl border border-zinc-800 bg-black/35 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black italic uppercase tracking-[0.1rem] text-cyan-200">
                        {action.label}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-[0.1rem] text-zinc-500">
                        {action.state}
                      </span>
                    </div>
                    <div className="text-[10px] leading-relaxed text-zinc-500">{action.reason}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 px-3 py-2 text-[10px] leading-relaxed text-orange-100/80">
                {selectedDeviceBrief.candidateAdminUrl
                  ? `Candidate interface available: ${selectedDeviceBrief.candidateAdminUrl}. This is only a candidate URL; admin certainty is not claimed.`
                  : 'No candidate interface URL is currently available for this device.'}
              </div>
            </div>
          ) : (
            <p className="text-[10px] font-bold italic leading-relaxed text-zinc-500">
              {selectedDeviceId
                ? 'Selected device context is refreshing. If this persists, return to Discovery and reselect the device.'
                : 'Select a device from the discovery mission to ask grounded questions like what changed for this device, what actions are available, or whether it should be trusted or ignored.'}
            </p>
          )}
        </section>

        <section className="relative mb-4 rounded-2xl border border-cyan-500/25 bg-black/45 p-4">
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

        <section className="mb-4">
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

        <section className="mb-4 rounded-2xl border border-[rgba(114,220,255,0.12)] bg-[rgba(22,22,22,0.55)] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black italic uppercase tracking-[0.14rem] text-white">Command modules</h2>
              <p className="text-[10px] font-bold italic text-zinc-500">Wired shortcuts into this shell.</p>
            </div>
            <span className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-1 text-[9px] font-black italic uppercase tracking-[0.14rem] text-fuchsia-400">
              7 live · 1 off
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ModuleButton
              icon={<MessageSquare className="h-5 w-5 text-cyan-400" />}
              title="Assistant channel"
              subtitle="Open the main chat strip."
              accent="cyan"
              onClick={onExpandChat}
            />
            <ModuleButton
              icon={<ScrollText className="h-5 w-5 text-lime-400" />}
              title="Mission logs"
              subtitle="Supabase-backed tasks panel."
              accent="lime"
              onClick={onOpenMissionLogs}
            />
            <ModuleButton
              icon={<Radar className="h-5 w-5 text-fuchsia-400" />}
              title="Discovery intel"
              subtitle="Stored scan and device intelligence."
              accent="fuchsia"
              onClick={onOpenNetwork}
            />
            <ModuleButton
              icon={<Settings className="h-5 w-5 text-cyan-400" />}
              title="Operator matrix"
              subtitle="HUD + AI prefs (localStorage)."
              accent="cyan"
              onClick={onOpenSettings}
            />
            <ModuleButton
              icon={<Shield className="h-5 w-5 text-cyan-400" />}
              title="Diagnostics"
              subtitle="Sensor + sync status."
              accent="cyan"
              onClick={onOpenDiagnostics}
            />
            <ModuleButton
              icon={<SlidersHorizontal className="h-5 w-5 text-lime-400" />}
              title="Environmental"
              subtitle="Motion, mic, browser signals."
              accent="lime"
              onClick={onOpenSensors}
            />
            <ModuleButton
              icon={<Terminal className="h-5 w-5 text-fuchsia-400" />}
              title="Terminal view"
              subtitle="Display-only buffer."
              accent="fuchsia"
              onClick={onOpenTerminal}
            />
            <button
              type="button"
              disabled
              title="Isolation/quarantine requires a scan engine and policy backend — not implemented."
              className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-3 text-left opacity-70"
            >
              <Shield className="h-5 w-5 text-red-400/80" aria-hidden />
              <div className="mt-2 text-[11px] font-black italic uppercase tracking-[0.1rem] text-red-300">Quarantine</div>
              <div className="text-[10px] font-bold italic text-zinc-500">Unavailable — no host inventory yet.</div>
            </button>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-[rgba(114,220,255,0.12)] bg-[rgba(12,12,14,0.85)] p-4">
          <p className="text-[9px] font-black italic uppercase tracking-[0.22rem] text-gray-500 mb-3">Runtime (truthful)</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-3">
              <div>
                <div className="text-[11px] font-black italic uppercase tracking-[0.1rem] text-cyan-400">Voice capture</div>
                <div className="text-[10px] font-bold italic text-zinc-500">
                  Same control as dock mic — requires armed local sensors.
                </div>
              </div>
              <button
                type="button"
                disabled={!isSystemsReady}
                onClick={() => toggleListening()}
                title={!isSystemsReady ? 'Arm local sensors from the startup gate first.' : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black italic uppercase tracking-wider transition-colors ${
                  isSystemsReady
                    ? isListening
                      ? 'border-lime-400/50 bg-lime-400/15 text-lime-300'
                      : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                    : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
                }`}
              >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {isListening ? 'Stop' : 'Start'}
              </button>
            </div>
            <UnavailableRow
              title="Device suggestions"
              body="Surfacing likely hostnames during scan is not wired in this client."
            />
            <UnavailableRow title="Auto-execute network actions" body="All network-changing actions stay manual until a policy engine exists." />
            <UnavailableRow
              title="Spoken summaries"
              body="Chat read-aloud is not a global toggle here — use chat UI / browser speech when available."
            />
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-cyan-500/15 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black italic uppercase tracking-[0.14rem] text-white">Session buffer</h2>
              <p className="text-[10px] font-bold italic text-zinc-500">Live fields from this device — not a simulated log.</p>
            </div>
            <button
              type="button"
              onClick={syncReadout}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-black italic uppercase tracking-[0.12rem] text-cyan-400"
            >
              Refresh
            </button>
          </div>
          <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-cyan-500/10 bg-black/50 p-3 font-mono text-[10px]">
            {bufferLines.map((row, i) => (
              <div key={`${row.msg}-${i}`} className="flex gap-2">
                <span className={row.c}>[{row.t}]</span>
                <span className="text-zinc-300">{row.msg}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[9px] text-gray-600 leading-relaxed border border-white/5 rounded p-2 bg-black/30">
          Decorative HUD rails remain on the main shell; this hub duplicates no phantom telemetry.
        </p>
      </div>

      <style>{`
        @keyframes neo-assist-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes neo-assist-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes neo-assist-pulse { 0%, 100% { transform: scale(1); opacity: 0.82; } 50% { transform: scale(1.04); opacity: 1; } }
      `}</style>
    </motion.div>
  );
}

function PipelineRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] font-black italic uppercase text-zinc-400">
        <span>{label}</span>
        <span className={ok ? 'text-cyan-300' : 'text-red-400/90'}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full ${ok ? 'w-full bg-cyan-400' : 'w-full bg-red-500/70'}`} />
      </div>
    </div>
  );
}

function IntelMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-black/45 px-2 py-2 text-center">
      <div className="text-lg font-black italic text-cyan-100">{value}</div>
      <div className="text-[8px] font-black uppercase tracking-[0.12rem] text-zinc-500">{label}</div>
    </div>
  );
}

function UnavailableRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 px-3 py-3 opacity-90">
      <div>
        <div className="text-[11px] font-black italic uppercase tracking-[0.1rem] text-zinc-500">{title}</div>
        <div className="text-[10px] font-bold italic text-zinc-600">{body}</div>
      </div>
      <span className="rounded-full border border-zinc-700 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-500">
        N/A
      </span>
    </div>
  );
}

function SelectedDeviceCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-black/40 px-3 py-3">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <div className="text-[10px] font-black italic uppercase tracking-[0.1rem] text-cyan-200">{title}</div>
      </div>
      <div className="text-[10px] leading-relaxed text-zinc-500">{body}</div>
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
    <div className="flex w-[100px] flex-col items-center gap-1" title={hint}>
      <div className="relative h-[88px] w-[88px]">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
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
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{display}</div>
      </div>
      <span className="text-center text-[8px] uppercase tracking-[0.2em] text-gray-500">
        {label}
        {unavailable && (
          <span className="mt-0.5 block text-[7px] font-normal normal-case tracking-normal text-orange-300/90">Standby</span>
        )}
      </span>
    </div>
  );
}

function ModuleButton({
  icon,
  title,
  subtitle,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: 'cyan' | 'lime' | 'fuchsia';
  onClick: () => void;
}) {
  const border =
    accent === 'lime'
      ? 'border-lime-400/20 bg-lime-400/8 hover:bg-lime-400/12'
      : accent === 'fuchsia'
        ? 'border-fuchsia-500/20 bg-fuchsia-500/8 hover:bg-fuchsia-500/12'
        : 'border-cyan-500/20 bg-cyan-500/8 hover:bg-cyan-500/12';
  const titleC =
    accent === 'lime' ? 'text-lime-400' : accent === 'fuchsia' ? 'text-fuchsia-400' : 'text-cyan-400';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors active:scale-[0.98] ${border}`}
    >
      {icon}
      <div className={`mt-2 text-[11px] font-black italic uppercase tracking-[0.1rem] ${titleC}`}>{title}</div>
      <div className="text-[10px] font-bold italic text-zinc-500">{subtitle}</div>
    </button>
  );
}
