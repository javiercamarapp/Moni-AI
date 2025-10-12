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
}

export default function SafeToSpendWidget({
  monthlyIncome,
  fixedExpenses,
  budgetedExpenses,
  savingsGoals,
  actualExpenses,
  budgetExcesses,
  unbudgetedExpenses
}: SafeToSpendProps) {
  
  // Calcular el disponible para gastar
  // Por ahora: Ingresos - Gastos Totales - Metas de Ahorro
  // En el futuro: Se restará también los excesos de presupuesto y gastos no presupuestados
  const totalSpent = actualExpenses;
  const safeToSpend = monthlyIncome - totalSpent - savingsGoals;
  
  const percentageOfIncome = monthlyIncome > 0 ? (safeToSpend / monthlyIncome * 100) : 0;
  
  return (
    <Card 
      className="p-4 card-glow border-white/20"
      style={{ backgroundColor: '#96ff85' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-xs text-black/70">Seguro para gastar</p>
            <p className="text-2xl font-bold text-black">${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-black/70">Del ingreso mensual</p>
          <p className="text-lg font-semibold text-black">{percentageOfIncome.toFixed(0)}%</p>
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-black/70">
        <div className="flex justify-between">
          <span>Ingreso mensual</span>
          <span className="text-black font-medium">${monthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Gastos totales</span>
          <span className="text-black font-medium">-${totalSpent.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas de ahorro</span>
          <span className="text-black font-medium">-${savingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="border-t border-black/20 pt-2 flex justify-between font-semibold">
          <span className="text-black">Disponible</span>
          <span className="text-black font-bold">
            ${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}