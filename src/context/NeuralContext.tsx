import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { useNeuralSystems } from '../hooks/useNeuralSystems';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

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

type NeuralAuthContextType = Pick<NeuralContextType, 'user' | 'authLoading'>;
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const authValue = useMemo(() => ({
    user,
    authLoading
  }), [user, authLoading]);

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
