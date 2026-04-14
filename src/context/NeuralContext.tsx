import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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

const NeuralContext = createContext<NeuralContextType | undefined>(undefined);

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

  const updateAISettings = (newSettings: Partial<AISettings>) => {
    setAiSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('aiSettings', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <NeuralContext.Provider value={{ ...systems, user, authLoading, neuralSurge, setNeuralSurge, currentModel, setCurrentModel, aiSettings, updateAISettings }}>
      {children}
    </NeuralContext.Provider>
  );
}

export function useNeural() {
  const context = useContext(NeuralContext);
  if (context === undefined) {
    throw new Error('useNeural must be used within a NeuralProvider');
  }
  return context;
}
