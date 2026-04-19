import React from 'react';
import { motion } from 'motion/react';
import { X, Binary } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';

export interface SettingsMatrixScreenProps {
  onClose: () => void;
}

/**
 * Full-screen operator settings matrix. Wraps the real SettingsPanel (localStorage persistence unchanged).
 */
export function SettingsMatrixScreen({ onClose }: SettingsMatrixScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[120] flex flex-col bg-[#020305] text-white font-mono overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Operator settings matrix"
    >
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,200,0.03)_3px),repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,200,255,0.025)_3px)] bg-[length:100%_24px,24px_100%]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,234,255,0.14),transparent_50%)]" />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4 pb-2 border-b border-emerald-500/25 bg-black/50">
        <div className="flex items-center gap-2 min-w-0">
          <Binary className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.28em] text-emerald-300/70">Operator matrix</p>
            <h1 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100 truncate">
              System preferences
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 rounded-full border border-white/15 bg-black/50 text-gray-300 hover:text-white hover:border-emerald-400/40 transition-colors"
          aria-label="Close settings matrix"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="relative z-10 flex-1 min-h-0 p-3">
        <div
          className="h-full rounded-lg border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(8,12,14,0.96),rgba(4,6,8,0.98))] shadow-[0_0_28px_rgba(16,185,129,0.12)_inset] overflow-hidden flex flex-col"
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
