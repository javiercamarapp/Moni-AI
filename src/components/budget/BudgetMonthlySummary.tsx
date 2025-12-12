import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BudgetMonthlySummaryProps {
    totalBudget: number;
    totalSpent: number;
    onOpenBudget: () => void;
    onOpenSpent: () => void;
}

const BudgetMonthlySummary: React.FC<BudgetMonthlySummaryProps> = ({
    totalBudget,
    totalSpent,
    onOpenBudget,
    onOpenSpent
}) => {
    const available = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Format number to short form (e.g., 95000 -> $95k)
    const formatShort = (num: number) => {
        if (num >= 1000) {
            return `$${(num / 1000).toFixed(0)}k`;
        }
        return `$${num.toLocaleString()}`;
    };

    return (
        <div className="w-full px-6 mt-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(93,64,55,0.08)] transition-all duration-300">

                {/* Subtle decorative background */}
                <div className="absolute -right-4 -top-12 w-32 h-32 bg-[#5D4037] opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-[10px] font-bold text-[#8D6E63] uppercase tracking-widest mb-3">Resumen del Mes</h2>

                    <div className="flex items-center justify-between mb-5">
                        {/* Left: Available Amount */}
                        <div className="flex flex-col">
                            <span className="text-4xl font-black text-[#5D4037] tracking-tight">
                                ${available.toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-[#5D4037]/60 mt-0.5">Disponible</span>
                        </div>

                        {/* Right: Stacked Buttons */}
                        <div className="flex flex-col gap-2 w-[140px]">
                            {/* Budget Button */}
                            <button
                                onClick={onOpenBudget}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-[#5D4037] text-white shadow-md shadow-[#5D4037]/20 hover:shadow-[#5D4037]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 group/btn w-full"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[9px] font-bold text-white/70 uppercase">Presupuestado</span>
                                    <span className="text-sm font-bold text-white leading-none mt-0.5">{formatShort(totalBudget)}</span>
                                </div>
                                <ChevronRight size={14} className="text-white/50" />
                            </button>

                            {/* Spent Button */}
                            <button
                                onClick={onOpenSpent}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-[#8D6E63] text-white shadow-md shadow-[#8D6E63]/20 hover:shadow-[#8D6E63]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 w-full"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[9px] font-bold text-white/70 uppercase">Gastado</span>
                                    <span className="text-sm font-bold text-white leading-none mt-0.5">{formatShort(totalSpent)}</span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar Visual - Coffee Tones */}
                    <div className="w-full h-3 bg-[#EFEBE9] rounded-full overflow-hidden border border-stone-50">
                        <div
                            className="h-full bg-gradient-to-r from-[#8D6E63] to-[#5D4037] rounded-full shadow-[0_0_10px_rgba(93,64,55,0.4)] transition-all duration-1000"
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetMonthlySummary;
