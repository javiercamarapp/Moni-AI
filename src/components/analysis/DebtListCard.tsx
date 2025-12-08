import { CreditCard, Home, TrendingDown, ArrowRight } from 'lucide-react';

interface DebtItem {
    id: string;
    name: string;
    type: 'card' | 'loan' | 'mortgage';
    bank: string;
    balance: number;
    limit: number;
    apr?: string;
}

interface DebtListCardProps {
    debts: DebtItem[];
    totalDebt: number;
}

export const DebtListCard = ({ debts, totalDebt }: DebtListCardProps) => {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
                <TrendingDown size={14} className="text-[#A8A29E]" />
                <h3 className="text-[#A8A29E] font-bold text-[10px] uppercase tracking-wider">Endeudamiento</h3>
            </div>

            <div className="bg-white rounded-[2rem] p-5 shadow-sm border-b-4 border-stone-100">
                {debts.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className="w-16 h-16 rounded-full bg-[#F5F5F4] flex items-center justify-center mb-4">
                            <CreditCard size={28} className="text-[#A8A29E]" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-bold text-[#292524] mb-2">Sin deudas registradas</h3>
                        <p className="text-sm text-[#78716C] text-center max-w-xs">
                            No tienes tarjetas de crédito o préstamos registrados en este momento.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Total Debt Header */}
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <p className="text-[#78716C] font-bold text-[10px] uppercase tracking-wider mb-1">Deuda Total</p>
                                <h2 className="text-2xl font-black text-[#292524] tracking-tight">
                                    ${totalDebt.toLocaleString()}
                                </h2>
                            </div>
                            <div className="bg-[#FFF7ED] px-3 py-1 rounded-full border border-[#FFEDD5]">
                                <p className="text-[10px] font-bold text-[#C2410C]">
                                    {debts.length} Pasivo{debts.length !== 1 ? 's' : ''} activo{debts.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Debt List */}
                        <div className="space-y-4">
                            {debts.map((debt) => {
                                const percentage = Math.min(100, (debt.balance / debt.limit) * 100);

                                // Color logic based on utilization
                                let barColor = 'bg-[#65a30d]'; // Green/Safe
                                if (percentage > 30) barColor = 'bg-[#f59e0b]'; // Amber/Warning
                                if (percentage > 70) barColor = 'bg-[#ef4444]'; // Red/Danger
                                if (debt.type === 'mortgage') barColor = 'bg-[#78716C]'; // Stone for mortgage

                                const Icon = debt.type === 'mortgage' ? Home : CreditCard;

                                return (
                                    <div key={debt.id} className="group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#F5F5F4] flex items-center justify-center text-[#57534E]">
                                                    <Icon size={14} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-[#292524] leading-tight">{debt.name}</h4>
                                                    <p className="text-[10px] font-medium text-[#A8A29E]">
                                                        {debt.bank} {debt.apr && `• ${debt.apr}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#292524]">${debt.balance.toLocaleString()}</p>
                                                <p className="text-[9px] font-medium text-[#A8A29E]">de ${debt.limit.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative pt-1">
                                            <div className="h-2 w-full bg-[#F5F5F4] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Action */}
                        <button className="w-full mt-6 py-3 rounded-xl border border-stone-100 bg-[#FAFAF9] flex items-center justify-center gap-2 text-xs font-bold text-[#57534E] hover:bg-[#F5F5F4] transition-colors">
                            <span>Ver desglose de intereses</span>
                            <ArrowRight size={12} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
