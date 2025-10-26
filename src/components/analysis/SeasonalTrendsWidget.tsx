import { Card } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from "lucide-react";

interface QuarterData {
  quarter: string;
  income: number;
  expenses: number;
  savings: number;
}

interface SeasonalTrendsProps {
  data: QuarterData[];
  insight?: string;
}

export default function SeasonalTrendsWidget({ data, insight }: SeasonalTrendsProps) {
  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">🌤️ Tendencias Estacionales</p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="rgba(0,0,0,0.1)" />
              <PolarAngleAxis 
                dataKey="quarter" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 'auto']}
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#1f2937',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
              />
              <Radar 
                name="Ingresos" 
                dataKey="income" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
              />
              <Radar 
                name="Gastos" 
                dataKey="expenses" 
                stroke="#f97316" 
                fill="#f97316" 
                fillOpacity={0.3}
              />
              <Radar 
                name="Ahorro" 
                dataKey="savings" 
                stroke="#a855f7" 
                fill="#a855f7" 
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Mejor trimestre</p>
            <p className="text-xs font-bold text-primary">
              {data.reduce((max, d) => d.savings > max.savings ? d : max, data[0])?.quarter || '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Mayor ingreso</p>
            <p className="text-xs font-bold text-foreground">
              {data.reduce((max, d) => d.income > max.income ? d : max, data[0])?.quarter || '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Mayor gasto</p>
            <p className="text-xs font-bold text-foreground">
              {data.reduce((max, d) => d.expenses > max.expenses ? d : max, data[0])?.quarter || '-'}
            </p>
          </div>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 animate-fade-in">
            <p className="text-[10px] text-primary leading-snug">
              🔸 <span className="font-medium">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
