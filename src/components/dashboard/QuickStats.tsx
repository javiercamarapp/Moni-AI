import React from 'react';
import { BarChart3, TrendingUp, Target, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickStatsProps {
    summaryValue?: string;
    netWorthValue?: string;
    goalsCount?: number;
    budgetValue?: string;
}

const QuickStats: React.FC<QuickStatsProps> = ({
    summaryValue = "$0",
    netWorthValue = "$0",
    goalsCount = 0,
    budgetValue = "$0"
}) => {
    const navigate = useNavigate();

    const stats = [
        { id: '1', label: 'RESUMEN', value: summaryValue, icon: 'chart', route: '/balance' },
        { id: '2', label: 'PATRIMONIO', value: netWorthValue, icon: 'trend', route: '/net-worth' },
        { id: '3', label: 'METAS', value: goalsCount.toString(), icon: 'target', route: '/goals' },
        { id: '4', label: 'PRESUPUESTO', value: budgetValue, icon: 'card', route: '/budgets' },
    ];

    const getIcon = (type: string) => {
        const cls = "text-[#8D6E63]";
        const size = 20;
        const strokeWidth = 2;

        switch (type) {
            case 'chart': return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'trend': return <TrendingUp size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'target': return <Target size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'card': return <Wallet size={size} strokeWidth={strokeWidth} className={cls} />;
            default: return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
        }
    };

    return (
        <div className="px-6 mb-4">
            <div className="grid grid-cols-4 gap-3">
                {stats.map((stat) => (
                    <div 
                        key={stat.id} 
                        className="flex flex-col items-center gap-1.5 cursor-pointer group"
                        onClick={() => navigate(stat.route)}
                    >
                        {/* Icon Box */}
                        <div className="bg-white rounded-xl p-3 shadow-[0_8px_20px_-5px_rgba(0,0,0,0.06)] border border-gray-100/50 group-hover:shadow-[0_12px_25px_-5px_rgba(0,0,0,0.1)] group-hover:-translate-y-0.5 transition-all active:scale-95 duration-200">
                            {getIcon(stat.icon)}
                        </div>
                        
                        {/* Label - Outside box */}
                        <span className="text-[9px] font-semibold text-gray-500 tracking-wide uppercase leading-tight text-center">{stat.label}</span>

                        {/* Value - Outside box */}
                        <span className="text-[11px] font-bold text-gray-800 leading-none">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuickStats;