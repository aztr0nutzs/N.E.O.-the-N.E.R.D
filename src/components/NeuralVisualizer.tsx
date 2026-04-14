import React, { useMemo } from 'react';
import { useNeuralRealtime } from '../context/NeuralContext';

export const NeuralVisualizer = React.memo(function NeuralVisualizer() {
  const { audioData } = useNeuralRealtime();
  const bars = useMemo(() => Array.from(audioData.slice(0, 32)), [audioData]);

  return (
    <div className="w-full h-12 flex items-end justify-between gap-[1px] px-2">
      {bars.map((value, i) => (
        <div 
          key={i}
          className="w-full bg-cyber-blue shadow-[0_0_5px_rgba(0,255,255,0.5)]"
          style={{ 
            height: `${(value / 255) * 100}%`,
            opacity: 0.3 + (value / 255) * 0.7,
            transition: 'height 0.1s ease-out'
          }}
        />
      ))}
    </div>
  );
});
