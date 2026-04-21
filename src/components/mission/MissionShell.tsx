import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Radar, SlidersHorizontal, X } from 'lucide-react';

const AssistantCommandCenterScreen = lazy(() =>
  import('../AssistantCommandCenterScreen').then((m) => ({ default: m.AssistantCommandCenterScreen }))
);
const NerdDeviceDiscoveryMission = lazy(() =>
  import('./NerdDeviceDiscoveryMission').then((m) => ({ default: m.NerdDeviceDiscoveryMission }))
);
const SettingsMatrixScreen = lazy(() =>
  import('../SettingsMatrixScreen').then((m) => ({ default: m.SettingsMatrixScreen }))
);

export type MissionTab = 'assistant' | 'discovery' | 'settings';

export interface MissionShellProps {
  initialTab: MissionTab;
  onClose: () => void;
  /** After closing the shell, expand the main chat strip. */
  onExpandChat?: () => void;
  onOpenMissionLogs: () => void;
  onOpenDiagnostics: () => void;
  onOpenSensors: () => void;
  onOpenTerminal: () => void;
}

function MissionNav({
  active,
  onSelect,
}: {
  active: MissionTab;
  onSelect: (t: MissionTab) => void;
}) {
  const item = (tab: MissionTab, icon: React.ReactNode, label: string) => {
    const isOn = active === tab;
    return (
      <button
        type="button"
        onClick={() => onSelect(tab)}
        className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-3 transition-colors ${
          isOn
            ? 'text-cyan-400 bg-cyan-500/10 shadow-[inset_0_0_12px_rgba(0,210,255,.2)]'
            : 'text-zinc-500 hover:text-lime-400'
        }`}
        aria-current={isOn ? 'page' : undefined}
      >
        <span className="scale-90">{icon}</span>
        <span className="mt-1 text-[10px] font-black italic uppercase tracking-[0.12rem]">{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="pointer-events-auto absolute bottom-0 left-0 right-0 z-[130] mx-auto flex h-20 max-w-[430px] items-center justify-around rounded-t-2xl border-t border-cyan-500/20 bg-black/90 px-3 shadow-[0_-10px_30px_rgba(0,210,255,.06)] backdrop-blur-xl"
      aria-label="Mission navigation"
    >
      {item('assistant', <Brain className="h-6 w-6" />, 'Assistant')}
      {item('discovery', <Radar className="h-6 w-6" />, 'Discovery')}
      {item('settings', <SlidersHorizontal className="h-6 w-6" />, 'Settings')}
    </nav>
  );
}

export function MissionShell({
  initialTab,
  onClose,
  onExpandChat,
  onOpenMissionLogs,
  onOpenDiagnostics,
  onOpenSensors,
  onOpenTerminal,
}: MissionShellProps) {
  const [tab, setTab] = useState<MissionTab>(initialTab);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const select = useCallback((t: MissionTab) => {
    setTab(t);
  }, []);

  const closeThen = useCallback(
    (fn: () => void) => {
      onClose();
      fn();
    },
    [onClose]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="pointer-events-auto fixed inset-0 z-[110] flex items-stretch justify-center bg-black/80 font-sans text-white"
      role="dialog"
      aria-modal
      aria-label="N.E.R.D. mission interface"
    >
      <div className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden border-x border-cyan-500/15 bg-[#050505] shadow-[0_0_40px_rgba(0,210,255,0.08)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-[140] rounded-full border border-zinc-700 bg-black/70 p-2 text-zinc-400 transition hover:border-cyan-500/40 hover:text-white"
          aria-label="Close mission interface"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="min-h-0 flex-1 overflow-hidden pb-20 pt-2"
          style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
        >
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/50 border-t-transparent" />
              </div>
            }
          >
            {tab === 'assistant' && (
              <AssistantCommandCenterScreen
                embedded
                selectedDeviceId={selectedDeviceId}
                onClose={onClose}
                onExpandChat={() => {
                  onClose();
                  onExpandChat?.();
                }}
                onOpenMissionLogs={() => closeThen(onOpenMissionLogs)}
                onOpenNetwork={() => select('discovery')}
                onOpenSettings={() => select('settings')}
                onOpenDiagnostics={() => closeThen(onOpenDiagnostics)}
                onOpenSensors={() => closeThen(onOpenSensors)}
                onOpenTerminal={() => closeThen(onOpenTerminal)}
              />
            )}
            {tab === 'discovery' && (
              <NerdDeviceDiscoveryMission
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={setSelectedDeviceId}
                onNavigate={select}
              />
            )}
            {tab === 'settings' && <SettingsMatrixScreen embedded onClose={onClose} />}
          </Suspense>
        </div>

        <MissionNav active={tab} onSelect={select} />
      </div>
    </motion.div>
  );
}
