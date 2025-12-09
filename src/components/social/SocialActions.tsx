import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LifeBuoy, TrendingUp, Trophy } from 'lucide-react';

interface SocialActionsProps {
    onNavigate?: (id: string) => void;
    activeChallengesCount?: number;
    friendsCount?: number;
}

export const SocialActions: React.FC<SocialActionsProps> = ({ onNavigate, activeChallengesCount = 0, friendsCount = 0 }) => {
    const navigate = useNavigate();

    const actions = [
        { id: 'amigos', label: 'AMIGOS', value: friendsCount.toString(), icon: Users, route: '/amigos' },
        { id: 'circulos', label: 'CÍRCULOS', value: '3', icon: LifeBuoy, route: '/groups' },
        { id: 'stats', label: 'STATS', value: 'Ver', icon: TrendingUp, route: '/social-stats' },
        { id: 'retos', label: 'RETOS', value: `${activeChallengesCount} activo${activeChallengesCount !== 1 ? 's' : ''}`, icon: Trophy, route: '/challenges' }
    ];

    return (
        <div className="grid grid-cols-4 gap-3 mt-6">
            {actions.map((item) => (
                <button
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    className="flex flex-col items-center group"
                >
                    {/* Square Button - White with Coffee Border/Shadow hints */}
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border-b-4 border-[#E7E5E4] flex items-center justify-center mb-2 transition-all duration-300 active:scale-95 group-hover:border-[#D7CCC8] group-hover:bg-[#FFF7ED] group-hover:-translate-y-1">
                        <item.icon size={20} className="text-[#8D6E63] group-hover:text-[#5D4037] transition-colors" strokeWidth={2.5} />
                    </div>

                    {/* Label */}
                    <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-tight mb-0.5 group-hover:text-[#8D6E63] transition-colors">
                        {item.label}
                    </span>

                    {/* Value */}
                    <span className="text-xs font-black text-[#44403C] group-hover:text-[#292524]">
                        {item.value}
                    </span>
                </button>
            ))}
        </div>
    );
};
