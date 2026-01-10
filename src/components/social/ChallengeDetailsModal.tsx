import { useState, useEffect } from 'react';
import { X, Zap, Hourglass, ArrowRight, CheckCircle2, Sparkles, Beer, Wallet, TrendingUp, Utensils, ShoppingBag, PiggyBank, Landmark, CreditCard, Target } from 'lucide-react';
import { StreakVisualizer, BarVisualizer, RatioVisualizer } from './ChallengeVisualizers';
import { THEME_STYLES } from './ChallengesCarousel';

const ICON_MAP: Record<string, any> = {
    'Beer': Beer,
    'Wallet': Wallet,
    'TrendingUp': TrendingUp,
    'Utensils': Utensils,
    'ShoppingBag': ShoppingBag,
    'PiggyBank': PiggyBank,
    'Landmark': Landmark,
    'CreditCard': CreditCard,
    'Target': Target,
};

interface Challenge {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    icon: string;
    target: number;
    unit: string;
    currentProgress?: number;
    isActive: boolean;
    period: 'weekly' | 'monthly';
    theme?: 'espresso' | 'latte' | 'sand' | 'clay' | 'sage';
    type?: 'budget' | 'saving' | 'ratio' | 'streak' | 'debt' | 'investment';
    aiReason?: string;
    tips?: string[];
}

export const ChallengeDetailsModal = ({
    challenge,
    onClose,
    onAccept,
}: {
    challenge: Challenge;
    onClose: () => void;
    onAccept: () => void;
}) => {
    const theme = THEME_STYLES[challenge.theme || 'sand'];
    const [isAccepted, setIsAccepted] = useState(challenge.isActive);
    const IconComponent = ICON_MAP[challenge.icon] || Target;

    useEffect(() => {
        setIsAccepted(challenge.isActive);
    }, [challenge.isActive]);

    const handleAccept = () => {
        setIsAccepted(true);
        onAccept();
        onClose();
    };

    const isDarkTheme = challenge.theme === 'espresso';
    // Use warmer transparent browns instead of black
    const badgeBg = isDarkTheme ? 'bg-white/10' : 'bg-[#78716C]/10';
    const closeButtonClass = isDarkTheme ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#78716C]/10 hover:bg-[#78716C]/20 text-[#5D4037]';
    const xpIconColor = isDarkTheme ? 'text-amber-300' : 'text-amber-600';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4">
            <div className="absolute inset-0 bg-[#292524]/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200" onClick={onClose} />

            <div className={`relative w-full max-w-sm rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden bg-[#FAFAF9] animate-in zoom-in-95 duration-300 flex flex-col max-h-[75vh] sm:max-h-[90vh]`}>

                {/* Header Area with Theme Background */}
                <div className={`relative px-6 pt-8 pb-16 ${theme.bg}`}>
                    <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${closeButtonClass}`}>
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-2xl backdrop-blur-sm ${badgeBg}`}>
                            <IconComponent size={28} className={theme.dark} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                {isAccepted ? (
                                    <div className={`${isDarkTheme ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'} px-2 py-0.5 rounded-full flex items-center gap-1 border`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">En Curso</span>
                                    </div>
                                ) : (
                                    <span className={`text-[10px] font-bold uppercase tracking-wide opacity-60 ${theme.text}`}>Nuevo Reto</span>
                                )}
                            </div>
                            <h2 className={`text-2xl font-black leading-tight ${theme.dark}`}>{challenge.title}</h2>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 text-xs font-medium ${theme.text}`}>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${badgeBg}`}>
                            <Zap size={12} fill="currentColor" className={xpIconColor} />
                            <span className="font-bold">+{challenge.xpReward} XP</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${badgeBg}`}>
                            <Hourglass size={12} />
                            <span>{challenge.unit === 'días' ? `${challenge.target} días` : 'Semanal'}</span>
                        </div>
                    </div>
                </div>

                {/* Body Content - Overlapping Header */}
                <div className="relative -mt-8 flex-1 bg-[#FAFAF9] rounded-t-[2rem] px-6 py-6 overflow-y-auto">

                    {/* Visualizer Section */}
                    <div className="mb-8">
                        {isAccepted ? (
                            <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm">
                                {challenge.type === 'streak' && (
                                    <div className="text-center">
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-xs font-bold text-[#A1887F] uppercase">Progreso</p>
                                            <p className="text-xl font-black text-[#433431]">{challenge.currentProgress || 0}/{challenge.target} <span className="text-xs text-[#A1887F] font-medium">{challenge.unit}</span></p>
                                        </div>
                                        <StreakVisualizer target={challenge.target} current={challenge.currentProgress || 0} theme={theme} isLarge />
                                    </div>
                                )}
                                {(challenge.type === 'budget' || challenge.type === 'saving' || challenge.type === 'investment' || challenge.type === 'debt') && (
                                    <BarVisualizer target={challenge.target} current={challenge.currentProgress || 0} theme={theme} isLarge type={challenge.type} />
                                )}
                                {challenge.type === 'ratio' && (
                                    <RatioVisualizer target={challenge.target} current={challenge.currentProgress || 0} theme={theme} isLarge />
                                )}
                                {!challenge.type && ( // Default fallback if type is missing
                                    <BarVisualizer target={challenge.target} current={challenge.currentProgress || 0} theme={theme} isLarge />
                                )}
                            </div>
                        ) : (
                            <div className="bg-[#FFFBEB] rounded-2xl p-4 border border-[#FDE68A] flex gap-3">
                                <Sparkles className="text-amber-500 flex-shrink-0 mt-1" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-amber-800 uppercase mb-1">Moni AI Insight</p>
                                    <p className="text-sm text-amber-900 leading-snug">{challenge.aiReason || "Este reto te ayudará a mejorar tus finanzas personales basado en tus hábitos."}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h4 className="text-sm font-extrabold text-[#433431] mb-2 uppercase tracking-wide">Objetivo</h4>
                        <p className="text-[#6D4C41] text-sm leading-relaxed font-medium">
                            {challenge.description}
                        </p>
                    </div>

                    {/* Tips */}
                    {challenge.tips && challenge.tips.length > 0 && (
                        <div className="mb-8">
                            <h4 className="text-sm font-extrabold text-[#433431] mb-3 uppercase tracking-wide">Tips para lograrlo</h4>
                            <ul className="space-y-3">
                                {challenge.tips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-[#6D4C41]">
                                        <div className={`p-1 rounded-full mt-0.5 bg-[#F5F5F4]`}>
                                            <CheckCircle2 size={12} className={theme.text?.replace('text-', 'text-opacity-80 text-') || 'text-stone-500'} />
                                        </div>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>

                {/* Footer Action */}
                {!isAccepted && (
                    <div className="p-6 border-t border-[#E7E5E4] bg-white">
                        <button
                            onClick={handleAccept}
                            className={`w-full py-4 rounded-2xl ${theme.button} ${theme.buttonText} text-sm font-black tracking-wide shadow-lg hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                        >
                            <span>ACEPTAR RETO</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
