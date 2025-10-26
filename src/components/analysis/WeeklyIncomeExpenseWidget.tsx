import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface DayData {
  day: string;
  dayFull: string;
  income: number;
  expense: number;
  net: number;
}

interface WeeklyIncomeExpenseWidgetProps {
  data: DayData[];
  insight?: string;
}

export default function WeeklyIncomeExpenseWidget({ data, insight }: WeeklyIncomeExpenseWidgetProps) {
  const bestIncomeDay = data.reduce((max, d) => d.income > max.income ? d : max, data[0]);
  const worstExpenseDay = data.reduce((max, d) => d.expense > max.expense ? d : max, data[0]);
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
  const avgIncome = totalIncome / data.length;
  const avgExpense = totalExpense / data.length;

  const getDayEmoji = (day: string) => {
    const emojis: Record<string, string> = {
      'Lunes': '📅',
      'Martes': '💼',
      'Miércoles': '🏃',
      'Jueves': '⚡',
      'Viernes': '🎉',
      'Sábado': '🛒',
      'Domingo': '😴'
    };
    return emojis[day] || '📆';
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100/50 animate-fade-in overflow-hidden hover:shadow-2xl transition-all">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900">
              Ingresos y Gastos por Día
            </h3>
            <p className="text-xs text-muted-foreground">Análisis histórico por día de la semana</p>
          </div>
        </div>

        {/* Gráfica de barras */}
        <div className="w-full h-[320px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border-0 ring-1 ring-gray-900/5">
                        <p className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                          {getDayEmoji(data.dayFull)} {data.dayFull}
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-green-600 font-medium">Ingresos:</span>
                            <span className="text-sm font-bold text-green-700">
                              ${data.income.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-red-600 font-medium">Gastos:</span>
                            <span className="text-sm font-bold text-red-700">
                              ${data.expense.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-gray-200">
                            <span className="text-xs text-gray-600 font-medium">Neto:</span>
                            <span className={`text-sm font-bold ${data.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              ${data.net.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="circle"
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    income: 'Ingresos',
                    expense: 'Gastos'
                  };
                  return <span className="text-xs font-medium">{labels[value] || value}</span>;
                }}
              />
              <Bar dataKey="income" fill="hsl(150, 60%, 50%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(0, 70%, 55%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estadísticas destacadas */}
        <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/50">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs">{getDayEmoji(bestIncomeDay.dayFull)}</span>
              <p className="text-[8px] text-green-700 font-semibold uppercase tracking-wide">Más ingresos</p>
            </div>
            <p className="text-[10px] font-bold text-green-800">{bestIncomeDay.dayFull}</p>
            <p className="text-[9px] text-green-600">
              ${bestIncomeDay.income.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </div>

          <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200/50">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs">{getDayEmoji(worstExpenseDay.dayFull)}</span>
              <p className="text-[8px] text-red-700 font-semibold uppercase tracking-wide">Más gastos</p>
            </div>
            <p className="text-[10px] font-bold text-red-800">{worstExpenseDay.dayFull}</p>
            <p className="text-[9px] text-red-600">
              ${worstExpenseDay.expense.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Promedios */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-green-50/50 border border-green-200/30">
            <p className="text-[10px] text-green-700 font-medium mb-1">Promedio de ingresos</p>
            <p className="text-sm font-bold text-green-800">
              ${avgIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-red-50/50 border border-red-200/30">
            <p className="text-[10px] text-red-700 font-medium mb-1">Promedio de gastos</p>
            <p className="text-sm font-bold text-red-800">
              ${avgExpense.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-xl px-4 py-3 border border-primary/20 shadow-sm animate-fade-in mt-3">
            <p className="text-xs text-primary leading-relaxed font-medium">
              <span className="text-sm">💡</span> <span className="font-semibold">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
