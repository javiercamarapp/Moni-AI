import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

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

  // Helper to format values
  const formatK = (value: number): string => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1);
    }
    return value.toFixed(0);
  };

  return (
    <div className="space-y-3">
      {/* Título */}
      <div>
        <h3 className="text-sm font-semibold text-white">Proyección Anual</h3>
        <p className="text-xs text-white/60">Basado en promedio de últimos {historicalAverages.monthsAnalyzed} meses</p>
      </div>

      {/* Ingresos Proyectados */}
      <Card 
        className="p-4 bg-gradient-card card-glow hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Ingresos Esperados</p>
              <p className="text-xs text-white/70">Próximo año</p>
            </div>
          </div>
          <p className="text-xl font-bold text-green-400">
            ${formatK(projectedAnnualIncome)}k
          </p>
        </div>
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mt-3">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500 animate-pulse-slow"
            style={{ width: '100%' }}
          />
        </div>
      </Card>

      {/* Gastos Proyectados */}
      <Card 
        className="p-4 bg-gradient-card card-glow hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Gastos Esperados</p>
              <p className="text-xs text-white/70">Próximo año</p>
            </div>
          </div>
          <p className="text-xl font-bold text-red-400">
            ${formatK(projectedAnnualExpenses)}k
          </p>
        </div>
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mt-3">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full transition-all duration-500"
            style={{ width: '100%' }}
          />
        </div>
      </Card>
    </div>
  );
}
