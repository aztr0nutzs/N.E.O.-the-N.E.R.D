import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface NerdLoginProps {
  onLogin: () => Promise<void> | void;
  isAuthenticating: boolean;
  authError: string | null;
}

const PARTICLE_COLORS = ['#ff3cac', '#00eaff', '#3ddc84', '#ffae00', '#ff6000'] as const;

export function NerdLogin({ onLogin, isAuthenticating, authError }: NerdLoginProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = prefersReducedMotion ? 12 : 30;
    const particles = Array.from({ length: particleCount }, () => ({
      x: 0,
      y: 0,
      radius: Math.random() * 1.8 + 0.5,
      velocityX: (Math.random() - 0.5) * 0.16,
      velocityY: -(Math.random() * 0.26 + 0.08),
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      alphaPhase: Math.random() * Math.PI * 2,
    }));

    let width = 0;
    let height = 0;
    let scanY = 0;
    let animationFrameId = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(Math.floor(bounds.width), 1);
      height = Math.max(Math.floor(bounds.height), 1);
      canvas.width = Math.max(Math.floor(width * pixelRatio), 1);
      canvas.height = Math.max(Math.floor(height * pixelRatio), 1);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      particles.forEach((particle) => {
        if (particle.x === 0 && particle.y === 0) {
          particle.x = Math.random() * width;
          particle.y = Math.random() * height;
        }
      });
    };

    const drawFrame = () => {
      context.clearRect(0, 0, width, height);

      context.fillStyle = '#020303';
      context.fillRect(0, 0, width, height);

      context.strokeStyle = 'rgba(0,255,136,0.045)';
      context.lineWidth = 0.5;
      for (let x = 0; x <= width; x += 30) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y <= height; y += 30) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      particles.forEach((particle) => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.alphaPhase += 0.02;

        if (particle.y < -6) {
          particle.y = height + 6;
          particle.x = Math.random() * width;
          particle.alphaPhase = 0;
        }

        if (particle.x < -6) {
          particle.x = width + 6;
        } else if (particle.x > width + 6) {
          particle.x = -6;
        }

        const alpha = Math.floor((Math.abs(Math.sin(particle.alphaPhase)) * 110) + 28)
          .toString(16)
          .padStart(2, '0');

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `${particle.color}${alpha}`;
        context.fill();
      });

      scanY = (scanY + 0.85) % Math.max(height, 1);
      const scanGradient = context.createLinearGradient(0, scanY - 36, 0, scanY + 36);
      scanGradient.addColorStop(0, 'rgba(0,200,255,0)');
      scanGradient.addColorStop(0.5, 'rgba(0,200,255,0.06)');
      scanGradient.addColorStop(1, 'rgba(0,200,255,0)');
      context.fillStyle = scanGradient;
      context.fillRect(0, scanY - 36, width, 72);

      animationFrameId = window.requestAnimationFrame(drawFrame);
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    if (prefersReducedMotion) {
      drawFrame();
      window.cancelAnimationFrame(animationFrameId);
    } else {
      animationFrameId = window.requestAnimationFrame(drawFrame);
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#050505] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        @keyframes nerd-login-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,234,255,0.09),transparent_34%),radial-gradient(circle_at_50%_78%,rgba(255,96,0,0.08),transparent_28%)]" />

        <div className="relative h-[100dvh] max-h-[932px] w-full max-w-[430px] overflow-hidden border border-white/10 bg-[#020303] shadow-[0_0_45px_rgba(0,255,255,0.12)]">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,transparent_82%,rgba(255,255,255,0.025))]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,234,255,0.1)_0%,rgba(0,0,0,0)_58%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.015)_49%,rgba(255,255,255,0.028)_50%,transparent_100%)] bg-[length:100%_6px] opacity-30" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black via-black/60 to-transparent" />

          <div className="relative z-10 flex h-full flex-col items-center px-6 pb-10 pt-14 text-center">
            <div className="mb-3 flex w-full items-center justify-between text-[8px] uppercase tracking-[0.28em] text-cyan-300/60 [font-family:'Orbitron',monospace]">
              <span>Secure Access</span>
              <span>Supabase Auth</span>
            </div>

            <motion.div
              className="relative mb-8 mt-2 w-[302px] max-w-full"
              animate={{
                rotate: [0, 0.7, -0.7, 0],
                filter: [
                  'drop-shadow(0 0 24px rgba(0,234,255,0.18))',
                  'drop-shadow(0 0 30px rgba(255,96,0,0.16))',
                  'drop-shadow(0 0 24px rgba(0,234,255,0.18))',
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(0,234,255,0.18)_0%,rgba(255,60,172,0.1)_36%,rgba(0,0,0,0)_74%)] blur-2xl" />
              <div className="relative rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-3 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0 rounded-[34px] border border-[#ff7a00]/55 shadow-[0_0_25px_rgba(255,96,0,0.25)]" />
                <div className="absolute left-5 top-5 h-3.5 w-3.5 rounded-full border border-cyan-300/70 bg-[radial-gradient(circle,#55a8ff,#163693)] shadow-[0_0_10px_rgba(85,168,255,0.55)]" />
                <div className="absolute right-5 top-5 h-3.5 w-3.5 rounded-full border border-cyan-300/70 bg-[radial-gradient(circle,#55a8ff,#163693)] shadow-[0_0_10px_rgba(85,168,255,0.55)]" />
                <div className="absolute bottom-5 left-5 h-3.5 w-3.5 rounded-full border border-cyan-300/70 bg-[radial-gradient(circle,#55a8ff,#163693)] shadow-[0_0_10px_rgba(85,168,255,0.55)]" />
                <div className="absolute bottom-5 right-5 h-3.5 w-3.5 rounded-full border border-cyan-300/70 bg-[radial-gradient(circle,#55a8ff,#163693)] shadow-[0_0_10px_rgba(85,168,255,0.55)]" />

                <div className="relative overflow-hidden rounded-[28px] border border-[#1a3a1a] bg-[linear-gradient(180deg,#030606,#070b0c)] px-5 py-5 shadow-[inset_0_0_20px_rgba(61,220,132,0.08)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,234,255,0.12),transparent_55%)]" />
                  <img
                    src="/login/nerd_login_reactor.png"
                    alt="N.E.R.D. launcher reactor"
                    className="relative z-10 mx-auto h-auto w-full max-w-[248px] object-contain"
                  />
                </div>
              </div>
            </motion.div>

            <div
              className="mb-3 bg-[linear-gradient(90deg,#ff3cac,#00eaff,#3ddc84,#ffae00,#ff3cac)] bg-[length:300%_100%] bg-clip-text text-[42px] font-black uppercase tracking-[0.36em] text-transparent [font-family:'Orbitron',monospace]"
              style={{ animation: 'nerd-login-shimmer 4s linear infinite' }}
            >
              N.E.R.D.
            </div>
            <div className="text-[10px] uppercase tracking-[0.42em] text-neon-green [font-family:'Orbitron',monospace]">
              Neural Environment
            </div>
            <div className="mb-7 mt-1 text-[10px] uppercase tracking-[0.42em] text-neon-green [font-family:'Orbitron',monospace]">
              Robotic Director
            </div>

            <div className="relative mb-7 h-[2px] w-[88%] bg-gradient-to-r from-transparent via-[#ff6000] via-50% to-transparent">
              <div className="absolute inset-x-[20%] -inset-y-1 bg-gradient-to-r from-transparent via-[#ff6000]/70 to-transparent blur-md" />
            </div>

            <button
              onClick={onLogin}
              disabled={isAuthenticating}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-[14px] border border-cyan-300/30 bg-[linear-gradient(135deg,#00c8ff,#0088dd)] px-4 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-black shadow-[0_0_22px_rgba(0,200,255,0.42),0_0_50px_rgba(0,200,255,0.2)] transition-transform duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 [font-family:'Orbitron',monospace]"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#000" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
              </svg>
              {isAuthenticating ? 'Opening Google...' : 'Sign In With Google'}
            </button>

            <div
              aria-live="polite"
              className="w-full rounded-[14px] border-2 border-neon-green/80 bg-black/35 px-4 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green opacity-65 shadow-[0_0_18px_rgba(61,220,132,0.2),inset_0_0_18px_rgba(61,220,132,0.06)] [font-family:'Orbitron',monospace]"
            >
              Neural Link Unlocks After Sign-In
            </div>

            {authError && (
              <div className="mt-5 w-full rounded-[10px] border border-red-500/70 bg-red-500/18 px-4 py-3 text-left backdrop-blur-sm">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300 [font-family:'Orbitron',monospace]">
                  Authentication Error
                </div>
                <div className="font-mono text-[11px] leading-relaxed text-red-100">
                  {authError}
                </div>
              </div>
            )}

            <div className="mt-auto text-[8px] uppercase tracking-[0.28em] text-[#1a3a1a] [font-family:'Orbitron',monospace]">
              N.E.O. THE N.E.R.D. - v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
