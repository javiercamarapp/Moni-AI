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
    <Card className="p-6 bg-gradient-card card-glow border-white/20">
      <div className="text-center mb-4">
        <p className="text-sm text-white/80 mb-2">Puedes gastar</p>
        <div className="relative inline-block">
          <div className="text-5xl font-bold text-white">
            ${Math.abs(safeSafeToSpend).toLocaleString('es-MX')}
          </div>
          {safeSafeToSpend > 0 ? (
            <div className="absolute -top-2 -right-8">
              <TrendingUp className="w-6 h-6 text-emerald-300" />
            </div>
          ) : (
            <div className="absolute -top-2 -right-8">
              <TrendingDown className="w-6 h-6 text-red-300" />
            </div>
          )}
        </div>
        <p className="text-xs text-white/70 mt-2">
          sin comprometer tus metas
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 rounded-lg bg-white/10">
          <p className="text-2xl text-white font-bold">${(safeMonthlyIncome / 1000).toFixed(0)}k</p>
          <p className="text-xs text-white/70 mt-1">Ingresos</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/10">
          <p className="text-2xl text-red-300 font-bold">${(safeFixedExpenses / 1000).toFixed(0)}k</p>
          <p className="text-xs text-white/70 mt-1">Fijos</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/10">
          <p className="text-2xl text-yellow-300 font-bold">${(safeSavingsGoals / 1000).toFixed(0)}k</p>
          <p className="text-xs text-white/70 mt-1">Metas</p>
        </div>
      </div>
    </Card>
  );
}