import { Card } from "@/components/ui/card";
import { Calendar, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface UpcomingTransaction {
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  risk: 'low' | 'medium' | 'high';
  daysUntil: number;
}

interface HistoricalAverages {
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  avgBalance: number;
  monthsAnalyzed: number;
  period: 'month' | 'year';
}

interface UpcomingTransactionsProps {
  transactions: UpcomingTransaction[];
  periodDays: number;
  historicalAverages?: HistoricalAverages;
}

export default function UpcomingTransactionsWidget({ transactions, periodDays, historicalAverages }: UpcomingTransactionsProps) {
  const upcomingExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const upcomingIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const netChange = upcomingIncome - upcomingExpenses;
  
  const highRiskTransactions = transactions.filter(t => t.risk === 'high');

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
        {/* Historical Averages Section */}
        {historicalAverages && (
          <div className="space-y-2 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Promedio Histórico
                </p>
                <p className="text-xs text-white/60">
                  Últimos {historicalAverages.monthsAnalyzed} meses
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
                <p className="text-[10px] text-white/70">Ingresos</p>
                <p className="text-sm font-bold text-emerald-300">
                  {formatK(historicalAverages.avgMonthlyIncome)}
                </p>
                <p className="text-[9px] text-white/50">promedio</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
                <p className="text-[10px] text-white/70">Gastos</p>
                <p className="text-sm font-bold text-red-300">
                  {formatK(historicalAverages.avgMonthlyExpenses)}
                </p>
                <p className="text-[9px] text-white/50">promedio</p>
              </div>
              <div className={`${historicalAverages.avgBalance >= 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-red-500/10 border-red-500/30'} rounded-lg p-2 border`}>
                <p className="text-[10px] text-white/70">Balance</p>
                <p className={`text-sm font-bold ${historicalAverages.avgBalance >= 0 ? 'text-purple-300' : 'text-red-300'}`}>
                  {historicalAverages.avgBalance >= 0 ? '+' : ''}{formatK(historicalAverages.avgBalance)}
                </p>
                <p className="text-[9px] text-white/50">promedio</p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Transactions Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Próximos {periodDays} días
              </p>
              <p className="text-xs text-white/60">Cobros y cargos detectados</p>
            </div>
            {highRiskTransactions.length > 0 && (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
              <p className="text-[10px] text-white/70">Ingresos</p>
              <p className="text-sm font-bold text-emerald-300">
                {formatK(upcomingIncome)}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
              <p className="text-[10px] text-white/70">Cargos</p>
              <p className="text-sm font-bold text-red-300">
                {formatK(upcomingExpenses)}
              </p>
            </div>
            <div className={`${netChange >= 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-red-500/10 border-red-500/30'} rounded-lg p-2 border`}>
              <p className="text-[10px] text-white/70">Neto</p>
              <p className={`text-sm font-bold ${netChange >= 0 ? 'text-purple-300' : 'text-red-300'}`}>
                {netChange >= 0 ? '+' : ''}{formatK(netChange)}
              </p>
            </div>
          </div>

          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {transactions.map((txn, idx) => {
              const riskColor = txn.risk === 'high' ? 'red' : txn.risk === 'medium' ? 'yellow' : 'green';
              
              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between py-2 px-2 bg-white/5 rounded border border-white/10"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-white/60">{txn.date}</p>
                      <span className={`text-[10px] bg-${riskColor}-500/20 text-${riskColor}-300 px-1.5 py-0.5 rounded`}>
                        {txn.daysUntil}d
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${txn.type === 'income' ? 'text-emerald-300' : 'text-red-300'}`}>
                      {txn.type === 'income' ? '+' : '-'}${txn.amount.toLocaleString()}
                    </p>
                    {txn.risk === 'high' && (
                      <p className="text-[10px] text-red-300">⚠️ Riesgo</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {highRiskTransactions.length > 0 && (
            <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
              <p className="text-xs text-red-200">
                🚨 {highRiskTransactions.length} transacciones con riesgo de sobregiro
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
