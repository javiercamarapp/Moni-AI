import { Progress } from "@/components/ui/progress";
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

  return (
    <div
      className={`rounded-2xl p-1 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.08)] border cursor-pointer hover:-translate-y-0.5 transition-all ${isOverBudget
          ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200/50'
          : isWarning
            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200/50'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50'
        }`}
      onClick={() => navigate('/budgets')}
    >
      <div className="flex items-center gap-3 p-2 pr-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${isOverBudget
            ? 'bg-red-100 border border-red-200'
            : isWarning
              ? 'bg-yellow-100 border border-yellow-200'
              : 'bg-green-100 border border-green-200'
          }`}>
          <PieChart size={16} strokeWidth={2} className={
            isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
          } />
        </div>

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold ${isOverBudget ? 'text-red-800' : isWarning ? 'text-yellow-800' : 'text-green-800'
              }`}>
              Presupuesto del mes
            </h3>
            <span className={`text-[10px] font-bold ${isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
              }`}>
              {percentUsed.toFixed(0)}%
            </span>
          </div>

          <Progress
            value={Math.min(percentUsed, 100)}
            className={`h-1 ${isOverBudget ? 'bg-red-200' : isWarning ? 'bg-yellow-200' : 'bg-green-200'
              }`}
          />

          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
              }`}>
              ${currentExpenses.toLocaleString()} / ${totalBudget.toLocaleString()}
            </span>
            <span className={`text-[10px] font-medium ${isOverBudget ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-green-700'
              }`}>
              {isOverBudget ? `Excedido $${Math.abs(remaining).toLocaleString()}` : `Quedan $${remaining.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
