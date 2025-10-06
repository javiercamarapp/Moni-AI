import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RecentTransaction {
  date: Date;
  type: "income" | "expense";
  description: string;
  amount: number;
  category?: string;
}

interface RecentMovementsProps {
  transactions: RecentTransaction[];
}

export default function RecentMovementsWidget({ transactions }: RecentMovementsProps) {
  // Sort by date descending
  const sortedTransactions = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const getTypeIcon = (type: string) => {
    return type === "income" ? "💰" : "💳";
  };

  const getTypeColor = (type: string) => {
    return type === "income" ? "text-emerald-300" : "text-orange-300";
  };

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20 hover:scale-105 transition-transform duration-200">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          <p className="text-sm font-medium text-white">🕐 Movimientos Recientes</p>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedTransactions.map((transaction, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{getTypeIcon(transaction.type)}</span>
                    <p className="text-xs font-medium text-white">
                      {transaction.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span>{format(transaction.date, "d 'de' MMMM", { locale: es })}</span>
                    {transaction.category && (
                      <>
                        <span>•</span>
                        <span>{transaction.category}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-bold ${getTypeColor(transaction.type)}`}>
                  {transaction.type === "income" ? "+" : "-"}${(transaction.amount / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-500/20 rounded px-3 py-2 border border-blue-500/30">
          <p className="text-[10px] text-blue-200 leading-snug">
            📊 Mostrando los últimos {sortedTransactions.length} movimientos
          </p>
        </div>
      </div>
    </Card>
  );
}
