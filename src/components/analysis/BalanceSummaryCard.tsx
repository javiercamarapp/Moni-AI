import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface BalanceSummaryCardProps {
    monthlyIncome: number;
    monthlyExpenses: number;
    availableBalance: number;
}

export const BalanceSummaryCard = ({
    monthlyIncome,
    monthlyExpenses,
    availableBalance
}: BalanceSummaryCardProps) => {
    const [animateStats, setAnimateStats] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimateStats(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Find max value to scale the bars (prevent overflow)
    const maxVal = Math.max(monthlyIncome, monthlyExpenses);

    return (
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border-b-4 border-stone-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-extrabold text-[#292524] tracking-tight hover:scale-105 transition-transform duration-300 origin-left cursor-default">
                    ${availableBalance.toLocaleString()}
                </h2>
                <p className="text-[#A8A29E] font-bold text-[10px] uppercase tracking-wider bg-stone-50 px-2 py-1 rounded-lg">
                    Balance Total
                </p>
            </div>

            <div className="flex gap-4">
                {/* Income Compact */}
                <div className="flex-1 group cursor-default">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#ecfccb] flex items-center justify-center group-hover:bg-[#d9f99d] transition-colors">
                            <ArrowDown size={12} className="text-[#65a30d]" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-bold text-[#78716C] uppercase">Ingresos</span>
                    </div>
                    <div className="text-sm font-extrabold text-[#292524] mb-1">
                        ${monthlyIncome.toLocaleString()}
                    </div>
                    <div className="h-1.5 w-full bg-[#F5F5F4] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#65a30d] rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                            style={{ width: animateStats ? `${(monthlyIncome / maxVal) * 100}%` : '0%' }}
                        ></div>
                    </div>
                </div>

                {/* Expenses Compact */}
                <div className="flex-1 group cursor-default">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#fee2e2] flex items-center justify-center group-hover:bg-[#fecaca] transition-colors">
                            <ArrowUp size={12} className="text-[#ef4444]" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-bold text-[#78716C] uppercase">Gastos</span>
                    </div>
                    <div className="text-sm font-extrabold text-[#292524] mb-1">
                        ${monthlyExpenses.toLocaleString()}
                    </div>
                    <div className="h-1.5 w-full bg-[#F5F5F4] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#ef4444] rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                            style={{ width: animateStats ? `${(monthlyExpenses / maxVal) * 100}%` : '0%' }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
