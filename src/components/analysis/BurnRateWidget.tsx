import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Flame } from "lucide-react";

interface BurnRateData {
  month: string;
  burnRate: number;
  runway: number; // Meses que duraría el ahorro
}

interface BurnRateProps {
  data: BurnRateData[];
  currentSavings: number;
  insight?: string;
}

export default function BurnRateWidget({ data, currentSavings, insight }: BurnRateProps) {
  const avgBurnRate = data.length > 0 
    ? data.reduce((sum, d) => sum + d.burnRate, 0) / data.length 
    : 0;
  
  const currentRunway = avgBurnRate > 0 ? currentSavings / avgBurnRate : 0;

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">🔥 Velocidad de Gasto (Burn Rate)</p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
              />
              <YAxis 
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
                label={{ value: 'Meses', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
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
                labelStyle={{
                  color: '#1f2937',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'burnRate') {
                    return [`$${value.toLocaleString('es-MX')}`, 'Gasto neto'];
                  }
                  return [`${value.toFixed(1)} meses`, 'Runway'];
                }}
              />
              <ReferenceLine 
                y={3} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                label={{ value: 'Zona crítica', position: 'right', fontSize: 10 }}
              />
              <ReferenceLine 
                y={6} 
                stroke="#f59e0b" 
                strokeDasharray="3 3" 
                label={{ value: 'Zona segura', position: 'right', fontSize: 10 }}
              />
              <Line 
                type="monotone" 
                dataKey="runway" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Runway"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Gasto neto promedio</p>
            <p className="text-xs font-bold text-foreground break-words">
              ${avgBurnRate.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Runway actual</p>
            <p className={`text-sm font-bold ${currentRunway < 3 ? 'text-red-500' : currentRunway < 6 ? 'text-orange-500' : 'text-green-500'}`}>
              {currentRunway > 999 ? '∞' : `${currentRunway.toFixed(1)} meses`}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Estado</p>
            <p className="text-sm font-bold text-foreground">
              {currentRunway < 3 ? '🔴 Crítico' : currentRunway < 6 ? '🟡 Alerta' : '🟢 Seguro'}
            </p>
          </div>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 animate-fade-in">
            <p className="text-[10px] text-primary leading-snug">
              🔥 <span className="font-medium">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
