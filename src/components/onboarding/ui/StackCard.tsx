
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const habitsFeatures = [
    { icon: "🔎", title: "Categorías automáticas", text: "Tus gastos se ordenan solos, sin que tengas que hacer nada." },
    { icon: "🚨", title: "Alertas inteligentes", text: "Te avisa cuando detecta algo inusual o importante." },
    { icon: "🎛️", title: "Límites personalizados", text: "Define cuánto quieres gastar por categoría y Moni te ayuda." },
    { icon: "🧠", title: "Safe-to-Spend", text: "Sabe exactamente cuánto puedes gastar sin afectar tus metas." },
    { icon: "📊", title: "Seguimiento claro", text: "Tu avance diario y semanal en un solo vistazo." },
];

export const StackCardCarousel = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % habitsFeatures.length);
        }, 3500); // 3.5s per slide
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full max-w-[280px] h-[300px] mx-auto flex items-center justify-center perspective-[1000px]">
            <AnimatePresence mode="popLayout">
                <Card
                    key={index}
                    feature={habitsFeatures[index]}
                />
            </AnimatePresence>
        </div>
    );
};

const Card = ({ feature }: { feature: typeof habitsFeatures[0] }) => {
    return (
        <motion.div
            initial={{ scale: 0.9, y: 100, opacity: 0, rotate: 10 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotate: -5 }}
            exit={{ scale: 1.1, y: -100, opacity: 0, rotate: -15 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 p-6 flex flex-col items-center justify-center text-center z-10 origin-bottom"
        >
            {/* Splash/Blob background decoration inside card for style */}
            <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center h-full justify-center">
                <div className="text-6xl mb-6 filter drop-shadow-sm transform transition-transform">
                    {feature.icon}
                </div>
                <h3 className="text-text-main font-black text-xl mb-3 leading-tight tracking-tight">
                    {feature.title}
                </h3>
                <p className="text-text-secondary text-sm font-medium leading-relaxed px-2">
                    {feature.text}
                </p>
            </div>
        </motion.div>
    );
}
