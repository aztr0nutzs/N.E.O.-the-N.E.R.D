import { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  accentColor?: 'blue' | 'green' | 'orange' | 'magenta';
  onClose?: () => void;
}

export function Panel({ children, className, title, accentColor = 'blue', onClose }: PanelProps) {
  const accentClasses = {
    blue: 'border-cyber-blue/50 shadow-[0_0_20px_rgba(0,255,255,0.2)_inset]',
    green: 'border-neon-green/50 shadow-[0_0_20px_rgba(57,255,20,0.2)_inset]',
    orange: 'border-bio-orange/50 shadow-[0_0_20px_rgba(255,140,0,0.2)_inset]',
    magenta: 'border-fuchsia-500/50 shadow-[0_0_20px_rgba(255,0,255,0.2)_inset]',
  };

  const textAccentClasses = {
    blue: 'text-cyber-blue text-glow-blue',
    green: 'text-neon-green text-glow-green',
    orange: 'text-bio-orange text-glow-orange',
    magenta: 'text-fuchsia-500',
  };

  return (
    <div 
      className={cn(
        "relative bg-[#111318]/95 backdrop-blur-md p-5 flex flex-col",
        className
      )}
      style={{
        clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)'
      }}
    >
      {/* Outer Metallic Border */}
      <div 
        className="absolute inset-0 border-[3px] border-[#3a3f47] pointer-events-none"
        style={{
          clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)'
        }}
      />
      
      {/* Inner Accent Border */}
      <div 
        className={cn("absolute inset-[3px] border-2 pointer-events-none", accentClasses[accentColor])}
        style={{
          clipPath: 'polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)'
        }}
      />

      {/* Hazard Stripes (Top and Bottom) */}
      <div className="absolute top-[5px] left-[40px] right-[40px] h-2 opacity-60 pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #a3e635 10px, #a3e635 20px)' }} />
      <div className="absolute bottom-[5px] left-[40px] right-[40px] h-2 opacity-60 pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #a3e635 10px, #a3e635 20px)' }} />

      {/* Corner Neon Lights (Blue) */}
      <div className="absolute top-[8px] left-[8px] w-6 h-2 bg-cyber-blue rounded-full shadow-[0_0_10px_#00FFFF] -rotate-45 pointer-events-none" />
      <div className="absolute top-[8px] right-[8px] w-6 h-2 bg-cyber-blue rounded-full shadow-[0_0_10px_#00FFFF] rotate-45 pointer-events-none" />
      <div className="absolute bottom-[8px] left-[8px] w-6 h-2 bg-cyber-blue rounded-full shadow-[0_0_10px_#00FFFF] rotate-45 pointer-events-none" />
      <div className="absolute bottom-[8px] right-[8px] w-6 h-2 bg-cyber-blue rounded-full shadow-[0_0_10px_#00FFFF] -rotate-45 pointer-events-none" />

      {/* Corner Screws */}
      <div className="absolute top-6 left-2 w-2 h-2 rounded-full bg-[#1a1d24] border border-[#4b5563] shadow-sm pointer-events-none" />
      <div className="absolute top-6 right-2 w-2 h-2 rounded-full bg-[#1a1d24] border border-[#4b5563] shadow-sm pointer-events-none" />
      <div className="absolute bottom-6 left-2 w-2 h-2 rounded-full bg-[#1a1d24] border border-[#4b5563] shadow-sm pointer-events-none" />
      <div className="absolute bottom-6 right-2 w-2 h-2 rounded-full bg-[#1a1d24] border border-[#4b5563] shadow-sm pointer-events-none" />

      {title && (
        <div className="mb-3 border-b border-panel-border/50 pb-2 flex items-center justify-between relative z-10 mt-2">
          <h2 className={cn("font-mono text-sm uppercase tracking-widest font-bold", textAccentClasses[accentColor])}>
            {title}
          </h2>
          <div className="flex gap-3 items-center">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_5px_#f97316] animate-pulse" />
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_5px_#f97316] animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_5px_#f97316] animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-red-500/20 rounded p-1 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
        {children}
      </div>
    </div>
  );
}
