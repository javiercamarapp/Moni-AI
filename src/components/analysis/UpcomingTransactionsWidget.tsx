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
              Basado en últimos 12 meses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-emerald-600/90 to-emerald-800/90 rounded-lg p-2 border border-emerald-500/30 card-glow">
            <p className="text-[10px] text-emerald-200">Ingresos</p>
            <p className="text-sm font-bold text-white">
              {formatK(projectedAnnualIncome)}
            </p>
            <p className="text-[9px] text-emerald-300">esperados</p>
          </div>
          <div className="bg-gradient-to-br from-red-600/90 to-red-800/90 rounded-lg p-2 border border-red-500/30 card-glow">
            <p className="text-[10px] text-red-200">Gastos</p>
            <p className="text-sm font-bold text-white">
              {formatK(projectedAnnualExpenses)}
            </p>
            <p className="text-[9px] text-red-300">esperados</p>
          </div>
          <div className={`${projectedAnnualBalance >= 0 ? 'bg-gradient-to-br from-purple-600/90 to-purple-800/90 border-purple-500/30' : 'bg-gradient-to-br from-orange-600/90 to-orange-800/90 border-orange-500/30'} rounded-lg p-2 border card-glow`}>
            <p className="text-[10px] text-white/80">Balance</p>
            <p className={`text-sm font-bold text-white`}>
              {projectedAnnualBalance >= 0 ? '+' : ''}{formatK(projectedAnnualBalance)}
            </p>
            <p className={`text-[9px] ${projectedAnnualBalance >= 0 ? 'text-purple-300' : 'text-orange-300'}`}>proyectado</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
