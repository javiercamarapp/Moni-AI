import React from 'react';
import { BarChart3, TrendingUp, Target, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickStatsProps {
    summaryValue?: string;
    netWorthValue?: string;
    goalsCount?: number;
    journeyLevel?: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({
    summaryValue = "$0",
    netWorthValue = "$0",
    goalsCount = 0,
    journeyLevel = 0
}) => {
    const navigate = useNavigate();

    // Format journey level with K for thousands
    const formatJourneyLevel = (level: number) => {
        if (level >= 1000) {
            return `Nv.${(level / 1000).toFixed(1).replace(/\.0$/, '')}K`;
        }
        return `Nv.${level}`;
    };

    const stats = [
        { id: '1', label: 'GASTOS/INGRESOS', value: summaryValue, icon: 'chart', route: '/balance' },
        { id: '2', label: 'PATRIMONIO', value: netWorthValue, icon: 'trend', route: '/net-worth' },
        { id: '3', label: 'METAS', value: goalsCount.toString(), icon: 'target', route: '/goals' },
        { id: '4', label: 'JOURNEY', value: formatJourneyLevel(journeyLevel), icon: 'rocket', route: '/financial-journey' },
    ];

    const getIcon = (type: string) => {
        const cls = "text-[#8D6E63]";
        const size = 20;
        const strokeWidth = 2;

        switch (type) {
            case 'chart': return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'trend': return <TrendingUp size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'target': return <Target size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'rocket': return <Rocket size={size} strokeWidth={strokeWidth} className={cls} />;
            default: return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
        }
    };

    return (
        <div className="px-6 mb-4">
            <div className="grid grid-cols-4 gap-3 lg:gap-6">
                {stats.map((stat) => (
                    <button
                        key={stat.id}
                        className="flex flex-col items-center gap-1.5 group outline-none"
                        onClick={() => navigate(stat.route)}
                    >
                        {/* Icon Box - Card Style matching app design */}
                        <div className="bg-white rounded-2xl px-5 py-3 lg:px-10 lg:py-5 shadow-md border border-gray-100/50 group-hover:shadow-lg group-hover:-translate-y-1 group-active:shadow-sm group-active:translate-y-0 transition-all duration-200 w-full flex items-center justify-center">
                            {getIcon(stat.icon)}
                        </div>

                        {/* Label - Outside box */}
                        {stat.id === '1' ? (
                            <span className="text-[9px] lg:text-[10px] font-semibold text-gray-500 tracking-wide uppercase leading-tight text-center">
                                <span className="inline lg:hidden">Resumen</span>
                                <span className="hidden lg:inline">Gastos / ingresos</span>
                            </span>
                        ) : (
                            <span className="text-[9px] lg:text-[10px] font-semibold text-gray-500 tracking-wide uppercase leading-tight text-center">{stat.label}</span>
                        )}

                        {/* Value - Outside box */}
                        <span className="text-[11px] lg:text-xs font-bold text-gray-800 leading-none">{stat.value}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickStats;