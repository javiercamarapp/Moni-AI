import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Notification {
    title: string;
    message: string;
    emoji?: string;
    type?: 'positive' | 'negative';
}

interface NotificationBannerProps {
    notifications?: Notification[];
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ 
    notifications = [
        { emoji: "✅", title: "¡Vas excelente!", message: "Tus finanzas están saludables este mes", type: 'positive' },
        { emoji: "💪", title: "¡Sigue así!", message: "Has gastado 15% menos en delivery este mes", type: 'positive' },
        { emoji: "🎯", title: "¡Bien hecho!", message: "Llevas 3 días sin gastos hormiga", type: 'positive' },
        { emoji: "⚠️", title: "Cuidado", message: "Has excedido tu presupuesto de comida", type: 'negative' },
        { emoji: "🌟", title: "¡Increíble!", message: "Has reducido gastos en el Oxxo un 20%", type: 'positive' }
    ]
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % notifications.length);
        }, 7000);

        return () => clearInterval(interval);
    }, [notifications.length]);

    const currentNotification = notifications[currentIndex];
    const isPositive = currentNotification.type !== 'negative';

    return (
        <div className="px-6 mb-4">
            <div className={`rounded-2xl p-1 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.08)] border relative overflow-hidden transition-colors duration-300 ${
                isPositive 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50' 
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200/50'
            }`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="relative flex items-center gap-3 p-2 pr-3"
                    >
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                            isPositive 
                                ? 'bg-green-100 border border-green-200' 
                                : 'bg-red-100 border border-red-200'
                        }`}>
                            <span className="text-lg">{currentNotification.emoji || "🤖"}</span>
                        </div>
                        
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className={`text-xs font-bold truncate ${
                                    isPositive ? 'text-green-800' : 'text-red-800'
                                }`}>{currentNotification.title}</h3>
                                <div className={`px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
                                    isPositive 
                                        ? 'bg-green-100 text-green-700 border border-green-200' 
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                    <Sparkles size={8} />
                                    <span className="text-[8px] font-bold uppercase">Tip</span>
                                </div>
                            </div>
                            <p className={`text-[10px] leading-tight truncate ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>{currentNotification.message}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationBanner;
