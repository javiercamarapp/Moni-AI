import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BudgetProgressBarProps {
  spent: number;
  totalBudget: number;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ spent, totalBudget }) => {
  const navigate = useNavigate();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const percentage = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - spent;
  const isOverBudget = spent > totalBudget;

  return (
    <div 
      className="w-full cursor-pointer group"
      onClick={() => navigate('/budgets')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white/90">Presupuesto del mes</span>
        <div className="flex items-center gap-1 text-white/70 group-hover:text-white/90 transition-colors">
          <span className="text-xs">Ver detalle</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            isOverBudget ? 'bg-red-400' : percentage > 80 ? 'bg-amber-400' : 'bg-white/90'
          }`}
          style={{ width: `${percentage}%` }}
        />
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
      
      {/* Remaining/Over text */}
      <div className="text-center mt-0.5">
        {isOverBudget ? (
          <span className="text-[10px] text-red-300">
            Excedido por {formatCurrency(Math.abs(remaining))}
          </span>
        ) : (
          <span className="text-[10px] text-white/60">
            Te quedan {formatCurrency(remaining)} por gastar
          </span>
        )}
      </div>
    </div>
  );
};

export default BudgetProgressBar;
