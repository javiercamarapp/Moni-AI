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
    <Card className="p-4 bg-gradient-card card-glow border-white/20 hover:scale-105 transition-transform duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/70">Seguro para gastar</p>
            <p className="text-2xl font-bold text-white">${safeSafeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/70">Del ingreso mensual</p>
          <p className="text-lg font-semibold text-white">{percentageOfIncome.toFixed(0)}%</p>
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-white/70">
        <div className="flex justify-between">
          <span>Ingreso mensual</span>
          <span className="text-white font-medium">${safeMonthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Gastos fijos</span>
          <span className="text-white font-medium">-${safeFixedExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas de ahorro</span>
          <span className="text-white font-medium">-${safeSavingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="border-t border-white/20 pt-2 flex justify-between font-semibold">
          <span className="text-white">Disponible</span>
          <span className={`${safeSafeToSpend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${safeSafeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}