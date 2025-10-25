import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';

interface JourneyCelebrationProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
}

export function JourneyCelebration({ show, message, onComplete }: JourneyCelebrationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const isBadge = message.includes('Insignia');

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        className="bg-white rounded-[20px] shadow-xl text-foreground h-10 px-4 transition-all border border-blue-100 cursor-default overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1,
          scale: [0.8, 1.05, 1],
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        {/* Efecto de brillo de fondo */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-400/20"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <div className="flex items-center gap-2 relative z-10">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            {isBadge ? <Trophy className="h-4 w-4 text-purple-600" /> : <TrendingUp className="h-4 w-4 text-blue-600" />}
          </motion.div>
          <span className="text-sm font-medium">
            {message}
          </span>
        </div>
      </motion.button>
    </AnimatePresence>
  );
}

