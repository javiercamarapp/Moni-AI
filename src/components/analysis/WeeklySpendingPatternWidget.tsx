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
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">📊 Patrón de Gastos por Día</p>
        </div>

        <div className="space-y-2">
          {data.map((dayData) => {
            const percentage = maxAmount > 0 ? (dayData.amount / maxAmount) * 100 : 0;
            const isAboveAvg = dayData.amount > avgAmount;
            
            return (
              <div key={dayData.day} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getDayEmoji(dayData.day)}</span>
                    <p className="text-xs font-medium text-foreground">{dayData.day}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">
                      ${dayData.amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {dayData.transactionCount} transacciones
                    </p>
                  </div>
                </div>
                <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getColorIntensity(dayData.amount)} transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 20 && (
                      <span className="text-[9px] font-bold text-white">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {isAboveAvg && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <span className="text-xs">🔥</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Día más caro</p>
            <p className="text-xs font-bold text-foreground">
              {data.reduce((max, d) => d.amount > max.amount ? d : max, data[0])?.day || '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Día más barato</p>
            <p className="text-xs font-bold text-foreground">
              {data.reduce((min, d) => d.amount < min.amount ? d : min, data[0])?.day || '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Promedio diario</p>
            <p className="text-xs font-bold text-primary break-words">
              ${avgAmount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 animate-fade-in">
            <p className="text-[10px] text-primary leading-snug">
              📍 <span className="font-medium">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
