import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Users, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import AddTransactionModal from './AddTransactionModal';
interface BalanceCardProps {
  income: number;
  expenses: number;
  savings: number;
  groupSavings: number;
  available: number;
  defaultExpanded?: boolean;
}
const BalanceCard: React.FC<BalanceCardProps> = ({
  income,
  expenses,
  savings,
  groupSavings,
  available,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const navigate = useNavigate();
  return <div className="w-full bg-white rounded-2xl px-4 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-[#F5F0EE] flex items-center justify-center text-[#8D6E63]">
                        <Wallet size={16} />
                    </div>
                    <div>
                        <h3 className="text-gray-800 font-bold text-sm leading-tight">Balance del mes</h3>
                    </div>
                </div>

                
            </div>

            <div className="space-y-2">
                {isExpanded && <>
                        {/* Income */}
                        <div className="flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <TrendingUp size={14} />
                                </div>
                                <span className="text-gray-600 text-xs font-medium">Ingresos</span>
                            </div>
                            <span className="text-gray-800 font-bold text-sm">${income.toLocaleString('es-MX', {
              maximumFractionDigits: 0
            })}</span>
                        </div>

                        {/* Expenses */}
                        <div className="flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                    <TrendingDown size={14} />
                                </div>
                                <span className="text-gray-600 text-xs font-medium">Gastos</span>
                            </div>
                            <span className="text-gray-800 font-bold text-sm">-${expenses.toLocaleString('es-MX', {
              maximumFractionDigits: 0
            })}</span>
                        </div>

                        {/* Savings */}
                        <div className="flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <PiggyBank size={14} />
                                </div>
                                <span className="text-gray-600 text-xs font-medium">Ahorro Metas</span>
                            </div>
                            <span className="text-gray-800 font-bold text-sm">-${savings.toLocaleString('es-MX', {
              maximumFractionDigits: 0
            })}</span>
                        </div>

                        {/* Group Savings */}
                        <div className="flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Users size={14} />
                                </div>
                                <span className="text-gray-600 text-xs font-medium">Metas Grupales</span>
                            </div>
                            <span className="text-gray-800 font-bold text-sm">-${groupSavings.toLocaleString('es-MX', {
              maximumFractionDigits: 0
            })}</span>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 my-2"></div>
                    </>}

                {/* Available - Always visible with expand/collapse button */}
                <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-between w-full hover:bg-gray-50 rounded-lg p-1 -mx-2 transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-bold">Disponible</span>
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                    <span className={`text-lg font-extrabold ${available >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                        ${available.toLocaleString('es-MX', {
            maximumFractionDigits: 0
          })}
                    </span>
                </button>
            </div>

            {/* Add Transaction Modals */}
            <AddTransactionModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} mode="expense" />
            <AddTransactionModal isOpen={isAddIncomeOpen} onClose={() => setIsAddIncomeOpen(false)} mode="income" />
        </div>;
};
export default BalanceCard;