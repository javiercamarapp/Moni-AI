import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface SafeToSpendProps {
  safeToSpend: number;
  monthlyIncome: number;
  fixedExpenses: number;
  savingsGoals: number;
}

export default function SafeToSpendWidget({ safeToSpend, monthlyIncome, fixedExpenses, savingsGoals }: SafeToSpendProps) {
  const percentageOfIncome = monthlyIncome > 0 ? (safeToSpend / monthlyIncome) * 100 : 0;
  
  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur border-white/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70 mb-1">💰 Disponible Hoy</p>
            <p className="text-sm text-white/60">Safe-to-Spend</p>
          </div>
          <DollarSign className="h-8 w-8 text-emerald-300" />
        </div>
        
        <div>
          <p className="text-4xl font-bold text-white">
            ${(safeToSpend / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-white/60 mt-1">
            {percentageOfIncome.toFixed(0)}% de tu ingreso
          </p>
        </div>

        <div className="pt-2 border-t border-white/20 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">Ingreso</span>
            <span className="text-emerald-300">${(monthlyIncome / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/70">− Gastos fijos</span>
            <span className="text-orange-300">${(fixedExpenses / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/70">− Apartados/metas</span>
            <span className="text-purple-300">${(savingsGoals / 1000).toFixed(1)}k</span>
          </div>
        </div>

        {safeToSpend < 0 && (
          <div className="bg-red-500/20 rounded px-2 py-1">
            <p className="text-xs text-red-200">⚠️ Gastos superan ingresos</p>
          </div>
        )}
      </div>
    </Card>
  );
}
