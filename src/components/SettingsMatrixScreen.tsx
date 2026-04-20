import React, { useCallback } from 'react';
import { motion } from 'motion/react';
import { X, SlidersHorizontal } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';

export interface SettingsMatrixScreenProps {
  onClose: () => void;
  /** Inside MissionShell: relative layout, shell provides outer close control. */
  embedded?: boolean;
}

/**
 * Full-screen operator settings matrix. Wraps the real SettingsPanel (localStorage persistence unchanged).
 */
export function SettingsMatrixScreen({ onClose, embedded = false }: SettingsMatrixScreenProps) {
  const scrollToApply = useCallback(() => {
    document.getElementById('nerd-settings-apply')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        embedded
          ? 'relative z-10 flex h-full min-h-0 flex-col overflow-hidden bg-[#090909] font-mono text-white'
          : 'absolute inset-0 z-[120] flex flex-col overflow-hidden bg-[#090909] font-mono text-white'
      }
      style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label="Operator settings matrix"
    >
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_3px),repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.02)_3px)] bg-[length:24px_24px,24px_24px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,81,250,.10),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(0,210,255,.10),transparent_20%)]" />

      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-cyan-500/20 bg-black/85 px-5 shadow-[0_0_24px_rgba(0,210,255,0.06)] backdrop-blur-xl">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SlidersHorizontal className="h-7 w-7 shrink-0 text-fuchsia-400" aria-hidden />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black italic uppercase tracking-[0.18rem] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,210,255,0.45)]">
              Settings matrix
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2rem] text-zinc-500">Operator control shell</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={scrollToApply}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-black italic uppercase tracking-[0.14rem] text-cyan-400 active:scale-95"
            title="Scroll to Apply settings (same action as the button in the panel)"
          >
            Apply focus
          </button>
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 bg-black/50 p-2 text-gray-300 transition-colors hover:border-cyan-400/40 hover:text-white"
              aria-label="Close settings matrix"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 flex-1 min-h-0 p-3">
        <div
          className="h-full rounded-lg border border-cyan-500/25 bg-[linear-gradient(180deg,rgba(8,12,14,0.96),rgba(4,6,8,0.98))] shadow-[0_0_28px_rgba(0,210,255,0.1)_inset] overflow-hidden flex flex-col"
          style={{
            clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
          }}
        >
          <div className="flex-1 min-h-0 p-3 overflow-y-auto flex flex-col">
            <SettingsPanel onClose={onClose} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
