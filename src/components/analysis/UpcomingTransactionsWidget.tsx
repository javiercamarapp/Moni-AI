import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface HistoricalAverages {
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  avgBalance: number;
  monthsAnalyzed: number;
  period: 'month' | 'year';
}

interface UpcomingTransactionsProps {
  transactions?: any[];
  periodDays?: number;
  historicalAverages?: HistoricalAverages;
}

export default function UpcomingTransactionsWidget({ historicalAverages }: UpcomingTransactionsProps) {
  if (!historicalAverages) return null;

  // Proyección anual basada en promedio mensual
  const projectedAnnualIncome = historicalAverages.avgMonthlyIncome * 12;
  const projectedAnnualExpenses = historicalAverages.avgMonthlyExpenses * 12;
  const projectedAnnualBalance = projectedAnnualIncome - projectedAnnualExpenses;

  // Helper to format values
  const formatK = (value: number): string => {
    return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Proyección Anual
            </p>
            <p className="text-xs text-muted-foreground">
              Basado en últimos 12 meses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <p className="text-[10px] text-emerald-700">Ingresos</p>
            <p className="text-sm font-bold text-emerald-800">
              {formatK(projectedAnnualIncome)}
            </p>
            <p className="text-[9px] text-emerald-600">esperados</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
            <p className="text-[10px] text-red-700">Gastos</p>
            <p className="text-sm font-bold text-red-800">
              {formatK(projectedAnnualExpenses)}
            </p>
            <p className="text-[9px] text-red-600">esperados</p>
          </div>
          <div className={`${projectedAnnualBalance >= 0 ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'} rounded-lg p-2 border`}>
            <p className="text-[10px] text-muted-foreground">Balance</p>
            <p className={`text-sm font-bold ${projectedAnnualBalance >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>
              {projectedAnnualBalance >= 0 ? '+' : ''}{formatK(projectedAnnualBalance)}
            </p>
            <p className={`text-[9px] ${projectedAnnualBalance >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>proyectado</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
