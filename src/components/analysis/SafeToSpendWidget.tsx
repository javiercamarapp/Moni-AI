import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
interface SafeToSpendProps {
  safeToSpend: number;
  monthlyIncome: number;
  fixedExpenses: number;
  savingsGoals: number;
}
export default function SafeToSpendWidget({
  safeToSpend,
  monthlyIncome,
  fixedExpenses,
  savingsGoals
}: SafeToSpendProps) {
  // Ensure all values have safe defaults
  const safeSafeToSpend = safeToSpend ?? 0;
  const safeMonthlyIncome = monthlyIncome ?? 0;
  const safeFixedExpenses = fixedExpenses ?? 0;
  const safeSavingsGoals = savingsGoals ?? 0;
  const percentageOfIncome = safeMonthlyIncome > 0 ? safeSafeToSpend / safeMonthlyIncome * 100 : 0;
  
  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Seguro para Gastar</h3>
        </div>
        <div className={`flex items-center gap-1 ${safeSafeToSpend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {safeSafeToSpend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-xs font-medium">{percentageOfIncome.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="text-center mb-3">
        <p className="text-4xl font-bold text-white">
          ${safeSafeToSpend.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-white/60 mt-1">
          {safeSafeToSpend >= 0 ? 'Disponible para gastar' : 'Sobregasto este mes'}
        </p>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-white/80">
          <span>Ingreso mensual:</span>
          <span className="font-medium">${safeMonthlyIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-white/80">
          <span>Gastos fijos:</span>
          <span className="font-medium">-${safeFixedExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-white/80">
          <span>Ahorro para metas:</span>
          <span className="font-medium">-${safeSavingsGoals.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </Card>
  );
}