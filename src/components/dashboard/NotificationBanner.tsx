import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface NotificationBannerProps {
    notifications?: { title: string; message: string; emoji?: string }[];
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ 
    notifications = [
        { emoji: "✅", title: "¡Vas excelente!", message: "Tus finanzas están saludables este mes" },
        { emoji: "💪", title: "¡Sigue así!", message: "Has gastado 15% menos en delivery este mes" },
        { emoji: "🎯", title: "¡Bien hecho!", message: "Llevas 3 días sin gastos hormiga" },
        { emoji: "🌟", title: "¡Increíble!", message: "Has reducido gastos en el Oxxo un 20%" }
    ]
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % notifications.length);
        }, 7000); // Change every 7 seconds

        return () => clearInterval(interval);
    }, [notifications.length]);

    const currentNotification = notifications[currentIndex];

    return (
        <div className="px-6 mb-6">
            <div className="bg-white rounded-[1.75rem] p-1 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.08)] border border-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50/80 to-[#8D6E63]/10 opacity-60"></div>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="relative flex items-center gap-3 p-3 pr-4"
                    >
                        <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                            <span className="text-xl">{currentNotification.emoji || "🤖"}</span>
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="text-xs font-bold text-gray-800 truncate">{currentNotification.title}</h3>
                                <div className="bg-[#F5F0EE] text-[#5D4037] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 border border-[#EBE5E2]">
                                    <Sparkles size={8} />
                                    <span className="text-[8px] font-bold uppercase">Tip</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight truncate">{currentNotification.message}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationBanner;
