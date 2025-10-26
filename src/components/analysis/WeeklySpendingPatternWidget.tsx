import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface DaySpending {
  day: string;
  amount: number;
  transactionCount: number;
}

interface WeeklySpendingPatternProps {
  data: DaySpending[];
  insight?: string;
}

export default function WeeklySpendingPatternWidget({ data, insight }: WeeklySpendingPatternProps) {
  const maxAmount = Math.max(...data.map(d => d.amount));
  const avgAmount = data.reduce((sum, d) => sum + d.amount, 0) / data.length;

  const getColorIntensity = (amount: number) => {
    if (amount === 0) return 'bg-gray-100';
    const intensity = Math.round((amount / maxAmount) * 5);
    const colors = [
      'bg-blue-100',
      'bg-blue-200',
      'bg-blue-300',
      'bg-blue-400',
      'bg-blue-500',
      'bg-blue-600'
    ];
    return colors[Math.min(intensity, 5)];
  };

  const getDayEmoji = (day: string) => {
    const emojis: Record<string, string> = {
      'Lun': '📅',
      'Mar': '💼',
      'Mié': '🏃',
      'Jue': '⚡',
      'Vie': '🎉',
      'Sáb': '🛒',
      'Dom': '😴'
    };
    return emojis[day] || '📆';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-[24px] shadow-2xl transition-all border border-blue-100/50 backdrop-blur-sm animate-fade-in hover:shadow-3xl">
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">📊 Patrón de Gastos Semanal</p>
            <p className="text-[10px] text-muted-foreground">Análisis de comportamiento por día</p>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((dayData, index) => {
            const percentage = maxAmount > 0 ? (dayData.amount / maxAmount) * 100 : 0;
            const isAboveAvg = dayData.amount > avgAmount;
            
            return (
              <div 
                key={dayData.day} 
                className="space-y-2 p-3 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 border border-gray-100/50 hover:shadow-lg group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <span className="text-xl">{getDayEmoji(dayData.day)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{dayData.day}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {dayData.transactionCount} {dayData.transactionCount === 1 ? 'transacción' : 'transacciones'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${dayData.amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium">
                      {percentage.toFixed(0)}% del máximo
                    </p>
                  </div>
                </div>
                <div className="relative h-8 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 transition-all duration-700 flex items-center justify-end pr-3 relative overflow-hidden group-hover:from-blue-500 group-hover:to-purple-600"
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse" />
                    {percentage > 15 && (
                      <span className="text-[10px] font-bold text-white drop-shadow-lg relative z-10">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {isAboveAvg && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse">
                      <span className="text-sm drop-shadow-lg">🔥</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 mt-3 border-t border-gray-200/50">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/30">
            <p className="text-[9px] text-red-600 font-medium mb-1">Día más caro</p>
            <p className="text-sm font-bold text-red-700">
              {data.reduce((max, d) => d.amount > max.amount ? d : max, data[0])?.day || '-'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/30">
            <p className="text-[9px] text-green-600 font-medium mb-1">Día más barato</p>
            <p className="text-sm font-bold text-green-700">
              {data.reduce((min, d) => d.amount < min.amount ? d : min, data[0])?.day || '-'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-100/50 border border-blue-200/30">
            <p className="text-[9px] text-primary font-medium mb-1">Promedio diario</p>
            <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
              ${avgAmount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {insight && (
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-purple-500/10 rounded-2xl px-4 py-3 border border-primary/20 shadow-sm animate-fade-in backdrop-blur-sm">
            <p className="text-[11px] text-primary leading-relaxed font-medium">
              <span className="text-sm">📍</span> <span className="font-semibold">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
