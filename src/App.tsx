import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { SystemStats } from './components/SystemStats';
import { Panel } from './components/Panel';
import { SidePanelLeft } from './components/SidePanelLeft';
import { SidePanelRight } from './components/SidePanelRight';
import { BottomDock } from './components/BottomDock';
import { NerdLogin } from './components/NerdLogin';
import { NerdLogo } from './components/NerdLogo';
import { Power, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getClientSafeMessage, loginWithGoogle, logout } from './authClient';
import { NeuralProvider, useNeuralAuth, useNeuralRealtime, useNeuralSystem, useNeuralUi } from './context/NeuralContext';
import type { MissionTab } from './components/mission/MissionShell';

const Robot2D = lazy(() => import('./components/Robot2D').then(module => ({ default: module.Robot2D })));
const ChatInterface = lazy(() => import('./components/ChatInterface').then(module => ({ default: module.ChatInterface })));
const TaskLog = lazy(() => import('./components/TaskLog').then(module => ({ default: module.TaskLog })));
const MissionShell = lazy(() =>
  import('./components/mission/MissionShell').then((m) => ({ default: m.MissionShell }))
);

function DiagnosticItem({ label, status, details }: { label: string, status: 'online' | 'offline' | 'warning', details: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded flex items-start gap-4">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${status === 'online' ? 'bg-neon-green shadow-[0_0_10px_#39ff14]' : status === 'offline' ? 'bg-red-500 shadow-[0_0_10px_#ff0000]' : 'bg-orange-500 shadow-[0_0_10px_#ffa500]'}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{label}</span>
          <span className={`text-[10px] font-mono uppercase font-bold ${status === 'online' ? 'text-neon-green' : status === 'offline' ? 'text-red-500' : 'text-orange-500'}`}>{status}</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed font-mono">{details}</p>
      </div>
    </div>
  );
}

function Hotspot({ top, left, onClick, label, color = 'blue', motionScale = 1 }: { top: string, left: string, onClick: () => void, label: string, color?: 'blue' | 'green' | 'orange' | 'magenta', motionScale?: number }) {
  const colorClasses = {
    blue: 'bg-cyber-blue shadow-[0_0_15px_rgba(0,255,255,0.8)]',
    green: 'bg-neon-green shadow-[0_0_15px_rgba(57,255,20,0.8)]',
    orange: 'bg-bio-orange shadow-[0_0_15px_rgba(255,140,0,0.8)]',
    magenta: 'bg-fuchsia-500 shadow-[0_0_15px_rgba(255,0,255,0.8)]',
  };
  
  const borderClasses = {
    blue: 'border-cyber-blue',
    green: 'border-neon-green',
    orange: 'border-bio-orange',
    magenta: 'border-fuchsia-500',
  };

  const textClasses = {
    blue: 'text-cyber-blue text-glow-blue',
    green: 'text-neon-green text-glow-green',
    orange: 'text-bio-orange text-glow-orange',
    magenta: 'text-fuchsia-500',
  };

  const m = Math.min(1, Math.max(0, motionScale));
  const motionOn = m > 0.04;
  const dur = (base: number) => base / (0.2 + 0.8 * Math.max(m, 0.05));

  return (
    <div className="absolute group cursor-pointer z-20" style={{ top, left, transform: 'translate(-50%, -50%)' }} onClick={onClick}>
      <div className="relative flex items-center justify-center">
        <motion.div 
          className={`absolute w-10 h-10 rounded-full border-2 border-dashed ${borderClasses[color]} opacity-60`}
          animate={motionOn ? { rotate: 360, scale: [1, 1.14, 1], opacity: [0.28, 0.7, 0.28] } : { rotate: 0, scale: 1, opacity: 0.45 }}
          transition={motionOn ? { duration: dur(4.6), repeat: Infinity, ease: "linear" } : { duration: 0 }}
        />
        <motion.div
          className={`absolute w-6 h-6 rounded-full border ${borderClasses[color]} opacity-35`}
          animate={motionOn ? { scale: [0.9, 1.55, 1.55], opacity: [0, 0.45, 0] } : { scale: 1, opacity: 0.22 }}
          transition={motionOn ? { duration: dur(2.8), repeat: Infinity, ease: 'easeOut' } : { duration: 0 }}
        />
        <motion.div
          className={`w-3 h-3 rounded-full ${colorClasses[color]}`}
          animate={motionOn ? { scale: [1, 1.18, 1], opacity: [0.88, 1, 0.88] } : { scale: 1, opacity: 0.95 }}
          transition={motionOn ? { duration: dur(1.6), repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
        />
        <div className={`absolute w-1.5 h-1.5 rounded-full bg-white/80 ${color === 'blue' ? 'shadow-[0_0_10px_rgba(255,255,255,0.65)]' : color === 'green' ? 'shadow-[0_0_10px_rgba(255,255,255,0.6)]' : color === 'orange' ? 'shadow-[0_0_10px_rgba(255,255,255,0.58)]' : 'shadow-[0_0_10px_rgba(255,255,255,0.6)]'}`} />
         
        {/* Label Line & Text */}
        <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 flex items-center opacity-0 translate-x-[-6px] group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
          <div className={`w-14 h-[1px] ${color === 'blue' ? 'bg-cyber-blue' : color === 'green' ? 'bg-neon-green' : color === 'orange' ? 'bg-bio-orange' : 'bg-fuchsia-500'} shadow-[0_0_12px_currentColor]`} />
          <span className={`ml-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold bg-black/65 px-2.5 py-1 rounded-sm border ${borderClasses[color]} ${textClasses[color]} shadow-[0_0_18px_rgba(0,0,0,0.45)]`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

const WindowWrapper = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; position: string; hudMotionScale?: number } & React.ComponentProps<typeof motion.div>
>(({ children, position, hudMotionScale = 1, ...props }, ref) => {
  const m = Math.min(1, Math.max(0, hudMotionScale));
  const soft = m < 0.05;
  return (
    <motion.div
      ref={ref}
      initial={soft ? false : { opacity: 0, scale: 0.94, y: 8, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={soft ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 4, filter: 'blur(10px)' }}
      transition={
        soft
          ? { duration: 0.14, ease: 'easeOut' }
          : { type: 'spring', damping: 26 + (1 - m) * 14, stiffness: 200 + m * 120, mass: 0.9 }
      }
      className={`absolute z-30 ${position}`}
      {...props}
    >
      {children}
    </motion.div>
  );
});
WindowWrapper.displayName = 'WindowWrapper';

function NeuralAura() {
  const { audioData } = useNeuralRealtime();
  const { effectiveHudMotionScale } = useNeuralUi();
  const m = Math.min(1, Math.max(0, effectiveHudMotionScale));
  const spreadLo = 20 + (audioData[0] || 0) / 2;
  const spreadHi = 50 + (audioData[0] || 0);

  if (m < 0.05) {
    return (
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ boxShadow: `inset 0 0 ${spreadLo}px rgba(0,255,255,0.04)` }}
      />
    );
  }

  const amp = 0.04 + m * 0.06;
  return (
    <motion.div 
      className="absolute inset-0 pointer-events-none z-0"
      animate={{ 
        boxShadow: [
          `inset 0 0 ${spreadLo}px rgba(0,255,255,${amp * 0.9})`,
          `inset 0 0 ${spreadHi}px rgba(0,255,255,${amp * 1.8})`,
          `inset 0 0 ${spreadLo}px rgba(0,255,255,${amp * 0.9})`
        ]
      }}
      transition={{ duration: 0.1, ease: "linear" }}
    />
  );
}

function PanelLoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-cyber-blue/60 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <NeuralProvider>
      <AppContent />
    </NeuralProvider>
  );
}

function AppContent() {
  const { isSystemsReady, startSystems, lastTranscript, systemsWarning, systemsError } = useNeuralSystem();
  const { audioData, userPosition } = useNeuralRealtime();
  const { user, authLoading, authError, setAuthError } = useNeuralAuth();
  const { effectiveHudMotionScale, hudSettings } = useNeuralUi();
  const [missionHub, setMissionHub] = useState<MissionTab | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(true);
  const [activeWindows, setActiveWindows] = useState({
    tasks: false,
    sensors: false,
    terminal: false,
    radar: false,
    diagnostics: false,
  });

  // Voice Command Parsing
  useEffect(() => {
    if (!lastTranscript) return;
    const transcript = lastTranscript.toLowerCase();
    
    if (transcript.includes('open mission logs') || transcript.includes('show tasks')) {
      setActiveWindows(prev => ({ ...prev, tasks: true }));
    } else if (transcript.includes('close mission logs') || transcript.includes('hide tasks')) {
      setActiveWindows(prev => ({ ...prev, tasks: false }));
    } else if (transcript.includes('open sensors') || transcript.includes('show environmental')) {
      setActiveWindows(prev => ({ ...prev, sensors: true }));
    } else if (transcript.includes('close sensors') || transcript.includes('hide environmental')) {
      setActiveWindows(prev => ({ ...prev, sensors: false }));
    } else if (transcript.includes('open terminal') || transcript.includes('show terminal')) {
      setActiveWindows(prev => ({ ...prev, terminal: true }));
    } else if (transcript.includes('close terminal') || transcript.includes('hide terminal')) {
      setActiveWindows(prev => ({ ...prev, terminal: false }));
    } else if (transcript.includes('open radar') || transcript.includes('show optics')) {
      setActiveWindows(prev => ({ ...prev, radar: true }));
    } else if (transcript.includes('close radar') || transcript.includes('hide optics')) {
      setActiveWindows(prev => ({ ...prev, radar: false }));
    } else if (transcript.includes('close all windows')) {
      setActiveWindows({ tasks: false, sensors: false, terminal: false, radar: false, diagnostics: false });
      setMissionHub(null);
    }
  }, [lastTranscript]);

  const [terminalLines] = useState<string[]>([
    'N.E.O. system terminal (display-only).',
    'No interactive shell is attached to this web session.',
    'Use Mission Logs and chat for operational actions.',
  ]);

  const toggleWindow = (key: keyof typeof activeWindows) => {
    setActiveWindows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.neoHudMotion = String(Math.round(effectiveHudMotionScale * 1000) / 1000);
    root.dataset.neoHudCrt = String(hudSettings.shellCrtOverlay);
    root.style.setProperty('--neo-crt-opacity', String(hudSettings.crtOverlayOpacity));
  }, [effectiveHudMotionScale, hudSettings.shellCrtOverlay, hudSettings.crtOverlayOpacity]);

  const environmentalTelemetry = useMemo(() => {
    const motionMag = Math.hypot(userPosition.x, userPosition.y);
    const motionPct = Math.min(100, Math.round(motionMag * 100));

    let spectralAvg = 0;
    if (audioData.length > 0) {
      let sum = 0;
      for (let i = 0; i < audioData.length; i += 1) sum += audioData[i];
      spectralAvg = sum / audioData.length;
    }
    const spectralPct = Math.min(100, Math.round((spectralAvg / 255) * 100));

    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const online = nav?.onLine ?? true;
    const downlinkMbps =
      (nav as Navigator & { connection?: { downlink?: number } })?.connection?.downlink;

    const visibility =
      typeof document !== 'undefined' ? document.visibilityState : 'unknown';

    return {
      motionPct,
      spectralPct,
      online,
      downlinkMbps: typeof downlinkMbps === 'number' && Number.isFinite(downlinkMbps) ? downlinkMbps : null,
      visibility,
    };
  }, [audioData, userPosition.x, userPosition.y]);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleStartSystems = async () => {
    setIsConnecting(true);
    try {
      // Run sensor/mic init immediately in this user gesture so permissions stay reliable.
      // Avoid fake “boot” delays that feel like a second sign-in and keep the phone idle longer than needed.
      await startSystems();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      setAuthError(getClientSafeMessage(error, 'Google sign-in could not start. Try again.'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center font-sans overflow-hidden">
        <div className="text-cyber-blue font-mono animate-pulse">RESTORING SESSION...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <NerdLogin
        onLogin={handleLogin}
        isAuthenticating={isAuthenticating}
        authError={authError}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center font-sans overflow-hidden">
      {/* Portrait Container */}
      <div className="relative w-full max-w-[430px] h-[100dvh] max-h-[932px] bg-[#0a0a0a] overflow-hidden shadow-2xl shadow-cyber-blue/10 border border-gray-900">
        {/* Optional CRT-style overlay (decorative; intensity from Settings → neoHudSettings). */}
        <div
          className="neo-hud-crt-overlay absolute inset-0 pointer-events-none z-[5]"
          aria-hidden
        />
        
        {/* Background texture/gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Neural Aura Pulse */}
        <NeuralAura />
        {/* Local systems overlay (sensors not armed yet) */}
        {!isSystemsReady && (
          <div className="absolute inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center text-center overflow-hidden">
            {isConnecting ? (
              <div className="absolute inset-0 w-full h-full">
                <video 
                  src="/robot.mp4" 
                  autoPlay 
                  muted 
                  playsInline
                  loop
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center p-8">
                <Shield className="w-20 h-20 text-cyber-blue mb-6 drop-shadow-[0_0_15px_#00ffff]" />
                <h2 className="text-cyber-blue font-mono text-2xl font-bold mb-4 tracking-tighter uppercase drop-shadow-[0_0_10px_#00ffff]">
                  LOCAL SYSTEMS STANDBY
                </h2>
                <p className="text-gray-400 font-mono text-xs mb-8 leading-relaxed max-w-[280px]">
                  You are signed in. On-device camera, microphone, and motion tracking stay off until you arm them here. This is separate from authentication.
                </p>
                {systemsError && (
                  <div className="mb-5 max-w-[320px] rounded border border-red-500/45 bg-red-500/10 px-4 py-3 text-left shadow-[0_0_16px_rgba(239,68,68,0.12)]">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-red-300 mb-1">Local Sensor Fault</div>
                    <div className="text-[11px] font-mono text-red-100 leading-relaxed">{systemsError}</div>
                  </div>
                )}
                {systemsWarning && !systemsError && (
                  <div className="mb-5 max-w-[320px] rounded border border-cyber-blue/35 bg-cyber-blue/10 px-4 py-3 text-left shadow-[0_0_16px_rgba(0,255,255,0.1)]">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyber-blue mb-1">Limited Startup</div>
                    <div className="text-[11px] font-mono text-cyan-50 leading-relaxed">{systemsWarning}</div>
                  </div>
                )}
                <button 
                  onClick={handleStartSystems}
                  className="px-10 py-4 bg-cyber-blue/10 border border-cyber-blue text-cyber-blue font-mono font-bold tracking-widest rounded hover:bg-cyber-blue hover:text-black transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-cyber-blue/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <span className="relative z-10">ARM LOCAL SENSORS</span>
                </button>
              </div>
            )}
          </div>
        )}
        {/* Top Left: System Stats (Energy Module) */}
        <div className="absolute top-4 left-4 w-[240px] h-[90px] z-30">
          <SystemStats onOpenDiagnostics={() => toggleWindow('diagnostics')} />
        </div>

        {/* Top Right: NERD Logo & Power */}
        <div className="absolute top-6 right-4 z-30 flex flex-col items-end gap-2">
           <NerdLogo />
           <div className="flex items-center gap-2">
             {isSystemsReady && (
               <div className="flex items-center gap-1 bg-black/40 border border-cyber-blue/30 px-2 py-0.5 rounded text-[8px] font-mono text-cyber-blue uppercase tracking-widest animate-pulse">
                 <div className="w-1 h-1 bg-cyber-blue rounded-full" />
                 Local sensors live
               </div>
             )}
             <button 
               onClick={logout}
               className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-colors border border-transparent hover:border-red-500/30"
               title="Disconnect"
             >
               <Power className="w-4 h-4" />
             </button>
           </div>
        </div>

        {/* Left Side Panel */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 z-30">
           <SidePanelLeft activeWindows={activeWindows} onToggle={toggleWindow} />
           <button 
             onClick={() => toggleWindow('diagnostics')}
             className={`mt-4 w-10 h-10 rounded-full flex items-center justify-center border transition-all ${activeWindows.diagnostics ? 'bg-cyber-blue text-black border-cyber-blue' : 'bg-black/40 text-cyber-blue border-cyber-blue/30 hover:bg-cyber-blue/20'}`}
           >
             <Shield className="w-5 h-5" />
           </button>
        </div>

        {/* Right Side Panel */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 z-30">
           <SidePanelRight onToggleSettings={() => setMissionHub('settings')} />
        </div>

        {/* Center Robot */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-full h-[50%] z-20">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div></div>}>
            <Robot2D />
          </Suspense>
          
          {/* Hotspots - Overlay on top of the live robot frame */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto absolute inset-0">
              {/* Optics: Head/Eyes area */}
              <Hotspot top="25%" left="50%" label="Optics" color="magenta" motionScale={effectiveHudMotionScale} onClick={() => toggleWindow('radar')} />
              {/* Core: Chest area */}
              <Hotspot top="55%" left="50%" label="Core" color="green" motionScale={effectiveHudMotionScale} onClick={() => toggleWindow('sensors')} />
              {/* Arm: Hand area */}
              <Hotspot top="75%" left="25%" label="Arm" color="blue" motionScale={effectiveHudMotionScale} onClick={() => toggleWindow('tasks')} />
            </div>
          </div>
        </div>

        {/* Bottom Chat Interface — collapsed by default. Expanded chat is top-anchored below the
            robot band (robot ends ~60%) so fixed % heights no longer overlap hotspots/robot; dock
            stays above expanded chat (z-40); minimized pill stays above dock for reachability. */}
        <motion.div
          initial={false}
          animate={
            chatMinimized
              ? { top: 'auto', bottom: 132, height: 44 }
              : { top: '62%', bottom: 96, height: 'auto' }
          }
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className={`absolute left-0 right-0 overflow-hidden flex flex-col min-h-0 ${
            chatMinimized ? 'z-[45] pointer-events-none' : 'z-[35]'
          }`}
        >
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div></div>}>
            <ChatInterface
              minimized={chatMinimized}
              onToggleMinimized={() => setChatMinimized(prev => !prev)}
              onOpenSettings={() => {
                setChatMinimized(true);
                setMissionHub('settings');
              }}
              onOpenAssistantMission={() => {
                setChatMinimized(true);
                setMissionHub('assistant');
              }}
            />
          </Suspense>
        </motion.div>

        {/* Bottom Dock */}
        <div className="absolute bottom-4 left-0 right-0 z-40">
          <BottomDock
            onCommandCenterClick={() => setMissionHub('assistant')}
            onNetworkClick={() => setMissionHub('discovery')}
            onDiagnosticsClick={() => toggleWindow('diagnostics')}
            onSensorsClick={() => toggleWindow('sensors')}
            onTerminalClick={() => toggleWindow('terminal')}
            onSettingsClick={() => setMissionHub('settings')}
          />
        </div>

        {/* Floating Windows */}
        <AnimatePresence>
          {activeWindows.tasks && (
            <WindowWrapper key="tasks" hudMotionScale={effectiveHudMotionScale} position="top-1/4 left-1/2 -translate-x-1/2 w-[90%] h-[50%] z-50">
              <Panel title="Mission Logs" accentColor="orange" onClose={() => toggleWindow('tasks')} className="h-full">
                <Suspense fallback={<PanelLoadingFallback />}>
                  <TaskLog />
                </Suspense>
              </Panel>
            </WindowWrapper>
          )}

          {activeWindows.sensors && (
            <WindowWrapper key="sensors" hudMotionScale={effectiveHudMotionScale} position="top-1/4 left-1/2 -translate-x-1/2 w-[90%] z-50">
              <Panel title="Environmental" accentColor="blue" onClose={() => toggleWindow('sensors')}>
                <p className="text-[9px] font-mono text-gray-500 mb-3 leading-relaxed">
                  Live fields below come from the armed local pipeline (camera motion + mic spectrum). No outdoor weather or radiation hardware is connected.
                </p>
                <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                  <div className="bg-black/50 p-3 rounded border border-bio-orange/30 shadow-[0_0_10px_rgba(255,140,0,0.1)_inset]">
                    <div className="text-gray-500 text-[10px] mb-1">MOTION INDEX</div>
                    <div className="text-bio-orange font-bold text-lg">
                      {isSystemsReady ? `${environmentalTelemetry.motionPct}%` : '—'}
                    </div>
                  </div>
                  <div className="bg-black/50 p-3 rounded border border-cyber-blue/30 shadow-[0_0_10px_rgba(0,255,255,0.1)_inset]">
                    <div className="text-gray-500 text-[10px] mb-1">NETWORK</div>
                    <div className="text-cyber-blue font-bold text-lg leading-tight">
                      {environmentalTelemetry.online ? 'ONLINE' : 'OFFLINE'}
                      {environmentalTelemetry.downlinkMbps != null && (
                        <span className="block text-[10px] font-normal text-gray-400 mt-1">
                          Est. downlink {environmentalTelemetry.downlinkMbps.toFixed(1)} Mbps
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/50 p-3 rounded border border-neon-green/30 shadow-[0_0_10px_rgba(57,255,20,0.1)_inset]">
                    <div className="text-gray-500 text-[10px] mb-1">ACOUSTIC ACTIVITY</div>
                    <div className="text-neon-green font-bold text-lg">
                      {isSystemsReady ? `${environmentalTelemetry.spectralPct}%` : '—'}
                    </div>
                  </div>
                  <div className="bg-black/50 p-3 rounded border border-fuchsia-500/30 shadow-[0_0_10px_rgba(255,0,255,0.1)_inset]">
                    <div className="text-gray-500 text-[10px] mb-1">PAGE VISIBILITY</div>
                    <div className="text-fuchsia-500 font-bold text-lg uppercase">{environmentalTelemetry.visibility}</div>
                  </div>
                </div>
              </Panel>
            </WindowWrapper>
          )}

          {activeWindows.terminal && (
            <WindowWrapper key="terminal" hudMotionScale={effectiveHudMotionScale} position="top-1/3 left-1/2 -translate-x-1/2 w-[90%] z-50">
              <Panel title="System Terminal" accentColor="green" onClose={() => toggleWindow('terminal')}>
                <div className="bg-black/80 p-3 rounded border border-neon-green/30 font-mono text-[10px] text-neon-green h-48 overflow-y-auto custom-scrollbar shadow-[0_0_15px_rgba(57,255,20,0.1)_inset]">
                  {terminalLines.map((line, i) => (
                    <div key={i} className="mb-1 opacity-80 hover:opacity-100">{line}</div>
                  ))}
                  <div className="animate-pulse mt-2">_</div>
                </div>
              </Panel>
            </WindowWrapper>
          )}

          {activeWindows.radar && (
            <WindowWrapper key="radar" hudMotionScale={effectiveHudMotionScale} position="top-1/4 left-1/2 -translate-x-1/2 w-[90%] aspect-square z-50">
              <Panel title="Local Radar" accentColor="magenta" onClose={() => toggleWindow('radar')} className="h-full">
                <div className="w-full h-full relative flex items-center justify-center bg-black/50 rounded-full border border-fuchsia-500/30 overflow-hidden shadow-[0_0_20px_rgba(255,0,255,0.1)_inset]">
                  {/* Radar Grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_20%,rgba(255,0,255,0.1)_20%,transparent_21%,transparent_40%,rgba(255,0,255,0.1)_40%,transparent_41%,transparent_60%,rgba(255,0,255,0.1)_60%,transparent_61%,transparent_80%,rgba(255,0,255,0.1)_80%,transparent_81%)]" />
                  <div className="absolute w-full h-[1px] bg-fuchsia-500/20" />
                  <div className="absolute h-full w-[1px] bg-fuchsia-500/20" />
                  {/* Sweep */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 w-1/2 h-1/2 origin-top-left bg-gradient-to-br from-fuchsia-500/40 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Blips */}
                  <motion.div className="absolute top-[30%] left-[60%] w-2 h-2 bg-fuchsia-500 rounded-full shadow-[0_0_5px_#ff00ff]" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} />
                  <motion.div className="absolute top-[70%] left-[40%] w-1.5 h-1.5 bg-fuchsia-500 rounded-full shadow-[0_0_5px_#ff00ff]" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 2.5 }} />
                </div>
              </Panel>
            </WindowWrapper>
          )}

          {activeWindows.diagnostics && (
            <WindowWrapper key="diagnostics" hudMotionScale={effectiveHudMotionScale} position="top-[15%] left-1/2 -translate-x-1/2 w-[90%] h-[70%] z-50">
              <Panel title="System Diagnostics" accentColor="blue" onClose={() => toggleWindow('diagnostics')} className="h-full">
                <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <DiagnosticItem 
                    label="Local sensor bus" 
                    status={isSystemsReady ? 'online' : 'offline'} 
                    details="On-device camera, microphone, and motion pipeline (armed after sign-in, not part of it)."
                  />
                  <DiagnosticItem 
                    label="Optics / Vision" 
                    status={isSystemsReady ? 'online' : 'offline'} 
                    details="Camera-backed motion tracking for the HUD."
                  />
                  <DiagnosticItem 
                    label="Audio Uplink" 
                    status={isSystemsReady ? 'online' : 'offline'} 
                    details="Mic spectrum analysis and optional voice commands."
                  />
                  <DiagnosticItem 
                    label="Gemini Core" 
                    status="warning" 
                    details="Model runs on the server when you use chat or protected AI routes — not a continuously attached local core."
                  />
                  <DiagnosticItem 
                    label="Network Status" 
                    status={typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'} 
                    details={typeof navigator !== 'undefined' && navigator.onLine ? 'Browser reports an active network path.' : 'Browser reports offline — cloud sync and AI calls will fail until connectivity returns.'}
                  />
                  <DiagnosticItem 
                    label="Supabase Sync" 
                    status={user ? 'online' : 'offline'} 
                    details="Secure cloud persistence and account session."
                  />
                  <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      {isSystemsReady && user ? 'Core paths ready' : 'Review items above'}
                    </div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono font-bold rounded hover:bg-red-500 hover:text-white transition-all"
                    >
                      FORCE REBOOT
                    </button>
                  </div>
                </div>
              </Panel>
            </WindowWrapper>
          )}

        </AnimatePresence>

        <AnimatePresence>
          {missionHub !== null && (
            <Suspense
              fallback={
                <div className="absolute inset-0 z-[115] flex items-center justify-center bg-black/80">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                </div>
              }
            >
              <MissionShell
                initialTab={missionHub}
                onClose={() => setMissionHub(null)}
                onExpandChat={() => setChatMinimized(false)}
                onOpenMissionLogs={() => setActiveWindows((prev) => ({ ...prev, tasks: true }))}
                onOpenDiagnostics={() => setActiveWindows((prev) => ({ ...prev, diagnostics: true }))}
                onOpenSensors={() => setActiveWindows((prev) => ({ ...prev, sensors: true }))}
                onOpenTerminal={() => setActiveWindows((prev) => ({ ...prev, terminal: true }))}
              />
            </Suspense>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
