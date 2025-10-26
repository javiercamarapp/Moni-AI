import { Card } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Flame } from "lucide-react";

interface BurnRateData {
  month: string;
  gastoNeto: number; // Gasto neto mensual
  ahorro: number; // Ahorro disponible
}

interface BurnRateProps {
  data: BurnRateData[];
  currentSavings: number;
  insight?: string;
}

export default function BurnRateWidget({ data, currentSavings, insight }: BurnRateProps) {
  const avgGastoNeto = data.length > 0 
    ? data.reduce((sum, d) => sum + d.gastoNeto, 0) / data.length 
    : 0;
  
  const mesesRunway = avgGastoNeto > 0 ? currentSavings / avgGastoNeto : 999;

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">🔥 Análisis de Gastos vs Ahorros</p>
              <p className="text-[9px] text-muted-foreground">Gasto neto mensual y tendencia de ahorro</p>
            </div>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="ahorroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
                label={{ value: 'Gasto ($)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
                label={{ value: 'Ahorro ($)', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
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
                formatter={(value: any) => `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
              />
              <Bar 
                yAxisId="left"
                dataKey="gastoNeto" 
                fill="#f97316" 
                name="Gasto Neto"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ahorro" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Ahorro Acumulado"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Gasto neto promedio</p>
            <p className="text-xs font-bold text-orange-600 break-words">
              ${avgGastoNeto.toLocaleString('es-MX', { maximumFractionDigits: 0 })}/mes
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Ahorro actual</p>
            <p className="text-xs font-bold text-green-600">
              ${currentSavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Duración ahorro</p>
            <p className={`text-sm font-bold ${mesesRunway < 3 ? 'text-red-500' : mesesRunway < 6 ? 'text-orange-500' : 'text-green-500'}`}>
              {mesesRunway > 999 ? '∞' : `${mesesRunway.toFixed(1)} meses`}
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
