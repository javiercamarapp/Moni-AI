import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const isBadge = message.includes('Insignia');

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div
          className={`
            px-4 py-2.5 rounded-[16px] shadow-xl border-2
            ${isBadge 
              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-300' 
              : 'bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-300'
            }
          `}
          initial={{ opacity: 0, x: 100, y: -20 }}
          animate={{ 
            opacity: 1,
            x: 0,
            y: 0,
          }}
          exit={{ opacity: 0, x: 100 }}
          transition={{
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1]
          }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="text-2xl"
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.15, 1]
              }}
              transition={{
                duration: 0.5,
                repeat: 1,
              }}
            >
              {isBadge ? '🏆' : '🎯'}
            </motion.div>
            <div className="text-white max-w-[200px]">
              <p className="text-xs font-medium leading-tight">
                {message}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
