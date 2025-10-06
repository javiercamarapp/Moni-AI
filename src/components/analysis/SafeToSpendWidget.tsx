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
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  const daysLeft = Math.ceil((endOfMonth.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-600/90 to-emerald-800/90 card-glow border-emerald-500/30 hover:scale-105 transition-transform duration-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-200/70 mb-1">💰 Disponible para Gastar</p>
            <p className="text-[10px] text-emerald-200/60">Safe-to-Spend</p>
          </div>
          <DollarSign className="h-8 w-8 text-emerald-300" />
        </div>
        
        <div>
          <p className="text-4xl font-bold text-white">
            ${(safeToSpend / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-emerald-200 mt-1">
            Tienes disponibles <span className="font-bold">${safeToSpend.toLocaleString()}</span> para gastar hasta fin de mes sin afectar tu meta de ahorro.
          </p>
        </div>

        <div className="pt-2 border-t border-emerald-400/20 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-200/70">Ingreso mensual</span>
            <span className="text-emerald-300 font-medium">+${(monthlyIncome / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-200/70">− Gastos fijos</span>
            <span className="text-orange-300 font-medium">${(fixedExpenses / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-200/70">− Ahorro meta</span>
            <span className="text-purple-300 font-medium">${(savingsGoals / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-emerald-400/20">
            <span className="text-emerald-200 font-medium">= Disponible</span>
            <span className="text-white font-bold">${(safeToSpend / 1000).toFixed(1)}k</span>
          </div>
        </div>

        <div className="bg-emerald-500/20 rounded px-3 py-2 border border-emerald-400/30">
          <p className="text-[10px] text-emerald-100 leading-snug">
            📊 {percentageOfIncome.toFixed(0)}% de tu ingreso • Quedan {daysLeft} días del mes
          </p>
        </div>

        {safeToSpend < 0 && (
          <div className="bg-red-500/20 rounded px-3 py-2 border border-red-500/30">
            <p className="text-xs text-red-200 leading-snug">
              ⚠️ <span className="font-medium">Alerta:</span> Gastos superan ingresos disponibles
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
