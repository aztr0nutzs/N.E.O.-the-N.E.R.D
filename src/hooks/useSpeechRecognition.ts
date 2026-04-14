import { useState, useRef, useEffect, useCallback } from 'react';

const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error(...args);
};

const devWarn = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.warn(...args);
};

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const initSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      devWarn('Speech recognition unavailable in this environment.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      setLastTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      devError('Speech recognition error:', event.error);
      isListeningRef.current = false;
      if (isMountedRef.current) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch (error) {
          devWarn('Speech recognition restart failed:', error);
        }
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListeningRef.current) {
      isListeningRef.current = false;
      recognition.stop();
      setIsListening(false);
      return;
    }

    try {
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (error) {
      isListeningRef.current = false;
      setIsListening(false);
      devWarn('Speech recognition start failed:', error);
    }
  }, []);

  const cleanupSpeechRecognition = useCallback((resetState = true) => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch (error) {
        devWarn('Speech recognition stop failed during cleanup:', error);
      }
      recognitionRef.current = null;
    }

    isListeningRef.current = false;
    if (resetState && isMountedRef.current) {
      setIsListening(false);
    }
  }, []);

  return { isListening, lastTranscript, initSpeechRecognition, toggleListening, cleanupSpeechRecognition };
}
