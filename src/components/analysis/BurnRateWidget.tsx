import { Card } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Flame } from "lucide-react";

interface BurnRateData {
  month: string;
  ahorro: number; // Ahorro mensual (income - expenses, positivo = ahorro)
  ahorroAcumulado: number; // Ahorro acumulado hasta ese mes
}

interface BurnRateProps {
  data: BurnRateData[];
  currentSavings: number;
  insight?: string;
}

export default function BurnRateWidget({ data, currentSavings, insight }: BurnRateProps) {
  const totalAhorroMensual = data.reduce((sum, d) => sum + d.ahorro, 0);
  const promedioAhorro = data.length > 0 ? totalAhorroMensual / data.length : 0;
  
  const mesesPositivos = data.filter(d => d.ahorro > 0).length;
  const mesesNegativos = data.filter(d => d.ahorro < 0).length;

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">💰 Ahorro vs Gasto Mensual</p>
              <p className="text-[9px] text-muted-foreground">Balance mensual y acumulado</p>
            </div>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="ahorroAcumuladoGradient" x1="0" y1="0" x2="0" y2="1">
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
                label={{ value: 'Ahorro/Déficit ($)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
                label={{ value: 'Acumulado ($)', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
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
                  const val = Number(value);
                  if (name === 'ahorro') {
                    return [
                      `${val >= 0 ? '+' : ''}$${val.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`,
                      val >= 0 ? 'Ahorro del mes' : 'Déficit del mes'
                    ];
                  }
                  return [`$${val.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, 'Ahorro acumulado'];
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
              />
              <Bar 
                yAxisId="left"
                dataKey="ahorro" 
                fill="#10b981"
                name="Balance mensual"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.ahorro >= 0 ? '#10b981' : '#f97316'} />
                ))}
              </Bar>
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ahorroAcumulado" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                name="Acumulado"
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Ahorro promedio/mes</p>
            <p className={`text-xs font-bold break-words ${promedioAhorro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {promedioAhorro >= 0 ? '+' : ''}${promedioAhorro.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Total acumulado</p>
            <p className={`text-xs font-bold ${currentSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentSavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Balance</p>
            <p className="text-sm font-bold text-foreground">
              {mesesPositivos > mesesNegativos ? '📈 Positivo' : mesesPositivos < mesesNegativos ? '📉 Negativo' : '➖ Neutro'}
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
