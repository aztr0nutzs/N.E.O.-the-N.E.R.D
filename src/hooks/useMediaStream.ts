import { useRef, useCallback } from 'react';

const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

export function useMediaStream() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const initMediaStream = useCallback(async () => {
    const preferredVideoConstraints = {
      width: { ideal: 160 },
      height: { ideal: 120 },
      frameRate: { ideal: 15 }
    };

    let stream: MediaStream;
    let audioEnabled = true;

    try {
      stream = await requestUserMediaWithTimeout({
        audio: true,
        video: preferredVideoConstraints
      });
      devLog("Media stream acquired with audio and video.");
    } catch (error) {
      devLog("Audio+video capture unavailable, retrying with video only.", error);
      stream = await requestUserMediaWithTimeout({
        audio: false,
        video: preferredVideoConstraints
      });
      audioEnabled = false;
      devLog("Media stream acquired with video only.");
    }

    analyzerRef.current = null;
    if (audioContextRef.current) {
      await audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (audioEnabled) {
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
    }

    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.srcObject = stream;

    await Promise.race([
      new Promise((resolve, reject) => {
        if (video.readyState >= 2) {
          video.play().then(resolve).catch(reject);
        } else {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(reject);
          };
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Video initialization timeout")), 5000))
    ]);

    videoRef.current = video;
    devLog("Video stream active.");

    return {
      analyzer: analyzerRef.current,
      video: videoRef.current,
      audioContext: audioContextRef.current,
      audioEnabled
    };
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

async function requestUserMediaWithTimeout(constraints: MediaStreamConstraints, timeoutMs = 4000) {
  return await Promise.race([
    navigator.mediaDevices.getUserMedia(constraints),
    new Promise<MediaStream>((_, reject) => {
      window.setTimeout(() => reject(new Error('Media permission request timed out.')), timeoutMs);
    })
  ]);
}
