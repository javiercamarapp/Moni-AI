import React, { useState } from 'react';
import { Hourglass, Calendar, ArrowRight, Zap, Target, Beer, Wallet, TrendingUp, Utensils, ShoppingBag, PiggyBank, Landmark, CreditCard } from 'lucide-react';

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

interface ChallengesCarouselProps {
    challenges: Challenge[];
    period: 'weekly' | 'monthly';
    onAcceptChallenge: (challengeId: string) => void;
    onViewDetails: (challenge: Challenge) => void;
}

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

export const THEME_STYLES = {
    espresso: {
        bg: 'bg-[#3E2723]',
        text: 'text-[#D7CCC8]',
        dark: 'text-white',
        accent: 'text-[#A1887F]',
        button: 'bg-[#D7CCC8]',
        buttonText: 'text-[#3E2723]',
        gradient: 'from-[#4E342E] to-[#3E2723]',
        bar: 'bg-white',
        track: 'bg-[#6D4C41]/30',
        border: 'border-[#4E342E]'
    },
    latte: {
        bg: 'bg-[#FFF8E1]',
        text: 'text-[#B45309]',
        dark: 'text-[#78350F]',
        accent: 'text-[#F59E0B]',
        button: 'bg-[#78350F]',
        buttonText: 'text-white',
        gradient: 'from-[#FFFBEB] to-[#FFF8E1]',
        bar: 'bg-[#D97706]',
        track: 'bg-[#FFE0B2]',
        border: 'border-[#FFECB3]'
    },
    sand: {
        bg: 'bg-[#FAF8F5]',
        text: 'text-[#8D6E63]',
        dark: 'text-[#5D4037]',
        accent: 'text-[#A1887F]',
        button: 'bg-[#5D4037]',
        buttonText: 'text-white',
        gradient: 'from-white to-[#FAF8F5]',
        bar: 'bg-[#8D6E63]',
        track: 'bg-[#E7DED0]',
        border: 'border-[#E7DED0]'
    },
    clay: {
        bg: 'bg-[#EFEBE9]',
        text: 'text-[#8D6E63]',
        dark: 'text-[#5D4037]',
        accent: 'text-[#BCAAA4]',
        button: 'bg-[#8D6E63]',
        buttonText: 'text-white',
        gradient: 'from-[#F5F5F5] to-[#EFEBE9]',
        bar: 'bg-[#8D6E63]',
        track: 'bg-[#D7CCC8]',
        border: 'border-[#D7CCC8]'
    },
    sage: {
        bg: 'bg-[#F1F8E9]',
        text: 'text-[#33691E]',
        dark: 'text-[#1B5E20]',
        accent: 'text-[#9CCC65]',
        button: 'bg-[#33691E]',
        buttonText: 'text-white',
        gradient: 'from-white to-[#F1F8E9]',
        bar: 'bg-[#558B2F]',
        track: 'bg-[#DCEDC8]',
        border: 'border-[#C5E1A5]'
    },
};

const ChallengeCard = ({
    challenge,
    onClick
}: {
    challenge: Challenge;
    onClick: () => void;
}) => {
    const theme = THEME_STYLES[challenge.theme || 'sand'];
    const IconComponent = ICON_MAP[challenge.icon] || Target;

    return (
        <div
            onClick={onClick}
            className={`group relative w-[240px] h-[280px] rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border transition-all duration-300 cursor-pointer overflow-hidden ${challenge.isActive ? 'bg-[#FFFCFA] border-[#E8DED8]' : `bg-gradient-to-br ${theme.gradient} border-[#E7DED0]`
                } hover:shadow-xl hover:-translate-y-1`}
        >
            {/* Background Decor */}
            {!challenge.isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10" />}

            {/* Header */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${challenge.isActive ? 'bg-[#E8DED8] text-[#5D4037]' : 'bg-[#5D4037]/5 ' + theme.dark}`}>
                        <IconComponent size={20} strokeWidth={1.5} />
                    </div>
                    {challenge.isActive ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Activo</span>
                        </div>
                    ) : (
                        <div className={`px-2 py-1 rounded-lg border border-[#5D4037]/5 bg-white/30 backdrop-blur-sm ${theme.dark}`}>
                            <span className="text-[10px] font-black tracking-tight flex items-center gap-1">
                                <Zap size={10} fill="currentColor" />
                                {challenge.xpReward}
                            </span>
                        </div>
                    )}
                </div>

                <h4 className={`text-lg font-serif font-bold leading-tight mb-2 ${challenge.isActive ? 'text-[#433431]' : theme.dark}`}>
                    {challenge.title}
                </h4>

                {!challenge.isActive && (
                    <p className={`text-[11px] font-medium leading-relaxed opacity-90 line-clamp-2 ${theme.text}`}>
                        {challenge.description}
                    </p>
                )}
            </div>

            {/* Content Body */}
            <div className="relative z-10 flex-1 flex flex-col justify-end">
                {challenge.isActive && challenge.currentProgress !== undefined ? (
                    <div className="mt-2">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-2xl font-black text-[#433431]">
                                {challenge.currentProgress}
                                <span className="text-xs text-[#A1887F] font-medium">/{challenge.target}</span>
                            </span>
                            <span className="text-[9px] font-bold text-[#A1887F]">{challenge.unit}</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#E8DED8] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#8D6E63] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((challenge.currentProgress / challenge.target) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className={`mt-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center gap-2 ${theme.dark}`}>
                        <span className="text-[10px] font-black tracking-widest">VER DETALLES</span>
                        <ArrowRight size={12} />
                    </div>
                )}
            </div>
        </div>
    );
};

export const ChallengesCarousel: React.FC<ChallengesCarouselProps> = ({
    challenges,
    period,
    onAcceptChallenge,
    onViewDetails
}) => {
    const Icon = period === 'weekly' ? Hourglass : Calendar;
    const title = period === 'weekly' ? 'Retos Semanales' : 'Retos Mensuales';
    const timeLabel = period === 'weekly' ? 'Resetean en 2d' : 'Resetean en 12d';

    return (
        <div className="mb-8 animate-in slide-in-from-bottom duration-700 delay-100">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-[#A1887F] font-bold text-[10px] uppercase tracking-wider">
                        {title}
                    </h3>
                    <span className="w-1 h-1 rounded-full bg-[#A1887F]" />
                    <span className="text-[10px] text-[#8D6E63] font-medium">Gana XP</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                    <Icon size={10} className="text-[#8D6E63]" />
                    <span className="text-[9px] font-bold text-[#8D6E63]">{timeLabel}</span>
                </div>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-8 -mx-6 px-6 no-scrollbar snap-x snap-mandatory py-2">
                {challenges.map((challenge) => (
                    <div key={challenge.id} className="snap-center shrink-0">
                        <ChallengeCard
                            challenge={challenge}
                            onClick={() => onViewDetails(challenge)}
                        />
                    </div>
                ))}
            </div>

            <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
};
