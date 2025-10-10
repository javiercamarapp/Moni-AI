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
  // Fórmula: Ingresos - Gastos Fijos - Presupuesto - Metas de Ahorro - Excesos - Gastos No Presupuestados
  const baseAvailable = monthlyIncome - fixedExpenses - budgetedExpenses - savingsGoals;
  const safeToSpend = baseAvailable - budgetExcesses - unbudgetedExpenses;
  
  const percentageOfIncome = monthlyIncome > 0 ? (safeToSpend / monthlyIncome * 100) : 0;
  
  return (
    <Card 
      className={`p-4 card-glow border-white/20 ${
        safeToSpend >= 0 
          ? 'bg-gradient-to-br from-success/90 to-success/70' 
          : 'bg-gradient-to-br from-danger/90 to-danger/70'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/70">Seguro para gastar</p>
            <p className="text-2xl font-bold text-white">${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
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
          <span className="text-white font-medium">${monthlyIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Gastos fijos</span>
          <span className="text-white font-medium">-${fixedExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Presupuestado</span>
          <span className="text-white font-medium">-${budgetedExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas de ahorro</span>
          <span className="text-white font-medium">-${savingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        {(budgetExcesses > 0 || unbudgetedExpenses > 0) && (
          <>
            <div className="border-t border-white/30 pt-2" />
            {budgetExcesses > 0 && (
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Excesos presupuesto
                </span>
                <span className="text-white font-medium">-${budgetExcesses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            {unbudgetedExpenses > 0 && (
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Gastos no presupuestados
                </span>
                <span className="text-white font-medium">-${unbudgetedExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </>
        )}
        <div className="border-t border-white/20 pt-2 flex justify-between font-semibold">
          <span className="text-white">Disponible</span>
          <span className="text-white font-bold">
            ${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  );
}