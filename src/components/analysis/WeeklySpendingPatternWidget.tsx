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
    <Card className="p-4 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-[24px] shadow-2xl transition-all border border-blue-100/50 backdrop-blur-sm animate-fade-in hover:shadow-3xl">
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1">
          <div className="p-1.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">📊 Patrón de Gastos del Mes</p>
            <p className="text-[9px] text-muted-foreground">Gastos por día de la semana</p>
          </div>
        </div>

        <div className="space-y-2">
          {data.map((dayData, index) => {
            const percentage = maxAmount > 0 ? (dayData.amount / maxAmount) * 100 : 0;
            const isAboveAvg = dayData.amount > avgAmount;
            
            return (
              <div 
                key={dayData.day} 
                className="space-y-1.5 p-2 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 border border-gray-100/50 hover:shadow-md group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <span className="text-base">{getDayEmoji(dayData.day)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{dayData.day}</p>
                      <p className="text-[8px] text-muted-foreground">
                        {dayData.transactionCount} {dayData.transactionCount === 1 ? 'transacción' : 'transacciones'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">
                      ${dayData.amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[8px] text-muted-foreground font-medium">
                      {percentage.toFixed(0)}% del máximo
                    </p>
                  </div>
                </div>
                <div className="relative h-5 bg-gray-100/80 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-primary transition-all duration-700 flex items-center justify-end pr-2 relative overflow-hidden"
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse" />
                    {percentage > 20 && (
                      <span className="text-[9px] font-bold text-white drop-shadow-lg relative z-10">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {isAboveAvg && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-pulse">
                      <span className="text-xs drop-shadow-lg">🔥</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 mt-2 border-t border-gray-200/50">
          <div className="p-2 rounded-lg bg-red-50/50 border border-red-200/30">
            <p className="text-[9px] text-red-600 font-medium mb-0.5">Día más caro</p>
            <p className="text-xs font-bold text-red-700">
              {data.reduce((max, d) => d.amount > max.amount ? d : max, data[0])?.day || '-'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-green-50/50 border border-green-200/30">
            <p className="text-[9px] text-green-600 font-medium mb-0.5">Día más bajo</p>
            <p className="text-xs font-bold text-green-700">
              {data.reduce((min, d) => d.amount < min.amount ? d : min, data[0])?.day || '-'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-[9px] text-primary font-medium mb-0.5">Promedio por día</p>
            <p className="text-xs font-bold text-primary break-words">
              ${avgAmount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-xl px-3 py-2 border border-primary/20 shadow-sm animate-fade-in">
            <p className="text-[10px] text-primary leading-snug font-medium">
              <span className="text-xs">📍</span> <span className="font-semibold">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
