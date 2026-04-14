import { motion } from 'motion/react';

export function NerdLogo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div 
        className="font-black italic text-4xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-pink-500 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] select-none"
        style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
        animate={{ 
          filter: [
            'drop-shadow(0 0 10px rgba(0,255,255,0.5))',
            'drop-shadow(0 0 20px rgba(0,255,255,0.8))',
            'drop-shadow(0 0 10px rgba(0,255,255,0.5))'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        NERD
      </motion.div>
      <div className="absolute -bottom-4 right-0 text-[8px] font-mono text-cyber-blue tracking-[0.3em] opacity-70">
        V-CORE 5
      </div>
    </div>
  );
}
