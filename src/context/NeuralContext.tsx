import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNeuralSystems } from '../hooks/useNeuralSystems';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

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
}

const NeuralContext = createContext<NeuralContextType | undefined>(undefined);

export function NeuralProvider({ children }: { children: ReactNode }) {
  const systems = useNeuralSystems();
  const [neuralSurge, setNeuralSurge] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentModel, setCurrentModel] = useState('gemini-3-flash-preview');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <NeuralContext.Provider value={{ ...systems, user, authLoading, neuralSurge, setNeuralSurge, currentModel, setCurrentModel }}>
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
