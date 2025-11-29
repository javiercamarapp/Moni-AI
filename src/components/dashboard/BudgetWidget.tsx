import { PieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BudgetWidgetProps {
  totalBudget: number;
  currentExpenses: number;
}

export default function BudgetWidget({ totalBudget, currentExpenses }: BudgetWidgetProps) {
  const navigate = useNavigate();

  const percentUsed = totalBudget > 0 ? (currentExpenses / totalBudget) * 100 : 0;
  const remaining = totalBudget - currentExpenses;
  const isOverBudget = remaining < 0;
  const isWarning = percentUsed >= 80;

  // Si no hay presupuesto configurado
  if (totalBudget === 0) {
    return (
      <div
        className="rounded-2xl p-1 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.08)] border bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200/50 cursor-pointer hover:-translate-y-0.5 transition-all"
        onClick={() => navigate('/budgets')}
      >
        <div className="flex items-center gap-3 p-2 pr-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 bg-purple-100 border border-purple-200">
            <PieChart size={16} strokeWidth={2} className="text-purple-600" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-xs font-bold text-purple-800">Configura tu presupuesto</h3>
            <p className="text-[10px] leading-tight text-purple-600">Toca para controlar tus gastos mensuales</p>
          </div>
        </div>
      </div>
    );
  }

  // Color logic: green < 80%, yellow 80-100%, red > 100%
  const getStatusColor = () => {
    if (isOverBudget) return { icon: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-600', progress: 'bg-red-500' };
    if (isWarning) return { icon: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-600', progress: 'bg-amber-500' };
    return { icon: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-600', progress: 'bg-emerald-500' };
  };

  const colors = getStatusColor();

  return (
    <div
      className="rounded-2xl p-1 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.08)] border border-gray-100 bg-white cursor-pointer hover:-translate-y-0.5 transition-all h-full flex items-center"
      onClick={() => navigate('/budgets')}
    >
      <div className="flex items-center gap-3 p-2 pr-3 w-full">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${colors.bg} border ${colors.border}`}>
          <PieChart size={16} strokeWidth={2} className={colors.icon} />
        </div>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800">
              Presupuesto del mes
            </h3>
            <span className={`text-[10px] font-bold ${colors.text}`}>
              {percentUsed.toFixed(0)}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${colors.progress} rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">
              <span className={`font-semibold ${colors.text}`}>${currentExpenses.toLocaleString()}</span>
              <span className="text-gray-400"> / ${totalBudget.toLocaleString()}</span>
            </span>
            <span className={`text-[10px] font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-500'}`}>
              {isOverBudget ? `Excedido $${Math.abs(remaining).toLocaleString()}` : `Quedan $${remaining.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
