import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

interface CelebrationConfettiProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

export function CelebrationConfetti({ 
  show, 
  onComplete, 
  duration = 3000,
  particleCount = 30 
}: CelebrationConfettiProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      const colors = [
        'hsl(280, 70%, 60%)',
        'hsl(200, 70%, 60%)',
        'hsl(340, 70%, 60%)',
        'hsl(145, 70%, 60%)',
        'hsl(45, 90%, 60%)',
        'hsl(0, 0%, 100%)',
      ];

      const pieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.5,
      }));

      setConfetti(pieces);

      const timer = setTimeout(() => {
        setConfetti([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, particleCount, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute rounded-full"
            style={{
              left: `${piece.x}%`,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
            }}
            initial={{ 
              y: piece.y,
              rotate: piece.rotation,
              opacity: 1
            }}
            animate={{
              y: [piece.y, 120],
              x: [0, (Math.random() - 0.5) * 100],
              rotate: [piece.rotation, piece.rotation + 360 * 3],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: duration / 1000,
              delay: piece.delay,
              ease: [0.23, 1, 0.32, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ScorePopupProps {
  show: boolean;
  scoreChange: number;
  onComplete?: () => void;
}

export function ScorePopup({ show, scoreChange, onComplete }: ScorePopupProps) {
  useEffect(() => {
    if (show && scoreChange > 0) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, scoreChange, onComplete]);

  if (!show || scoreChange === 0) return null;

  const isPositive = scoreChange > 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`
            px-8 py-4 rounded-[20px] shadow-2xl border-2
            ${isPositive 
              ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300' 
              : 'bg-gradient-to-br from-red-500 to-orange-600 border-red-300'
            }
          `}
          initial={{ scale: 0, y: 20 }}
          animate={{ 
            scale: [0, 1.2, 1],
            y: [20, -10, 0],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1]
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="text-4xl"
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
              }}
            >
              {isPositive ? '🎉' : '📉'}
            </motion.div>
            <div className="text-white">
              <p className="text-sm font-medium">
                {isPositive ? '¡Score Moni subió!' : 'Score Moni bajó'}
              </p>
              <p className="text-2xl font-bold">
                {isPositive ? '+' : ''}{scoreChange} pts
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface GoalMilestoneProps {
  show: boolean;
  milestone: 'start' | '25' | '50' | '75' | '100';
  goalName: string;
  onComplete?: () => void;
}

export function GoalMilestone({ show, milestone, goalName, onComplete }: GoalMilestoneProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const milestoneConfig = {
    start: { emoji: '🎯', text: '¡Meta creada!', color: 'from-blue-500 to-purple-600' },
    '25': { emoji: '👏', text: '¡25% completado!', color: 'from-purple-500 to-pink-600' },
    '50': { emoji: '🌟', text: '¡A mitad de camino!', color: 'from-yellow-500 to-orange-600' },
    '75': { emoji: '🔥', text: '¡75% completado!', color: 'from-orange-500 to-red-600' },
    '100': { emoji: '🎊', text: '¡Meta completada!', color: 'from-emerald-500 to-green-600' },
  };

  const config = milestoneConfig[milestone];

  return (
    <>
      {milestone === '100' && <CelebrationConfetti show={true} onComplete={onComplete} />}
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`
              w-full max-w-sm px-6 py-5 rounded-[24px] shadow-2xl border-2 border-white/30
              bg-gradient-to-br ${config.color}
            `}
            initial={{ scale: 0, y: 50 }}
            animate={{ 
              scale: [0, 1.1, 1],
              y: [50, -20, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1]
            }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="text-6xl mb-3"
                animate={{ 
                  rotate: [0, -15, 15, -15, 0],
                  scale: [1, 1.3, 1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: milestone === '100' ? 3 : 1,
                }}
              >
                {config.emoji}
              </motion.div>
              <p className="text-2xl font-bold text-white mb-1">
                {config.text}
              </p>
              <p className="text-sm text-white/90 font-medium">
                {goalName}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
