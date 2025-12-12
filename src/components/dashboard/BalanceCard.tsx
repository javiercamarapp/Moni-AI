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

      {/* Single Compound Bar - Income vs Expenses as one seamless bar */}
      <div className="mb-3">
        <div className="h-4 rounded-full overflow-hidden flex w-full">
          <div 
            className="h-full bg-[#5D4037] rounded-l-full"
            style={{ width: `${incomePercent}%` }}
          />
          <div 
            className="h-full bg-[#BCAAA4] rounded-r-full"
            style={{ width: `${expensePercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <button 
            onClick={() => navigate('/ingresos')}
            className="flex items-center gap-1.5 hover:bg-gray-50 rounded-lg px-2 py-1 -ml-2 transition-colors group"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#5D4037]"></div>
            <span className="text-xs text-gray-800 font-bold group-hover:text-[#5D4037]">${income.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
            <TrendingUp size={12} className="text-gray-400 group-hover:text-[#5D4037]" />
          </button>
          <button 
            onClick={() => navigate('/gastos')}
            className="flex items-center gap-1.5 hover:bg-gray-50 rounded-lg px-2 py-1 -mr-2 transition-colors group"
          >
            <TrendingDown size={12} className="text-gray-400 group-hover:text-[#BCAAA4]" />
            <span className="text-xs text-gray-800 font-bold group-hover:text-[#5D4037]">${expenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#BCAAA4]"></div>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {isExpanded && (
          <>
            {/* Minimal savings display - icons and values only */}
            <div className="flex items-center justify-center gap-6 py-1 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <PiggyBank size={12} />
                </div>
                <span className="text-gray-800 font-bold text-xs">-${savings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users size={12} />
                </div>
                <span className="text-gray-800 font-bold text-xs">-${groupSavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <div className="h-px bg-gray-100 my-1"></div>
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