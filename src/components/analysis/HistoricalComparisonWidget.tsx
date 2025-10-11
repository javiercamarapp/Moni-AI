import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { BarChart3 } from "lucide-react";

interface MonthComparison {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface HistoricalComparisonProps {
  data: MonthComparison[];
  insight?: string;
}

export default function HistoricalComparisonWidget({ data, insight }: HistoricalComparisonProps) {
  const avgSavings = data.reduce((sum, d) => sum + d.savings, 0) / data.length;

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20 hover:scale-105 transition-transform duration-200">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          <p className="text-sm font-medium text-white">💎 Comparativo Histórico</p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                labelStyle={{ color: 'white' }}
                formatter={(value: any) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
              />
              <Bar 
                dataKey="income" 
                fill="#10b981" 
                name="Ingresos"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                fill="#f97316" 
                name="Gastos"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="savings" 
                stroke="#a855f7" 
                strokeWidth={2}
                name="Ahorro"
                dot={{ fill: '#a855f7', r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/60">Ahorro promedio</p>
            <p className="text-xs font-bold text-purple-300 break-words">
              ${avgSavings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/60">Mejor mes</p>
            <p className="text-sm font-bold text-emerald-300">
              {data.reduce((max, d) => d.savings > max.savings ? d : max, data[0])?.month || '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/60">Tendencia</p>
            <p className="text-sm font-bold text-white">
              {data[data.length - 1]?.savings > data[0]?.savings ? '📈 ↑' : '📉 ↓'}
            </p>
          </div>
        </div>

        {insight && (
          <div className="glass rounded px-3 py-2 border-border">
            <p className="text-[10px] text-foreground leading-snug">
              🔸 <span className="font-medium">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
