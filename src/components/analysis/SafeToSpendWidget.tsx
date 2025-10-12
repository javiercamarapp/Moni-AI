import { Card } from "@/components/ui/card";
import { BorderRotate } from "@/components/ui/animated-gradient-border";
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
    <BorderRotate
      animationMode="auto-rotate"
      animationSpeed={3}
      gradientColors={{
        primary: safeToSpend >= 0 ? '#10b981' : '#ef4444',
        secondary: safeToSpend >= 0 ? '#34d399' : '#f87171',
        accent: safeToSpend >= 0 ? '#6ee7b7' : '#fca5a5'
      }}
      backgroundColor={safeToSpend >= 0 ? 'hsl(150, 40%, 20%)' : 'hsl(0, 45%, 25%)'}
      borderWidth={3}
      borderRadius={12}
      className="hover:scale-105 hover:-translate-y-2 transition-all duration-300"
    >
      <Card 
        className={`p-4 border-0 ${
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
          <span>Gastos totales</span>
          <span className="text-white font-medium">-${totalSpent.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Metas de ahorro</span>
          <span className="text-white font-medium">-${savingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="border-t border-white/20 pt-2 flex justify-between font-semibold">
          <span className="text-white">Disponible</span>
          <span className="text-white font-bold">
            ${safeToSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </Card>
  </BorderRotate>
  );
}