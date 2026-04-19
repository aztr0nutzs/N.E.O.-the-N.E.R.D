import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useNeuralSystems } from '../hooks/useNeuralSystems';
import { getClientSafeMessage, initializeMobileAuth } from '../authClient';
import { supabase } from '../lib/supabase';

export type Persona = 'NEO' | 'FRIDAY' | 'EDITH' | 'ULTRON';

export interface AISettings {
  temperature: number;
  topP: number;
  topK: number;
  customInstructions: string;
  defaultVoice: string;
  personaVoices: Record<Persona, string>;
}

/** Local-only HUD / motion preferences (this device). Not synced to Supabase. */
export interface HudSettings {
  /** 0 = calm shell motion, 1 = full intensity (hotspots, modals, aura pulse). */
  motionIntensity: number;
  /** Optional full-frame CRT-style overlay (decorative; not camera output). */
  shellCrtOverlay: number;
  /** Opacity of the CRT overlay when enabled (0.12–0.55). */
  crtOverlayOpacity: number;
  /** When true, OS “reduce motion” forces shell motion to minimum. */
  respectOsReducedMotion: boolean;
  /** When true, Gemini-named voices use a short protected `/api/ai/chat` TTS preview when signed in. */
  geminiVoicePreviewUsesApi: boolean;
}

const defaultHudSettings: HudSettings = {
  motionIntensity: 1,
  shellCrtOverlay: 0,
  crtOverlayOpacity: 0.28,
  respectOsReducedMotion: true,
  geminiVoicePreviewUsesApi: true,
};

const defaultAISettings: AISettings = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  customInstructions: '',
  defaultVoice: 'Charon',
  personaVoices: {
    NEO: 'Charon',
    FRIDAY: 'Kore',
    EDITH: 'Zephyr',
    ULTRON: 'Fenrir'
  }
};

interface NeuralContextType {
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  setAuthError: (message: string | null) => void;
  audioData: Uint8Array;
  userPosition: { x: number; y: number };
  isSystemsReady: boolean;
  isListening: boolean;
  lastTranscript: string;
  systemsWarning: string | null;
  systemsError: string | null;
  neuralSurge: boolean;
  setNeuralSurge: (active: boolean) => void;
  startSystems: () => Promise<void>;
  toggleListening: () => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  aiSettings: AISettings;
  updateAISettings: (settings: Partial<AISettings>) => void;
  hudSettings: HudSettings;
  updateHudSettings: (settings: Partial<HudSettings>) => void;
  /** Combined scale (0–1) after OS reduced-motion policy. */
  effectiveHudMotionScale: number;
}

type NeuralAuthContextType = Pick<NeuralContextType, 'user' | 'authLoading' | 'authError' | 'setAuthError'>;
type NeuralSystemsContextType = Pick<NeuralContextType, 'isSystemsReady' | 'isListening' | 'lastTranscript' | 'systemsWarning' | 'systemsError' | 'startSystems' | 'toggleListening'>;
type NeuralRealtimeContextType = Pick<NeuralContextType, 'audioData' | 'userPosition'>;
type NeuralUiContextType = Pick<
  NeuralContextType,
  | 'neuralSurge'
  | 'setNeuralSurge'
  | 'currentModel'
  | 'setCurrentModel'
  | 'aiSettings'
  | 'updateAISettings'
  | 'hudSettings'
  | 'updateHudSettings'
  | 'effectiveHudMotionScale'
>;

const NeuralAuthContext = createContext<NeuralAuthContextType | undefined>(undefined);
const NeuralSystemsContext = createContext<NeuralSystemsContextType | undefined>(undefined);
const NeuralRealtimeContext = createContext<NeuralRealtimeContextType | undefined>(undefined);
const NeuralUiContext = createContext<NeuralUiContextType | undefined>(undefined);

export function NeuralProvider({ children }: { children: ReactNode }) {
  const systems = useNeuralSystems();
  const [neuralSurge, setNeuralSurge] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState('gemini-3-flash-preview');
  
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('aiSettings');
    return saved ? { ...defaultAISettings, ...JSON.parse(saved) } : defaultAISettings;
  });

  const [hudSettings, setHudSettings] = useState<HudSettings>(() => {
    try {
      const saved = localStorage.getItem('neoHudSettings');
      if (!saved) return defaultHudSettings;
      const parsed = JSON.parse(saved) as Partial<HudSettings>;
      return { ...defaultHudSettings, ...parsed };
    } catch {
      return defaultHudSettings;
    }
  });

  const [osPrefersReducedMotion, setOsPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setOsPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveHudMotionScale = useMemo(() => {
    const base = Math.min(1, Math.max(0, hudSettings.motionIntensity));
    if (hudSettings.respectOsReducedMotion && osPrefersReducedMotion) {
      return 0;
    }
    return base;
  }, [hudSettings.motionIntensity, hudSettings.respectOsReducedMotion, osPrefersReducedMotion]);

  const updateAISettings = useCallback((newSettings: Partial<AISettings>) => {
    setAiSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('aiSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateHudSettings = useCallback((newSettings: Partial<HudSettings>) => {
    setHudSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('neoHudSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    let removeMobileAuthListener: (() => void) | undefined;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        setAuthError(null);
      }
      setAuthLoading(false);
    });

    void (async () => {
      try {
        removeMobileAuthListener = await initializeMobileAuth((message) => {
          if (!isMounted) return;
          setAuthError(message);
        });

        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          if (import.meta.env.DEV) {
            console.error('Auth session bootstrap failed:', error);
          }
          setUser(null);
          setAuthError(getClientSafeMessage(error, 'Sign-in session could not be restored.'));
        } else {
          setUser(data.session?.user ?? null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      removeMobileAuthListener?.();
      subscription.unsubscribe();
    };
  }, []);

  const authValue = useMemo(() => ({
    user,
    authLoading,
    authError,
    setAuthError
  }), [user, authLoading, authError]);

  const systemsValue = useMemo(() => ({
    isSystemsReady: systems.isSystemsReady,
    isListening: systems.isListening,
    lastTranscript: systems.lastTranscript,
    systemsWarning: systems.systemsWarning,
    systemsError: systems.systemsError,
    startSystems: systems.startSystems,
    toggleListening: systems.toggleListening
  }), [
    systems.isListening,
    systems.isSystemsReady,
    systems.lastTranscript,
    systems.systemsError,
    systems.systemsWarning,
    systems.startSystems,
    systems.toggleListening
  ]);

  const realtimeValue = useMemo(() => ({
    audioData: systems.audioData,
    userPosition: systems.userPosition
  }), [systems.audioData, systems.userPosition]);

  const uiValue = useMemo(() => ({
    neuralSurge,
    setNeuralSurge,
    currentModel,
    setCurrentModel,
    aiSettings,
    updateAISettings,
    hudSettings,
    updateHudSettings,
    effectiveHudMotionScale
  }), [neuralSurge, currentModel, aiSettings, updateAISettings, hudSettings, updateHudSettings, effectiveHudMotionScale]);

  return (
    <NeuralAuthContext.Provider value={authValue}>
      <NeuralSystemsContext.Provider value={systemsValue}>
        <NeuralRealtimeContext.Provider value={realtimeValue}>
          <NeuralUiContext.Provider value={uiValue}>
            {children}
          </NeuralUiContext.Provider>
        </NeuralRealtimeContext.Provider>
      </NeuralSystemsContext.Provider>
    </NeuralAuthContext.Provider>
  );
}

function useRequiredContext<T>(context: React.Context<T | undefined>, name: string) {
  const value = useContext(context);
  if (value === undefined) {
    throw new Error(`${name} must be used within a NeuralProvider`);
  }
  return value;
}

export function useNeuralAuth() {
  return useRequiredContext(NeuralAuthContext, 'useNeuralAuth');
}

export function useNeuralSystem() {
  return useRequiredContext(NeuralSystemsContext, 'useNeuralSystem');
}

export function useNeuralRealtime() {
  return useRequiredContext(NeuralRealtimeContext, 'useNeuralRealtime');
}

export function useNeuralUi() {
  return useRequiredContext(NeuralUiContext, 'useNeuralUi');
}

export function useNeural() {
  const authState = useNeuralAuth();
  const systemsState = useNeuralSystem();
  const realtimeState = useNeuralRealtime();
  const uiState = useNeuralUi();
  return {
    ...authState,
    ...systemsState,
    ...realtimeState,
    ...uiState
  };
}
