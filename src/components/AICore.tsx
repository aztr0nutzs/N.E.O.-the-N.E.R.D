import { motion } from 'motion/react';
import { useNeural } from '../context/NeuralContext';

export function AICore() {
  const { audioData, userPosition, neuralSurge, currentModel } = useNeural();
  
  // Calculate average audio intensity
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i];
  }
  const intensity = audioData.length > 0 ? sum / audioData.length : 0;
  
  const pulseScale = (neuralSurge ? 1.3 : 1) + (intensity / 255) * 0.5;

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto flex flex-col items-center justify-center">
      <div className="relative w-full aspect-square flex items-center justify-center">
        {/* Outer Ring */}
        <motion.div 
          className="absolute inset-0 rounded-full border border-cyber-blue/20"
          animate={{ 
            rotate: 360,
            x: userPosition.x * 20,
            y: userPosition.y * 20
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            x: { duration: 0.5, ease: "easeOut" },
            y: { duration: 0.5, ease: "easeOut" }
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyber-blue rounded-full box-glow-blue" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyber-blue rounded-full box-glow-blue" />
        </motion.div>

        {/* Dashed Ring */}
        <motion.svg 
          viewBox="0 0 100 100" 
          className="absolute inset-4"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <circle 
            cx="50" cy="50" r="48" 
            fill="none" 
            stroke="#00FFFF" 
            strokeWidth="1" 
            strokeDasharray="4 4" 
            className="opacity-50"
          />
        </motion.svg>

        {/* Inner Glowing Core Container */}
        <div className="absolute inset-12 rounded-full border-2 border-cyber-blue/40 flex items-center justify-center bg-black/50 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,255,0.2)_inset]">
          {/* Core Pulse */}
          <motion.div
            className="w-16 h-16 rounded-full bg-cyber-blue"
            animate={{ 
              scale: [pulseScale, pulseScale * 1.1, pulseScale],
              opacity: [0.5 + (intensity / 512), 1, 0.5 + (intensity / 512)],
              boxShadow: [
                `0 0 ${20 + intensity / 5}px rgba(0,255,255,0.5)`,
                `0 0 ${50 + intensity / 2}px rgba(0,255,255,0.8)`,
                `0 0 ${20 + intensity / 5}px rgba(0,255,255,0.5)`
              ]
            }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
          
          {/* Center Text/Logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-mono text-xl font-bold text-white text-glow-blue tracking-widest">
              N.E.O.
            </span>
            <span className="font-mono text-[8px] text-cyber-blue/80 mt-1 tracking-widest uppercase">
              Current Model: {currentModel}
            </span>
          </div>
        </div>

        {/* Decorative lines radiating outwards */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-blue/30 to-transparent"
            style={{ transform: `rotate(${i * 45}deg)` }}
          />
        ))}
      </div>
    </div>
  );
}
