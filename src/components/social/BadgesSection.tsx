import React from 'react';
import { Hourglass, Calendar, Medal, ArrowRight, Zap, Lock, CheckCircle2, Coffee, Shield, Crown, Sparkles } from 'lucide-react';

interface Badge {
    id: string;
    name: string;
    description: string;
    requiredXP: number;
    icon: string;
    theme: 'bronze' | 'silver' | 'gold' | 'platinum';
    unlocked: boolean;
}

interface BadgesSectionProps {
    badges: Badge[];
    userTotalXP: number;
}

const BADGE_STYLES = {
    bronze: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: 'text-amber-700', shadow: 'shadow-amber-100' },
    silver: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', icon: 'text-stone-500', shadow: 'shadow-stone-100' },
    gold: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: 'text-yellow-600', shadow: 'shadow-yellow-100' },
    platinum: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-100', icon: 'text-cyan-600', shadow: 'shadow-cyan-100' },
};

const BadgeCard = ({ badge, isUnlocked, userTotalXP }: { badge: Badge, isUnlocked: boolean, userTotalXP: number }) => {
    const style = BADGE_STYLES[badge.theme];
    const progress = Math.min((userTotalXP / badge.requiredXP) * 100, 100);

    return (
        <div className={`relative w-[180px] h-[200px] rounded-[1.5rem] p-5 flex flex-col items-center text-center justify-between border transition-all duration-300 group ${isUnlocked
            ? `bg-white ${style.border} ${style.shadow} shadow-lg`
            : 'bg-[#F5F5F4] border-[#E7E5E4] opacity-80 hover:opacity-100'
            }`}>
            {/* XP Requirement Tag */}
            <div className={`absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isUnlocked
                ? `${style.bg} ${style.text}`
                : 'bg-[#E7E5E4] text-[#A8A29E]'
                }`}>
                {badge.requiredXP} XP
            </div>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mt-2 ${isUnlocked
                ? `${style.bg} ${style.icon}`
                : 'bg-[#E7E5E4] text-[#A8A29E]'
                } group-hover:scale-110 transition-transform duration-300`}>
                {isUnlocked ? (
                    <span className="text-2xl">{badge.icon}</span>
                ) : (
                    <Lock size={20} />
                )}
            </div>

            {/* Text Content */}
            <div className="w-full">
                <h4 className={`text-sm font-black leading-tight mb-1 ${isUnlocked ? 'text-[#292524]' : 'text-[#78716C]'
                    }`}>
                    {badge.name}
                </h4>
                <p className={`text-[10px] leading-tight line-clamp-2 ${isUnlocked ? 'text-[#78716C]' : 'text-[#A8A29E]'
                    }`}>
                    {badge.description}
                </p>
            </div>

            {/* Status Bar */}
            <div className="w-full">
                {isUnlocked ? (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <CheckCircle2 size={10} fill="currentColor" className="text-white" />
                        <span>Desbloqueada</span>
                    </div>
                ) : (
                    <div className="w-full h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#A8A29E] rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export const BadgesSection: React.FC<BadgesSectionProps> = ({ badges, userTotalXP }) => {
    return (
        <div className="mb-8 animate-in slide-in-from-bottom duration-700 delay-200">
            <div className="flex items-center gap-2 mb-4 px-1">
                <Medal size={14} className="text-[#A1887F]" />
                <h3 className="text-[#A1887F] font-bold text-[10px] uppercase tracking-wider">
                    Insignias Desbloqueables
                </h3>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-8 -mx-6 px-6 no-scrollbar snap-x snap-mandatory py-2">
                {badges.map((badge) => (
                    <div key={badge.id} className="snap-center shrink-0">
                        <BadgeCard
                            badge={badge}
                            isUnlocked={badge.unlocked}
                            userTotalXP={userTotalXP}
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
