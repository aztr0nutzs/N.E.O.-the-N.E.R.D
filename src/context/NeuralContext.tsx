import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useNeuralSystems } from '../hooks/useNeuralSystems';
import { getClientSafeMessage, initializeMobileAuth } from '../firebase';
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
  neuralSurge: boolean;
  setNeuralSurge: (active: boolean) => void;
  startSystems: () => Promise<void>;
  toggleListening: () => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  aiSettings: AISettings;
  updateAISettings: (settings: Partial<AISettings>) => void;
}

type NeuralAuthContextType = Pick<NeuralContextType, 'user' | 'authLoading' | 'authError' | 'setAuthError'>;
type NeuralSystemsContextType = Pick<NeuralContextType, 'isSystemsReady' | 'isListening' | 'lastTranscript' | 'startSystems' | 'toggleListening'>;
type NeuralRealtimeContextType = Pick<NeuralContextType, 'audioData' | 'userPosition'>;
type NeuralUiContextType = Pick<NeuralContextType, 'neuralSurge' | 'setNeuralSurge' | 'currentModel' | 'setCurrentModel' | 'aiSettings' | 'updateAISettings'>;

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

  const updateAISettings = useCallback((newSettings: Partial<AISettings>) => {
    setAiSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('aiSettings', JSON.stringify(updated));
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
    startSystems: systems.startSystems,
    toggleListening: systems.toggleListening
  }), [
    systems.isListening,
    systems.isSystemsReady,
    systems.lastTranscript,
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
    updateAISettings
  }), [neuralSurge, currentModel, aiSettings, updateAISettings]);

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
