import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    type: 'income' | 'expense';
    amount: number;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ type, amount, onClick }) => {
    const isIncome = type === 'income';
    const Icon = isIncome ? TrendingUp : TrendingDown;
    const iconBg = isIncome ? 'bg-emerald-50' : 'bg-red-50';
    const iconColor = isIncome ? 'text-emerald-600' : 'text-red-600';
    const label = isIncome ? 'Ingresos' : 'Gastos';

    // Format with decimals
    const formattedAmount = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const [integerPart, decimalPart] = formattedAmount.split('.');

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-[1.25rem] p-4 shadow-sm flex flex-row items-center gap-3 border border-white/50 w-full hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
            </div>

            <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] font-bold leading-tight">{label}</span>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-[#5D4037] text-lg font-black tracking-tight leading-none">
                        {integerPart}
                    </span>
                    <span className="text-gray-500 text-[10px] font-bold opacity-60">
                        .{decimalPart}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
