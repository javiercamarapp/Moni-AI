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
    <Card className={`p-4 border-2 hover:scale-105 transition-all duration-300 ${
      safeSafeToSpend >= 0 
        ? 'bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 border-emerald-400/50 shadow-[0_0_30px_rgba(34,197,94,0.6)]' 
        : 'bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 border-rose-400/50 shadow-[0_0_30px_rgba(239,68,68,0.6)]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            safeSafeToSpend >= 0
              ? 'bg-gradient-to-br from-emerald-300 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
              : 'bg-gradient-to-br from-rose-300 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
          }`}>
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/90">Seguro para gastar</p>
            <p className="text-2xl font-black text-white drop-shadow-lg">${safeSafeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/90">Del ingreso mensual</p>
          <p className="text-lg font-bold text-white drop-shadow-lg">{percentageOfIncome.toFixed(0)}%</p>
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-white/90">
        <div className="flex justify-between">
          <span>Ingreso mensual</span>
          <span className="text-white font-semibold">${safeMonthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Gastos fijos</span>
          <span className="text-white font-semibold">-${safeFixedExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas de ahorro</span>
          <span className="text-white font-semibold">-${safeSavingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="border-t-2 border-white/30 pt-2 flex justify-between font-bold">
          <span className="text-white drop-shadow-lg">Disponible</span>
          <span className="text-white drop-shadow-lg">
            ${safeSafeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}