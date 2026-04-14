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
        className="absolute inset-x-12 top-[18%] bottom-[14%] rounded-[40%] bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.18)_0%,rgba(0,255,255,0.05)_38%,transparent_72%)] blur-2xl"
        animate={{
          opacity: neuralSurge ? [0.4, 0.9, 0.55] : [0.22, 0.34, 0.22],
          scale: neuralSurge ? [0.94, 1.08, 0.98] : [0.98, 1.03, 0.98],
        }}
        transition={{ duration: neuralSurge ? 1.8 : 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-x-16 top-[21%] bottom-[18%] rounded-[38%] border border-cyber-blue/15"
        animate={{ opacity: [0.18, 0.3, 0.18], scale: [0.98, 1.015, 0.98] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative w-64 h-64 flex items-center justify-center"
        animate={{
          y: [0, -12, -4, 0],
          rotateX: targetRotX,
          rotateY: targetRotY,
          rotateZ: [0, 0.9, -0.7, 0],
          scale: targetScale,
        }}
        transition={{
          y: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
          rotateX: { type: "spring", stiffness: 100, damping: 20 },
          rotateY: { type: "spring", stiffness: 100, damping: 20 },
          rotateZ: { duration: 7.4, repeat: Infinity, ease: "easeInOut" },
          scale: { type: "spring", stiffness: 200, damping: 20 },
        }}
        style={{ perspective: 1000 }}
      >
        <motion.div
          className="absolute inset-4 rounded-full border border-cyber-blue/10"
          animate={{ rotate: 360, opacity: [0.18, 0.34, 0.18] }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, opacity: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' } }}
        />
        <motion.img
          src="/robot.png"
          alt="N.E.O. Robot"
          className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]"
          animate={{
            y: audioBoostY,
            filter: `drop-shadow(0 0 ${18 + audioIntensity * 34}px rgba(0,255,255,${0.52 + audioAverage * 0.9}))`,
            rotateZ: userPosition.x * 2.5,
          }}
          transition={{
            y: { type: "spring", stiffness: 300, damping: 20 },
            filter: { duration: 0.12 },
            rotateZ: { type: "spring", stiffness: 120, damping: 22 }
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
        <motion.div
          className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyber-blue/20"
          animate={{
            scale: neuralSurge ? [0.92, 1.18, 1] : [0.96, 1.08, 0.96],
            opacity: neuralSurge ? [0.18, 0.42, 0.24] : [0.1, 0.2, 0.1],
          }}
          transition={{ duration: neuralSurge ? 1.6 : 4.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Overlay UI elements */}
      <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden border border-cyber-blue/12">
        <div className="absolute inset-4 rounded-[24px] border border-cyber-blue/8 ambient-grid opacity-35" />
        <div className="absolute left-0 right-0 top-0 h-8 bg-gradient-to-b from-cyber-blue/10 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-blue/40 to-transparent animate-scanline" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.44)_100%)] opacity-60" />
      </div>
    </div>
  );
}
