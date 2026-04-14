import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useMediaStream } from './useMediaStream';
import { useMotionDetection } from './useMotionDetection';

const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error(...args);
};

export function useNeuralSystems() {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  const [isSystemsReady, setIsSystemsReady] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const isSystemsReadyRef = useRef(false);

  const { isListening, lastTranscript, initSpeechRecognition, toggleListening, cleanupSpeechRecognition } = useSpeechRecognition();
  const { initMediaStream, cleanupMediaStream, analyzerRef, videoRef, audioContextRef } = useMediaStream();
  const { userPosition, initMotionDetection, cleanupMotionDetection, processMotion } = useMotionDetection();

  const stopAnimationLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const cleanupSystems = useCallback((resetState: boolean) => {
    stopAnimationLoop();
    cleanupSpeechRecognition(resetState);
    cleanupMediaStream();
    cleanupMotionDetection(resetState);
    startPromiseRef.current = null;
    isSystemsReadyRef.current = false;

    if (resetState && isMountedRef.current) {
      setAudioData(new Uint8Array(0));
      setIsSystemsReady(false);
    }
  }, [cleanupMediaStream, cleanupMotionDetection, cleanupSpeechRecognition, stopAnimationLoop]);

  const update = useCallback(() => {
    if (analyzerRef.current && audioContextRef.current?.state === 'running') {
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
      analyzerRef.current.getByteFrequencyData(dataArray);
      setAudioData(dataArray);
    }

    if (videoRef.current) {
      processMotion(videoRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(update);
  }, [analyzerRef, audioContextRef, processMotion, videoRef]);

  const startSystems = useCallback(async () => {
    if (isSystemsReadyRef.current) return;
    if (startPromiseRef.current) return startPromiseRef.current;

    const startPromise = (async () => {
      devLog('Initializing neural systems...');

      try {
        initSpeechRecognition();
        await initMediaStream();
        initMotionDetection();

        stopAnimationLoop();
        animationFrameRef.current = requestAnimationFrame(update);
        isSystemsReadyRef.current = true;

        if (isMountedRef.current) {
          setIsSystemsReady(true);
        }

        devLog('Neural systems online.');
      } catch (error) {
        devError('Failed to initialize neural systems:', error);
        cleanupSystems(true);
        throw error;
      } finally {
        startPromiseRef.current = null;
      }
    })();

    startPromiseRef.current = startPromise;
    return startPromise;
  }, [cleanupSystems, initMediaStream, initMotionDetection, initSpeechRecognition, stopAnimationLoop, update]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanupSystems(false);
    };
  }, [cleanupSystems]);

  return { audioData, userPosition, isSystemsReady, isListening, lastTranscript, startSystems, toggleListening };
}
