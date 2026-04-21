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
  const [systemsWarning, setSystemsWarning] = useState<string | null>(null);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioBufferRef = useRef<Uint8Array | null>(null);
  const lastAudioSampleRef = useRef(0);
  const lastMotionSampleRef = useRef(0);

  const { isListening, lastTranscript, initSpeechRecognition, toggleListening, cleanupSpeechRecognition } = useSpeechRecognition();
  const { initMediaStream, cleanupMediaStream, analyzerRef, videoRef, audioContextRef } = useMediaStream();
  const { userPosition, initMotionDetection, processMotion } = useMotionDetection();

  const update = useCallback((timestamp: number) => {
    if (analyzerRef.current && audioContextRef.current?.state === 'running' && timestamp - lastAudioSampleRef.current >= 80) {
      const analyzer = analyzerRef.current;
      let dataArray = audioBufferRef.current;
      if (!dataArray || dataArray.length !== analyzer.frequencyBinCount) {
        dataArray = new Uint8Array(analyzer.frequencyBinCount);
        audioBufferRef.current = dataArray;
      }

      analyzer.getByteFrequencyData(dataArray);
      lastAudioSampleRef.current = timestamp;

      setAudioData(prev => {
        if (prev.length === dataArray.length) {
          let delta = 0;
          for (let i = 0; i < dataArray.length; i += 4) {
            delta += Math.abs(prev[i] - dataArray[i]);
          }
          if (delta < 24) {
            return prev;
          }
        }
        return new Uint8Array(dataArray);
      });
    }

    if (videoRef.current && timestamp - lastMotionSampleRef.current >= 66) {
      processMotion(videoRef.current);
      lastMotionSampleRef.current = timestamp;
    }

    animationFrameRef.current = requestAnimationFrame(update);
  }, [analyzerRef, audioContextRef, processMotion, videoRef]);

  const startSystems = useCallback(async () => {
    devLog("Initializing Neural Systems...");
    setSystemsWarning(null);
    setSystemsError(null);
    try {
      initSpeechRecognition();
      const mediaState = await initMediaStream();
      initMotionDetection();

      if (!mediaState.audioEnabled) {
        setSystemsWarning('Microphone capture is unavailable on this device session. Vision sensors are live.');
      }

      setIsSystemsReady(true);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(update);
      devLog("Neural systems online.");
    } catch (err) {
      devError("Failed to initialize neural systems:", err);
      setIsSystemsReady(false);
      setSystemsError(err instanceof Error ? err.message : 'Local sensor startup failed.');
    }
  }, [initSpeechRecognition, initMediaStream, initMotionDetection, update]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      cleanupSpeechRecognition();
      cleanupMediaStream();
    };
  }, [cleanupSpeechRecognition, cleanupMediaStream]);

  return { audioData, userPosition, isSystemsReady, isListening, lastTranscript, systemsWarning, systemsError, startSystems, toggleListening };
}
