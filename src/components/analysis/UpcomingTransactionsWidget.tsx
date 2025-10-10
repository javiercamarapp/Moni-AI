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
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Proyección Anual
            </p>
            <p className="text-xs text-white/60">
              Basado en últimos {historicalAverages.monthsAnalyzed} meses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
            <p className="text-[10px] text-white/70">Ingresos</p>
            <p className="text-sm font-bold text-emerald-300">
              {formatK(projectedAnnualIncome)}
            </p>
            <p className="text-[9px] text-white/50">esperados</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
            <p className="text-[10px] text-white/70">Gastos</p>
            <p className="text-sm font-bold text-red-300">
              {formatK(projectedAnnualExpenses)}
            </p>
            <p className="text-[9px] text-white/50">esperados</p>
          </div>
          <div className={`${projectedAnnualBalance >= 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-red-500/10 border-red-500/30'} rounded-lg p-2 border`}>
            <p className="text-[10px] text-white/70">Balance</p>
            <p className={`text-sm font-bold ${projectedAnnualBalance >= 0 ? 'text-purple-300' : 'text-red-300'}`}>
              {projectedAnnualBalance >= 0 ? '+' : ''}{formatK(projectedAnnualBalance)}
            </p>
            <p className="text-[9px] text-white/50">proyectado</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
