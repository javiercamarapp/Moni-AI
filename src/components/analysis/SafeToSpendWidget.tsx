import { Card } from "@/components/ui/card";
import { DollarSign, AlertTriangle } from "lucide-react";

interface SafeToSpendProps {
  monthlyIncome: number;
  fixedExpenses: number;
  budgetedExpenses: number;
  savingsGoals: number;
  actualExpenses: number;
  budgetExcesses: number;
  unbudgetedExpenses: number;
  totalBudget?: number;
  goalsCount?: number;
}

export default function SafeToSpendWidget({
  monthlyIncome,
  fixedExpenses,
  budgetedExpenses,
  savingsGoals,
  actualExpenses,
  budgetExcesses,
  unbudgetedExpenses,
  totalBudget = 0,
  goalsCount = 0
}: SafeToSpendProps) {
  
  // Calcular el disponible para gastar
  // Fórmula: Ingreso mensual - Presupuesto mensual - Ahorro necesario para metas
  const safeToSpend = monthlyIncome - totalBudget - savingsGoals;
  
  const percentageOfIncome = monthlyIncome > 0 ? (safeToSpend / monthlyIncome * 100) : 0;
  
  return (
    <Card 
      className="p-5 bg-white backdrop-blur-sm rounded-[20px] shadow-xl border border-blue-100"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${safeToSpend >= 0 ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}>
            <DollarSign className={`w-5 h-5 ${safeToSpend >= 0 ? 'text-emerald-600' : 'text-destructive'}`} />
          </div>
          <div>
            <p className="text-xs text-foreground/80 font-medium">Seguro para gastar</p>
            <p className={`text-2xl font-bold ${safeToSpend >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
              ${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/80 font-medium">Del ingreso mensual</p>
          <p className="text-lg font-semibold text-foreground">{percentageOfIncome.toFixed(0)}%</p>
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-foreground/80">
        <div className="flex justify-between">
          <span>Ingreso mensual</span>
          <span className="text-foreground font-medium">${monthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Presupuesto mensual</span>
          <span className="text-foreground font-medium">${totalBudget.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas</span>
          <span className="text-foreground font-medium">{goalsCount}</span>
        </div>
        <div className="border-t border-blue-100 pt-2 flex justify-between font-semibold">
          <span className="text-foreground">Disponible</span>
          <span className={`font-bold ${safeToSpend >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
            ${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}