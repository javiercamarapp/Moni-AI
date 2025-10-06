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
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-white">Safe to Spend</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-3xl font-bold text-white">
            ${safeSafeToSpend.toLocaleString('es-MX')}
          </p>
          <p className="text-xs text-white/70 mt-1">
            {percentageOfIncome.toFixed(0)}% de tu ingreso disponible
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/70">Ingresos</span>
            <span className="text-xs text-white font-medium">${safeMonthlyIncome.toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/70">Gastos fijos</span>
            <span className="text-xs text-red-300">-${safeFixedExpenses.toLocaleString('es-MX')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/70">Metas de ahorro</span>
            <span className="text-xs text-red-300">-${safeSavingsGoals.toLocaleString('es-MX')}</span>
          </div>
        </div>
        
        {safeSafeToSpend > 0 ? (
          <div className="flex items-start gap-2 p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <TrendingUp className="w-4 h-4 text-emerald-300 mt-0.5" />
            <p className="text-xs text-emerald-100">
              Puedes gastar libremente este monto sin afectar tus metas
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-2 bg-red-500/20 rounded-lg border border-red-500/30">
            <TrendingDown className="w-4 h-4 text-red-300 mt-0.5" />
            <p className="text-xs text-red-100">
              Tus gastos fijos y metas superan tus ingresos
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}