import React from 'react';
import { TrendingUp, TrendingDown, ChevronRight, Plus } from 'lucide-react';

interface StatCardProps {
    type: 'income' | 'expense';
    amount: number;
    onClick?: () => void;
    onAdd?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ type, amount, onClick, onAdd }) => {
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
            className={`bg-white rounded-[1.25rem] p-4 shadow-sm flex flex-row items-center justify-between border border-white/50 w-full hover:-translate-y-1 hover:shadow-md transition-all duration-300 group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-2">
                {onAdd && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                        className="w-8 h-8 rounded-full bg-[#F5F0EE] flex items-center justify-center hover:bg-[#8D6E63] hover:text-white text-[#5D4037] transition-all active:scale-95 shadow-sm"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                )}
                
                {onClick && (
                    <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#F5F0EE] group-hover:text-[#5D4037] transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#5D4037] transition-colors" strokeWidth={2.5} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
