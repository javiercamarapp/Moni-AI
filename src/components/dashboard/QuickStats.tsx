import React from 'react';
import { BarChart3, TrendingUp, Target, CreditCard } from 'lucide-react';
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
        const size = 20;
        const cls = "text-[#8D6E63] lg:w-6 lg:h-6"; // Warm coffee brown
        const strokeWidth = 2;

        switch (type) {
            case 'chart': return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'trend': return <TrendingUp size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'target': return <Target size={size} strokeWidth={strokeWidth} className={cls} />;
            case 'card': return <CreditCard size={size} strokeWidth={strokeWidth} className={cls} />;
            default: return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
        }
    };

    return (
        <div className="px-6 mb-8">
            <div className="grid grid-cols-4 gap-3">
                {stats.map((stat) => (
                    <div 
                        key={stat.id} 
                        className="bg-white rounded-2xl p-5 shadow-[0_8px_20px_-5px_rgba(0,0,0,0.1)] border border-white flex items-center justify-start gap-6 cursor-pointer hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all active:scale-95 duration-200"
                        onClick={() => navigate(stat.route)}
                    >
                        <div className="shrink-0">
                            {getIcon(stat.icon)}
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">{stat.label}</span>
                            <span className="text-[13px] font-bold text-gray-800 leading-none mt-0.5">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuickStats;
