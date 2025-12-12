import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Users, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Calculate proportions for compound bar
  const total = income + expenses;
  const incomePercent = total > 0 ? (income / total) * 100 : 50;
  const expensePercent = total > 0 ? (expenses / total) * 100 : 50;

  return (
    <div className="w-full bg-white rounded-2xl px-4 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
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

      {/* Compound Progress Bar - Income vs Expenses */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#5D4037]"></div>
            <span className="text-[10px] text-gray-600 font-medium">Ingresos</span>
            <span className="text-[10px] text-gray-800 font-bold">${income.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#D7CCC8]"></div>
            <span className="text-[10px] text-gray-600 font-medium">Gastos</span>
            <span className="text-[10px] text-gray-800 font-bold">${expenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-[#5D4037] transition-all duration-500"
            style={{ width: `${incomePercent}%` }}
          />
          <div 
            className="h-full bg-[#D7CCC8] transition-all duration-500"
            style={{ width: `${expensePercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-500">{incomePercent.toFixed(0)}%</span>
          <span className="text-[10px] text-gray-500">{expensePercent.toFixed(0)}%</span>
        </div>
      </div>

      <div className="space-y-2">
        {isExpanded && (
          <>
            {/* Savings */}
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <PiggyBank size={14} />
                </div>
                <span className="text-gray-600 text-xs font-medium">Ahorro Metas</span>
              </div>
              <span className="text-gray-800 font-bold text-sm">-${savings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
            </div>

            {/* Group Savings */}
            <div className="flex items-center justify-between animate-fade-in">
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
          </>
        )}

        {/* Available - Always visible with expand/collapse button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="flex items-center justify-between w-full hover:bg-gray-50 rounded-lg p-1 -mx-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-bold">Disponible</span>
            {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
          <span className={`text-lg font-extrabold ${available >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
            ${available.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </button>
      </div>

      {/* Add Transaction Modals */}
      <AddTransactionModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} mode="expense" />
      <AddTransactionModal isOpen={isAddIncomeOpen} onClose={() => setIsAddIncomeOpen(false)} mode="income" />
    </div>
  );
};

export default BalanceCard;