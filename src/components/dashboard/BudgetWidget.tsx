import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
        <Card 
          className="p-4 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/budgets')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="text-base">📊</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Presupuesto</p>
              <p className="text-xs text-gray-500">Toca para configurar</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 mb-4">
      <Card 
        className="p-4 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer"
        onClick={() => navigate('/budgets')}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
            <span className="text-base">📊</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Presupuesto del mes</p>
              <span className={`text-xs font-semibold ${
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
              <span className="text-xs text-gray-500">
                ${currentExpenses.toLocaleString()} de ${totalBudget.toLocaleString()}
              </span>
              <span className={`text-xs ${
                isOverBudget ? 'text-red-500' : 'text-gray-500'
              }`}>
                {isOverBudget ? `+$${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()} disponible`}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
