import React, { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface NerdLoginProps {
  onLogin: () => Promise<void> | void;
  isAuthenticating: boolean;
  authError: string | null;
}

/**
 * Optional `/neo_boot.mp4` inside reactor: skipped on native WebView (thermal / autoplay),
 * reduced motion, data-saver, or missing/too-long asset.
 */
function useLoginBootVideoPreference(): boolean {
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setAllow(false);
      return;
    }
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (reduced || saveData) {
      setAllow(false);
      return;
    }

    let cancelled = false;
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = '/neo_boot.mp4';
    const onMeta = () => {
      if (cancelled) return;
      if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0 && video.duration < 12) {
        setAllow(true);
      } else {
        setAllow(false);
      }
    };
    const onErr = () => {
      if (!cancelled) setAllow(false);
    };
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onErr);
    video.load();

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onErr);
    };
  }, []);

  return allow;
}

export function NerdLogin({ onLogin, isAuthenticating, authError }: NerdLoginProps) {
  const allowBootVideo = useLoginBootVideoPreference();
  const arcMarks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => (
        <li
          key={i}
          className="absolute left-1/2 top-1/2 block h-[9px] w-[3px] -ml-[1.5px] -mt-[4.5px] bg-[rgba(2,254,255,0.85)]"
          style={{ transform: `rotate(${i * 6}deg) translateY(-64px)` }}
        />
      )),
    []
  );

  return (
    <div className="min-h-screen w-full overflow-hidden bg-black font-sans text-white">
      <style>{`
        @keyframes neo-ireact-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes neo-ireact-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes neo-ireact-flicker {
          0%, 100% { box-shadow: 0 0 40px 18px rgba(150,255,255,0.45), inset 0 1px 4px 2px rgba(21,211,233,0.3); }
          50% { box-shadow: 0 0 34px 12px rgba(150,255,255,0.45), inset 0 1px 40px 2px rgba(21,211,233,0.35); }
        }
        @keyframes neo-scanbar { 0% { top: -10%; opacity: 0.8; } 100% { top: 110%; opacity: 0; } }
        @keyframes neo-alo { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes neo-glitch {
          0% { transform: translate(0); text-shadow: -2px 0 #72dcff, 2px 0 #ff51fa; }
          20% { transform: translate(-1px, 1px); }
          100% { transform: translate(0); text-shadow: -2px 0 #72dcff, 2px 0 #ff51fa; }
        }
        .neo-login-mesh {
          background:
            radial-gradient(ellipse 70% 50% at 30% 40%, rgba(114,220,255,0.14), transparent 50%),
            radial-gradient(ellipse 50% 40% at 70% 60%, rgba(255,140,0,0.1), transparent 45%),
            radial-gradient(ellipse 60% 50% at 50% 100%, rgba(47,248,1,0.08), transparent 40%),
            linear-gradient(180deg, #020305, #000);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 neo-login-mesh" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.92)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] opacity-70" />

      <header className="fixed left-0 right-0 top-0 z-20 flex justify-between px-6 pt-5 text-[9px] font-bold uppercase tracking-[0.3em]">
        <div className="flex flex-col gap-1 text-white/70">
          <span>Secure access</span>
          <div className="h-px w-10 bg-[rgba(114,220,255,0.6)]" />
        </div>
        <div className="flex flex-col items-end gap-1 text-[rgba(47,248,1,0.9)]">
          <span>Supabase auth</span>
          <div className="h-px w-10 bg-[rgba(47,248,1,0.6)]" />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[430px] flex-col items-center justify-center px-5 pb-10 pt-16">
        <div className="relative mb-6 h-[340px] w-[340px] max-w-full shrink-0">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,#3a3a3a,#141414_60%,#0a0a0a)] shadow-[0_0_0_3px_#1a1a1a,0_0_60px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.8)]" />
          <div className="absolute left-1/2 top-[-2px] h-4 w-2.5 -translate-x-1/2 rounded-sm border border-[#333] bg-[#1e1e1e]" />
          <div className="absolute bottom-[-2px] left-1/2 h-4 w-2.5 -translate-x-1/2 rounded-sm border border-[#333] bg-[#1e1e1e]" />

          <div
            className="absolute left-[4%] top-[18%] h-[22px] w-2 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#ff5500] shadow-[0_0_12px_#FF8C00]"
            style={{ animation: 'neo-alo 1.8s ease-in-out infinite' }}
          />
          <div
            className="absolute right-[4%] top-[18%] h-[22px] w-2 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#ff5500] shadow-[0_0_12px_#FF8C00]"
            style={{ animation: 'neo-alo 1.8s 0.3s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-[18%] left-[4%] h-[22px] w-2 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#ff5500] shadow-[0_0_12px_#FF8C00]"
            style={{ animation: 'neo-alo 1.8s 0.6s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-[18%] right-[4%] h-[22px] w-2 rounded-full bg-gradient-to-b from-[#FF8C00] to-[#ff5500] shadow-[0_0_12px_#FF8C00]"
            style={{ animation: 'neo-alo 1.8s 0.9s ease-in-out infinite' }}
          />

          <div className="absolute left-[-4px] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#2ff801] bg-[#0a1a0a] text-[9px] font-black text-[#2ff801] shadow-[0_0_10px_rgba(47,248,1,0.6)]">
            ⚙
          </div>
          <div className="absolute right-[-4px] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#72dcff] bg-[#0a0e1a] text-[9px] font-black text-[#72dcff] shadow-[0_0_10px_rgba(114,220,255,0.6)]">
            AI
          </div>

          <div
            className="absolute inset-[6px] overflow-hidden rounded-full opacity-35"
            style={{ animation: 'neo-ireact-cw 25s linear infinite' }}
          >
            <svg className="h-full w-full" viewBox="0 0 328 328" fill="none" aria-hidden>
              <g fill="#555">
                <path d="M164 4 L168 18 L176 18 L180 4 L188 7 L185 21 L193 26 L200 14 L207 19 L201 30 L208 37 L220 32 L224 40 L213 46 L218 55 L230 53 L233 62 L221 65 L223 75 L235 77 L235 86 L222 85 L221 95 L233 100 L230 109 L218 105 L213 114 L224 120 L220 128 L208 123 L201 130 L207 141 L200 146 L193 134 L185 139 L188 153 L180 156 L176 142 L168 142 L164 156 L156 142 L148 142 L144 156 L136 153 L139 139 L131 134 L124 146 L117 141 L123 130 L116 123 L104 128 L100 120 L111 114 L106 105 L94 109 L91 100 L103 95 L102 85 L89 86 L89 77 L101 75 L103 65 L91 62 L94 53 L106 55 L111 46 L100 40 L104 32 L116 37 L123 30 L117 19 L124 14 L131 26 L139 21 L136 7 L144 4 L148 18 L156 18 Z" />
              </g>
            </svg>
          </div>

          <div
            className="absolute inset-[44px] rounded-full border-[3px] border-[rgba(114,220,255,0.9)] shadow-[0_0_12px_#72dcff,0_0_24px_rgba(114,220,255,0.4),inset_0_0_12px_rgba(114,220,255,0.2)]"
            style={{ animation: 'neo-ireact-ccw 8s linear infinite' }}
          />
          <div
            className="absolute inset-[60px] rounded-full border-2 border-[rgba(180,80,255,0.8)] shadow-[0_0_10px_#b450ff]"
            style={{ animation: 'neo-ireact-cw 12s linear infinite' }}
          />
          <div
            className="absolute inset-[80px] rounded-full border-[1.5px] border-dashed border-[rgba(114,220,255,0.5)]"
            style={{ animation: 'neo-ireact-cw 20s linear infinite' }}
          />

          <div className="absolute inset-[90px] rounded-full bg-[radial-gradient(circle_at_40%_30%,#0d1a2a,#050a10_70%,#020408)] shadow-[inset_0_0_24px_rgba(0,0,0,0.5)] ring-1 ring-[rgba(114,220,255,0.3)]" />

          <div className="absolute inset-[90px] z-[4] overflow-hidden rounded-full">
            <div className="arc_reactor relative h-full w-full rounded-full shadow-[0_0_50px_15px_rgba(2,255,255,0.3),inset_0_0_50px_15px_rgba(2,255,255,0.3)]">
              <div className="absolute left-[6%] top-[6%] h-[88%] w-[88%] rounded-full">
                <div className="absolute left-[2.37%] top-[2.37%] h-[95.25%] w-[95.25%] rounded-full border-[6px] border-transparent bg-transparent text-center">
                  <div
                    className="absolute left-[3%] top-[3%] h-[94%] w-[94%] rounded-full border-[5px] border-l-transparent border-[#02feff] border-r-transparent"
                    style={{ animation: 'neo-ireact-cw 4s linear infinite' }}
                  >
                    <div
                      className="absolute left-[3%] top-[3%] h-[94%] w-[94%] rounded-full border-2 border-l-transparent border-[rgba(2,255,255,0.7)] border-r-transparent"
                      style={{ animation: 'neo-ireact-ccw 4s linear infinite' }}
                    >
                      <div
                        className="absolute left-[3%] top-[3%] h-[94%] w-[94%] rounded-full border-2 border-l-transparent border-[rgba(2,255,255,0.5)] border-r-transparent"
                        style={{ animation: 'neo-ireact-cw 3s linear infinite' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-[90px] z-[6]">
            <ul className="absolute inset-0 m-0 list-none p-0">{arcMarks}</ul>
          </div>

          <div
            className="pointer-events-none absolute left-0 right-0 top-[44px] z-[5] h-[3px] rounded-full bg-gradient-to-r from-transparent via-[rgba(114,220,255,0.6)] to-transparent"
            style={{ animation: 'neo-scanbar 3s ease-in-out infinite', position: 'absolute' }}
          />

          <div className="pointer-events-none absolute inset-[108px] z-[5] flex items-center justify-center overflow-hidden rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.35)]">
            <div className="relative h-full w-full overflow-hidden rounded-full">
              {allowBootVideo ? (
                <video
                  className="h-full w-full scale-[0.84] rounded-full object-cover opacity-[0.97] mix-blend-screen"
                  style={{
                    filter: 'saturate(1.05) contrast(1.04) brightness(0.94) drop-shadow(0 0 4px rgba(114,220,255,0.08))',
                  }}
                  src="/neo_boot.mp4"
                  autoPlay
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  aria-hidden
                />
              ) : (
                <div
                  className="absolute left-1/2 top-1/2 z-[1] h-[52%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-[rgba(2,255,255,0.15)] bg-[#cedce0]"
                  style={{ animation: 'neo-ireact-flicker 0.2s infinite' }}
                />
              )}
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_64%,rgba(0,8,14,0.08)_82%,rgba(0,0,0,0.25)_100%)]" />
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[10px] z-10 -translate-x-1/2 whitespace-nowrap text-[8px] font-extrabold uppercase tracking-[0.3em] text-[#777]">
            Nerd launcher
          </div>
          <div className="absolute bottom-3 left-1/2 z-10 w-[130px] -translate-x-1/2 rounded-md border border-[rgba(114,220,255,0.65)] bg-[rgba(0,8,20,0.97)] px-2.5 py-1 text-center shadow-[0_0_14px_rgba(114,220,255,0.45)]">
            <div className="text-[22px] font-black leading-none text-[#72dcff] drop-shadow-[0_0_10px_#72dcff]">01</div>
            <div className="text-[7px] font-bold uppercase tracking-[0.15em] text-[rgba(114,220,255,0.8)]">Auth gate</div>
          </div>
        </div>

        <div className="mb-1" style={{ animation: 'neo-glitch 5s linear infinite alternate-reverse' }}>
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-5xl font-black italic leading-none text-[#72dcff] drop-shadow-[0_0_14px_currentColor]">
              N
            </span>
            <span className="pb-1 text-4xl font-black italic text-white/60">.</span>
            <span className="text-5xl font-black italic leading-none text-[#2ff801] drop-shadow-[0_0_14px_currentColor]">
              E
            </span>
            <span className="pb-1 text-4xl font-black italic text-white/60">.</span>
            <span className="text-5xl font-black italic leading-none text-[#ff51fa] drop-shadow-[0_0_14px_currentColor]">
              R
            </span>
            <span className="pb-1 text-4xl font-black italic text-white/60">.</span>
            <span className="text-5xl font-black italic leading-none text-[#FF8C00] drop-shadow-[0_0_14px_currentColor]">
              D
            </span>
            <span className="pb-1 text-4xl font-black italic text-white/60">.</span>
          </div>
        </div>
        <p className="mb-8 text-center text-[9px] font-bold uppercase tracking-[0.4em] text-[#2ff801] drop-shadow-[0_0_14px_rgba(47,248,1,0.9)]">
          Neural environment robotic director
        </p>

        <div className="flex w-full max-w-[360px] flex-col gap-3.5">
          <button
            type="button"
            onClick={onLogin}
            disabled={isAuthenticating}
            className="flex w-full items-center justify-center gap-3.5 rounded-2xl border-2 border-[rgba(114,220,255,0.5)] bg-[rgba(0,8,22,0.88)] px-6 py-4 backdrop-blur-sm transition hover:border-[#72dcff] hover:shadow-[0_0_30px_rgba(114,220,255,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#FFC107"
                d="M43.6 20H24v8h11.3C33.7 33.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37 10.7C33.5 7.5 29 5.5 24 5.5 13.8 5.5 5.5 13.8 5.5 24S13.8 42.5 24 42.5c11 0 19.5-8 19.5-18.5 0-1.3-.1-2.7-.4-4z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 15l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9L37 10.7C33.5 7.5 29 5.5 24 5.5c-7.5 0-13.9 4.3-17.7 10.5z"
              />
              <path
                fill="#4CAF50"
                d="M24 42.5c5 0 9.4-1.9 12.8-5l-6-5.1C28.9 34 26.6 35 24 35c-5.2 0-9.6-3.4-11.2-8.1l-6.5 5C9.9 38 16.5 42.5 24 42.5z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6 5.1C40.6 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"
              />
            </svg>
            <span className="text-xs font-black italic uppercase tracking-[0.22em] text-[#72dcff]">
              {isAuthenticating ? 'Opening Google…' : 'Google sign-in'}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(114,220,255,0.25)] to-transparent" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Or</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(114,220,255,0.25)] to-transparent" />
          </div>

          <div
            className="flex w-full cursor-not-allowed flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[rgba(47,248,1,0.35)] bg-[rgba(0,12,5,0.88)] px-6 py-4 opacity-80 backdrop-blur-sm"
            aria-disabled
          >
            <span className="text-[10px] font-black italic uppercase tracking-[0.2em] text-[rgba(47,248,1,0.9)]">
              Neural link offline
            </span>
            <span className="text-center text-[9px] leading-relaxed text-zinc-500">
              Post-sign-in shell unlocks sensors, chat, and mission hub. No alternate login path here.
            </span>
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2ff801] shadow-[0_0_8px_#2ff801]" style={{ animation: 'neo-alo 1.2s ease-in-out infinite' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[rgba(47,248,1,0.3)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[rgba(47,248,1,0.1)]" />
            </div>
          </div>

          {authError && (
            <div className="rounded-lg border border-red-500/70 bg-red-500/15 px-4 py-3 text-left">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Authentication error</div>
              <div className="text-[11px] leading-relaxed text-red-100">{authError}</div>
            </div>
          )}
        </div>

        <footer className="mt-8 flex flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
          <div className="flex gap-7">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF8C00] shadow-[0_0_6px_#FF8C00]" />
              Session shell
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff51fa] shadow-[0_0_6px_#ff51fa]" />
              Labels illustrative
            </span>
          </div>
          <p className="max-w-[320px] text-center text-[8px] font-normal normal-case tracking-normal text-zinc-600">
            {allowBootVideo
              ? 'Boot reel: muted, short clip only on capable desktop web (disabled on native / reduced motion / data saver).'
              : 'Boot reel skipped — static reactor + CSS motion only for this session.'}
          </p>
        </footer>
      </main>
    </div>
  );
}
