import { Progress } from "@/components/ui/progress";
import { Wallet } from "lucide-react";
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
      <div className="px-6 mb-4">
        <div 
          className="bg-white rounded-xl p-4 shadow-[0_8px_20px_-5px_rgba(0,0,0,0.06)] border border-gray-100/50 hover:shadow-[0_12px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all active:scale-[0.99] duration-200 cursor-pointer"
          onClick={() => navigate('/budgets')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 rounded-lg p-2">
              <Wallet size={20} strokeWidth={2} className="text-[#8D6E63]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Presupuesto</p>
              <p className="text-[11px] text-gray-500">Toca para configurar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 mb-4">
      <div 
        className="bg-white rounded-xl p-4 shadow-[0_8px_20px_-5px_rgba(0,0,0,0.06)] border border-gray-100/50 hover:shadow-[0_12px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all active:scale-[0.99] duration-200 cursor-pointer"
        onClick={() => navigate('/budgets')}
      >
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 rounded-lg p-2">
            <Wallet size={20} strokeWidth={2} className="text-[#8D6E63]" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Presupuesto del mes</p>
              <span className={`text-[11px] font-bold ${
                isOverBudget ? 'text-red-500' : 
                isWarning ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {percentUsed.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={Math.min(percentUsed, 100)} 
              className={`h-1.5 ${
                isOverBudget ? 'bg-red-100' : 
                isWarning ? 'bg-yellow-100' : 
                'bg-gray-100'
              }`}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">
                ${currentExpenses.toLocaleString()} / ${totalBudget.toLocaleString()}
              </span>
              <span className={`text-[10px] font-medium ${
                isOverBudget ? 'text-red-500' : 'text-gray-500'
              }`}>
                {isOverBudget ? `+$${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()} disponible`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
