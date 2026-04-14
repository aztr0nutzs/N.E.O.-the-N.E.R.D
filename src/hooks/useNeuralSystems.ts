import { useState, useEffect, useRef } from 'react';
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

  const { isListening, lastTranscript, initSpeechRecognition, toggleListening, cleanupSpeechRecognition } = useSpeechRecognition();
  const { initMediaStream, cleanupMediaStream, analyzerRef, videoRef, audioContextRef } = useMediaStream();
  const { userPosition, initMotionDetection, processMotion } = useMotionDetection();

  const startSystems = async () => {
    devLog("Initializing Neural Systems...");
    try {
      initSpeechRecognition();
      await initMediaStream();
      initMotionDetection();

      setIsSystemsReady(true);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(update);
      devLog("Neural systems online.");
    } catch (err) {
      devError("Failed to initialize neural systems:", err);
      setIsSystemsReady(false);
    }
  };

  const update = () => {
    // Update Audio
    if (analyzerRef.current && audioContextRef.current?.state === 'running') {
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
      analyzerRef.current.getByteFrequencyData(dataArray);
      setAudioData(dataArray);
    }

    // Update Vision (Motion tracking)
    if (videoRef.current) {
      processMotion(videoRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      cleanupSpeechRecognition();
      cleanupMediaStream();
    };
  }, [cleanupSpeechRecognition, cleanupMediaStream]);

  return { audioData, userPosition, isSystemsReady, isListening, lastTranscript, startSystems, toggleListening };
}
