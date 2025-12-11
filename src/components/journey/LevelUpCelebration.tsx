
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { StarIcon, CoffeeBeanIcon, TargetIcon, SparklesIcon } from './Icons';
import { createPortal } from 'react-dom';

interface LevelUpCelebrationProps {
    level: number;
    onDismiss: () => void;
}

const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({ level, onDismiss }) => {
    useEffect(() => {
        // Auto dismiss after 4 seconds
        const timer = setTimeout(onDismiss, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    // Generate random particles
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // -50% to 50% relative to center
        y: Math.random() * 100 - 50,
        scale: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.2,
        icon: i % 3 === 0 ? CoffeeBeanIcon : (i % 2 === 0 ? StarIcon : SparklesIcon),
        color: i % 3 === 0 ? 'text-coffee-800' : 'text-yellow-400'
    }));

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-coffee-950/90 backdrop-blur-md pointer-events-none"
        >
            <div className="relative flex flex-col items-center justify-center">

                {/* Sunburst Background */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute z-0 opacity-20"
                >
                    <svg width="600" height="600" viewBox="0 0 600 600" className="text-coffee-200 fill-current">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <rect
                                key={i}
                                x="280" y="0" width="40" height="300"
                                transform={`rotate(${i * 30} 300 300)`}
                            />
                        ))}
                    </svg>
                </motion.div>

                {/* Particles Explosion */}
                {particles.map((p) => {
                    const Icon = p.icon;
                    return (
                        <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                            animate={{
                                x: p.x * 5, // Explode outwards
                                y: p.y * 5,
                                scale: p.scale,
                                opacity: [0, 1, 0],
                                rotate: p.rotation + 180
                            }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: p.delay }}
                            className={`absolute z-10 w-6 h-6 ${p.color}`}
                        >
                            <Icon />
                        </motion.div>
                    )
                })}

                {/* Trophy / Icon Card */}
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="z-20 bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center text-center border-4 border-yellow-400 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-yellow-50 opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-white mb-4 shadow-lg text-5xl relative z-10"
                    >
                        <TargetIcon />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-black text-coffee-900 mb-1 z-10 uppercase tracking-tight"
                    >
                        ¡Nivel {level}!
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-coffee-600 font-bold text-sm z-10"
                    >
                        Patrimonio desbloqueado
                    </motion.p>
                </motion.div>

            </div>
        </motion.div>,
        document.body
    );
};

export default LevelUpCelebration;
