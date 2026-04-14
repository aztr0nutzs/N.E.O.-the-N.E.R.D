import { useRef, useCallback } from 'react';

const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error(...args);
};

const devWarn = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.warn(...args);
};

type MediaInitResult = {
  analyzer: AnalyserNode | null;
  video: HTMLVideoElement | null;
  audioContext: AudioContext | null;
};

export function useMediaStream() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initPromiseRef = useRef<Promise<MediaInitResult> | null>(null);
  const initGenerationRef = useRef(0);

  const cleanupMediaStream = useCallback(() => {
    initGenerationRef.current += 1;
    initPromiseRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.onloadedmetadata = null;
      video.srcObject = null;
      videoRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    analyzerRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch((error) => {
        devWarn('Audio context close failed during cleanup:', error);
      });
    }
  }, []);

  const initMediaStream = useCallback(async () => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    if (streamRef.current && videoRef.current && analyzerRef.current && audioContextRef.current) {
      return {
        analyzer: analyzerRef.current,
        video: videoRef.current,
        audioContext: audioContextRef.current
      };
    }

    const generation = initGenerationRef.current;
    const initPromise = (async (): Promise<MediaInitResult> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 160 },
            height: { ideal: 120 },
            frameRate: { ideal: 15 }
          }
        });

        if (generation !== initGenerationRef.current) {
          stream.getTracks().forEach(track => track.stop());
          throw new Error('Media stream initialization cancelled');
        }

        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        if (generation !== initGenerationRef.current) {
          cleanupMediaStream();
          throw new Error('Media stream initialization cancelled');
        }

        const source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);
        analyzerRef.current = analyzer;

        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.muted = true;
        video.srcObject = stream;

        await Promise.race([
          new Promise<void>((resolve, reject) => {
            if (video.readyState >= 2) {
              video.play().then(() => resolve()).catch(reject);
            } else {
              video.onloadedmetadata = () => {
                video.play().then(() => resolve()).catch(reject);
              };
            }
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Video initialization timeout')), 5000))
        ]);

        if (generation !== initGenerationRef.current) {
          cleanupMediaStream();
          throw new Error('Media stream initialization cancelled');
        }

        video.onloadedmetadata = null;
        videoRef.current = video;

        return { analyzer, video, audioContext };
      } catch (error) {
        if ((error as Error).message !== 'Media stream initialization cancelled') {
          devError('Failed to initialize media stream:', error);
        }
        cleanupMediaStream();
        throw error;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    initPromiseRef.current = initPromise;
    return initPromise;
  }, [cleanupMediaStream]);

  return { initMediaStream, cleanupMediaStream, analyzerRef, videoRef, audioContextRef };
}
