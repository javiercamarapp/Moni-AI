import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat, Coffee, Sparkles } from 'lucide-react';

interface ExpenseBreakdownWidgetProps {
    subscriptionsTotal: number;
    subscriptionsCount: number;
    dailyExpenses: number;
}

const ExpenseBreakdownWidget: React.FC<ExpenseBreakdownWidgetProps> = ({
    subscriptionsTotal,
    subscriptionsCount,
    dailyExpenses
}) => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-2 gap-3 px-6 mb-6">
            {/* Suscripciones Card - Compact & Innovative */}
            <div 
                className="bg-white rounded-[1.75rem] p-4 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/subscriptions')}
            >
                {/* Subtle gradient accent for depth */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#8D6E63]/10 to-transparent rounded-bl-[3rem] -z-0 opacity-60"></div>

                <div className="flex justify-between items-start z-10 mb-3">
                    <div className="h-9 w-9 rounded-2xl bg-[#F5F0EE] flex items-center justify-center text-[#8D6E63] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                        <Repeat size={16} strokeWidth={2.5} />
                    </div>
                    {/* Minimalist AI Badge with Glass effect */}
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                        <Sparkles size={8} className="text-emerald-500 fill-emerald-500" />
                        <span className="text-[9px] font-bold text-gray-500">{subscriptionsCount}</span>
                    </div>
                </div>
                
                <div className="z-10">
                    <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Suscripciones</h3>
                    <div className="text-xl font-black text-gray-800 tracking-tight leading-none">
                        ${subscriptionsTotal.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>

            {/* Gastos Cotidianos Card - Compact & Innovative */}
            <div 
                className="bg-white rounded-[1.75rem] p-4 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/daily-expenses')}
            >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#8D6E63]/10 to-transparent rounded-bl-[3rem] -z-0 opacity-60"></div>

                <div className="flex justify-between items-start z-10 mb-3">
                    <div className="h-9 w-9 rounded-2xl bg-[#F5F0EE] flex items-center justify-center text-[#8D6E63] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                        <Coffee size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                        <Sparkles size={8} className="text-emerald-500 fill-emerald-500" />
                        <span className="text-[9px] font-bold text-gray-500">Hoy</span>
                    </div>
                </div>
                
                <div className="z-10">
                    <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Gastos Cotidianos</h3>
                    <div className="text-xl font-black text-gray-800 tracking-tight leading-none">
                        ${dailyExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseBreakdownWidget;
