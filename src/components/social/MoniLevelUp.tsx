import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface MoniLevelUpProps {
  level: number;
  show: boolean;
  onComplete?: () => void;
}

export default function MoniLevelUp({ level, show, onComplete }: MoniLevelUpProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show && level > 1) {
      setIsVisible(true);
      
      // 🎉 Confeti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f5a623', '#4a90e2', '#7ed321', '#bd10e0']
      });

      // 🔊 Sonido de logro (si existe)
      try {
        const audio = new Audio("/sounds/levelup.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {
          // Silently fail if audio not available
          console.log("Audio not available");
        });
      } catch (e) {
        console.log("Audio playback error");
      }

      // 📳 Vibración suave (si es móvil)
      if (navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [show, level, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 80 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="relative bg-card/95 dark:bg-card/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-border flex flex-col items-center overflow-hidden max-w-md mx-4">
            {/* ✨ Efecto de luz suave detrás */}
            <motion.div
              className="absolute w-64 h-64 bg-primary/20 blur-3xl rounded-full"
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.7, 0.3, 0.7] 
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            
            {/* 🦉 Búho animado */}
            <motion.div
              className="text-8xl mb-4 relative z-10"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              🦉
            </motion.div>

            <motion.h2 
              className="text-3xl font-bold text-foreground mb-2 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              ¡Nivel {level} alcanzado!
            </motion.h2>

            <motion.p 
              className="text-muted-foreground text-center max-w-xs relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Moni está orgullosa de ti 💚  
              <br />
              Sigue completando retos para alcanzar el 100/100
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
