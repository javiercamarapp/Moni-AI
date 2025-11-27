import React from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Users } from 'lucide-react';

interface BalanceCardProps {
    income: number;
    expenses: number;
    savings: number;
    groupSavings: number;
    available: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
    income,
    expenses,
    savings,
    groupSavings,
    available
}) => {
    return (
        <div className="w-full bg-white rounded-[2rem] p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-[#F5F0EE] flex items-center justify-center text-[#8D6E63]">
                    <Wallet size={20} />
                </div>
                <div>
                    <h3 className="text-gray-800 font-bold text-base leading-tight">Balance de este mes</h3>
                    <p className="text-gray-400 text-[10px] font-medium">Resumen financiero</p>
                </div>
            </div>

            <div className="space-y-2">
                {/* Income */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <TrendingUp size={14} />
                        </div>
                        <span className="text-gray-600 text-xs font-medium">Ingresos</span>
                    </div>
                    <span className="text-gray-800 font-bold text-sm">${income.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>

                {/* Expenses */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                            <TrendingDown size={14} />
                        </div>
                        <span className="text-gray-600 text-xs font-medium">Gastos</span>
                    </div>
                    <span className="text-gray-800 font-bold text-sm">-${expenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>

                {/* Savings */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <PiggyBank size={14} />
                        </div>
                        <span className="text-gray-600 text-xs font-medium">Ahorro Metas</span>
                    </div>
                    <span className="text-gray-800 font-bold text-sm">-${savings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>

                {/* Group Savings */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Users size={14} />
                        </div>
                        <span className="text-gray-600 text-xs font-medium">Metas Grupales</span>
                    </div>
                    <span className="text-gray-800 font-bold text-sm">-${groupSavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 my-2"></div>

                {/* Available */}
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-bold">Disponible</span>
                    <span className={`text-lg font-extrabold ${available >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                        ${available.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BalanceCard;
