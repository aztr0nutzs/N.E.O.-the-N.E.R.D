import { useRef, useCallback } from 'react';

const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

export function useMediaStream() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const initMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: { 
        width: { ideal: 160 }, 
        height: { ideal: 120 },
        frameRate: { ideal: 15 } 
      } 
    });
    devLog("Media stream acquired.");

    // Audio Setup
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyzerRef.current = audioContextRef.current.createAnalyser();
    analyzerRef.current.fftSize = 256;
    source.connect(analyzerRef.current);
    devLog("Audio analyzer connected.");

    // Vision Setup
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.srcObject = stream;
    
    // Wait for video to be ready with a timeout
    await Promise.race([
      new Promise((resolve) => {
        if (video.readyState >= 2) {
          video.play().then(resolve);
        } else {
          video.onloadedmetadata = () => {
            video.play().then(resolve);
          };
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Video initialization timeout")), 5000))
    ]);
    
    videoRef.current = video;
    devLog("Video stream active.");

    return { analyzer: analyzerRef.current, video: videoRef.current, audioContext: audioContextRef.current };
  }, []);

  const cleanupMediaStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
    }
  }, []);

  return { initMediaStream, cleanupMediaStream, analyzerRef, videoRef, audioContextRef };
}
