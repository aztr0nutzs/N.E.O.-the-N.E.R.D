import { useNeural } from '../context/NeuralContext';

export function NeuralVisualizer() {
  const { audioData } = useNeural();

  return (
    <div className="w-full h-12 flex items-end justify-between gap-[1px] px-2">
      {Array.from(audioData).slice(0, 32).map((value: number, i) => (
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
}
