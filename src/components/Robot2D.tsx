import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useNeural } from '../context/NeuralContext';

export function Robot2D() {
  const { userPosition, audioData, neuralSurge } = useNeural();

  // Calculate audio intensity for reactive elements
  const { audioIntensity, audioAverage } = useMemo(() => {
    if (!audioData || !audioData.length) return { audioIntensity: 0, audioAverage: 0 };
    let sum = 0;
    let max = 0;
    for (let i = 0; i < audioData.length; i++) {
      const val = audioData[i] / 255;
      sum += val;
      if (val > max) max = val;
    }
    const avg = sum / audioData.length;
    // Non-linear boost to make subtle changes more apparent
    const intensity = Math.pow(max, 0.6);
    return { audioIntensity: intensity, audioAverage: avg };
  }, [audioData]);

  // Base hover + audio-driven vertical boost
  const audioBoostY = audioIntensity * -20; // Rises up slightly when speaking (negative Y is up)
  const targetScale = 1 + (audioIntensity * 0.05) + (audioAverage * 0.03);

  // Rotation based on user tracking
  const targetRotX = userPosition.y * 15;
  const targetRotY = userPosition.x * 25;

  return (
    <div className="w-full h-full min-h-[400px] relative flex items-center justify-center pointer-events-none">
      <motion.div
        className="relative w-64 h-64 flex items-center justify-center"
        animate={{
          y: [0, -10, 0],
          rotateX: targetRotX,
          rotateY: targetRotY,
          scale: targetScale,
        }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotateX: { type: "spring", stiffness: 100, damping: 20 },
          rotateY: { type: "spring", stiffness: 100, damping: 20 },
          scale: { type: "spring", stiffness: 200, damping: 20 },
        }}
        style={{ perspective: 1000 }}
      >
        <motion.img
          src="/robot.png"
          alt="N.E.O. Robot"
          className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]"
          animate={{
            y: audioBoostY,
            filter: `drop-shadow(0 0 ${15 + audioIntensity * 30}px rgba(0,255,255,${0.5 + audioAverage}))`
          }}
          transition={{
            y: { type: "spring", stiffness: 300, damping: 20 },
            filter: { duration: 0.1 }
          }}
        />
        
        {/* Emissive Core Glow */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-cyber-blue blur-xl mix-blend-screen"
          animate={{
            opacity: (neuralSurge ? 0.8 : 0.2) + (audioIntensity * 0.6) + (audioAverage * 0.4),
            scale: 1 + audioIntensity * 0.5
          }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>

      {/* Overlay UI elements */}
      <div className="absolute inset-0 pointer-events-none border border-cyber-blue/10 rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue/20 to-transparent animate-scanline" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-50" />
      </div>
    </div>
  );
}
