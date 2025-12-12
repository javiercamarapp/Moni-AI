import React from 'react';
import { useNavigate } from 'react-router-dom';
interface BudgetProgressBarProps {
  spent: number;
  totalBudget: number;
}
const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  totalBudget
}) => {
  const navigate = useNavigate();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  const percentage = totalBudget > 0 ? Math.min(spent / totalBudget * 100, 100) : 0;
  const remaining = totalBudget - spent;
  const isOverBudget = spent > totalBudget;
  return <div className="w-full cursor-pointer group" onClick={() => navigate('/budgets')}>
      {/* Header */}
      

      {/* Progress bar */}
      <div className="relative h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
        <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-400' : percentage > 80 ? 'bg-amber-400' : 'bg-white/90'}`} style={{
        width: `${percentage}%`
      }} />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-xs font-semibold ${isOverBudget ? 'text-red-300' : 'text-white'}`}>
          {formatCurrency(spent)}
        </span>
        <span className="text-xs text-white/70">
          {formatCurrency(totalBudget)}
        </span>
      </div>
      
      {/* Remaining/Over text - only show if over budget */}
      {isOverBudget && (
        <div className="text-center mt-0.5">
          <span className="text-[10px] text-red-300">
            Excedido por {formatCurrency(Math.abs(remaining))}
          </span>
        </div>
      )}
    </div>;
};
export default BudgetProgressBar;