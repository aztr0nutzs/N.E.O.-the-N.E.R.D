import { useState, useRef, useCallback } from 'react';

export function useMotionDetection() {
  const [userPosition, setUserPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

  const initMotionDetection = useCallback(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 60;
      canvasRef.current = canvas;
    }

    prevFrameRef.current = null;
    return canvasRef.current;
  }, []);

  const cleanupMotionDetection = useCallback((resetPosition = true) => {
    canvasRef.current = null;
    prevFrameRef.current = null;
    if (resetPosition) {
      setUserPosition({ x: 0, y: 0 });
    }
  }, []);

  const processMotion = useCallback((video: HTMLVideoElement) => {
    if (!canvasRef.current || video.readyState < 2) return;

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const data = imageData.data;

    if (prevFrameRef.current) {
      let totalX = 0;
      let totalY = 0;
      let count = 0;

      // Process every 2nd pixel for performance while maintaining accuracy
      for (let i = 0; i < data.length; i += 8) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const prevAvg = (prevFrameRef.current[i] + prevFrameRef.current[i + 1] + prevFrameRef.current[i + 2]) / 3;

        // Motion threshold - tuned for typical room lighting
        if (Math.abs(avg - prevAvg) > 25) {
          const pixelIndex = i / 4;
          totalX += pixelIndex % canvasRef.current.width;
          totalY += Math.floor(pixelIndex / canvasRef.current.width);
          count++;
        }
      }

      if (count > 15) {
        const centerX = (totalX / count) / canvasRef.current.width;
        const centerY = (totalY / count) / canvasRef.current.height;

        // Map to -1 to 1 range
        // Invert X for mirrored webcam
        const targetX = (0.5 - centerX) * 2;
        const targetY = (centerY - 0.5) * 2;

        setUserPosition(prev => ({
          x: prev.x + (targetX - prev.x) * 0.12,
          y: prev.y + (targetY - prev.y) * 0.12
        }));
      } else {
        // Return to center
        setUserPosition(prev => ({
          x: prev.x * 0.96,
          y: prev.y * 0.96
        }));
      }
    }

    if (!prevFrameRef.current || prevFrameRef.current.length !== data.length) {
      prevFrameRef.current = new Uint8ClampedArray(data);
    } else {
      prevFrameRef.current.set(data);
    }
  }, []);

  return { userPosition, initMotionDetection, cleanupMotionDetection, processMotion };
}
