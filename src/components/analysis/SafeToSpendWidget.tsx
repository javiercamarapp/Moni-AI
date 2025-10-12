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
      className={`p-4 shadow-xl rounded-[20px] border ${
        safeToSpend >= 0 
          ? 'bg-gradient-to-b from-green-50/50 to-white border-green-200' 
          : 'bg-gradient-to-b from-red-50/50 to-white border-red-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            safeToSpend >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <DollarSign className={`w-5 h-5 ${safeToSpend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <p className="text-xs text-foreground/70">Seguro para gastar</p>
            <p className={`text-2xl font-bold ${safeToSpend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/70">Del ingreso mensual</p>
          <p className={`text-lg font-semibold ${safeToSpend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {percentageOfIncome.toFixed(0)}%
          </p>
        </div>
      </div>
      
      <div className="space-y-2 text-xs text-foreground/70">
        <div className="flex justify-between">
          <span>Ingreso mensual</span>
          <span className="text-foreground font-medium">${monthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Gastos totales</span>
          <span className="text-foreground font-medium">-${totalSpent.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas de ahorro</span>
          <span className="text-foreground font-medium">-${savingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className={`border-t pt-2 flex justify-between font-semibold ${
          safeToSpend >= 0 ? 'border-green-200' : 'border-red-200'
        }`}>
          <span className="text-foreground">Disponible</span>
          <span className={`font-bold ${safeToSpend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}