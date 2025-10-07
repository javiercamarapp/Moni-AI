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
    <Card className={`p-4 border hover:scale-105 transition-all duration-300 ${
      safeSafeToSpend >= 0 
        ? 'bg-gradient-to-br from-emerald-900/60 via-emerald-950/70 to-green-950/60 border-emerald-800/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
        : 'bg-gradient-to-br from-rose-900/60 via-rose-950/70 to-red-950/60 border-rose-800/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            safeSafeToSpend >= 0
              ? 'bg-gradient-to-br from-emerald-800/40 to-green-900/40 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
              : 'bg-gradient-to-br from-rose-800/40 to-red-900/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
          }`}>
            <DollarSign className="w-5 h-5 text-white/90" />
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
          <span className="text-white/90 font-medium">${safeMonthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Gastos fijos</span>
          <span className="text-white/90 font-medium">-${safeFixedExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas de ahorro</span>
          <span className="text-white/90 font-medium">-${safeSavingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="border-t border-white/20 pt-2 flex justify-between font-semibold">
          <span className="text-white">Disponible</span>
          <span className="text-white">
            ${safeSafeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}