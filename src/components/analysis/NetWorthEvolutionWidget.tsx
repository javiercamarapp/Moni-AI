import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";

interface NetWorthPoint {
  month: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

interface NetWorthEvolutionProps {
  data: NetWorthPoint[];
  insight?: string;
}

export default function NetWorthEvolutionWidget({ data, insight }: NetWorthEvolutionProps) {
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  const growth = lastPoint && firstPoint 
    ? lastPoint.netWorth - firstPoint.netWorth 
    : 0;
  const growthPercentage = firstPoint && firstPoint.netWorth !== 0
    ? ((growth / Math.abs(firstPoint.netWorth)) * 100)
    : 0;

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">💎 Evolución Patrimonial</p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="assetsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="liabilitiesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
              />
              <YAxis 
                stroke="rgba(0,0,0,0.5)" 
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
                labelStyle={{
                  color: '#1f2937',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}
                formatter={(value: any) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
              />
              <Area 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#a855f7" 
                fillOpacity={1} 
                fill="url(#netWorthGradient)"
                name="Patrimonio Neto"
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="assets" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#assetsGradient)"
                name="Activos"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="liabilities" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#liabilitiesGradient)"
                name="Pasivos"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Crecimiento</p>
            <p className={`text-xs font-bold break-words ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(growth).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Porcentaje</p>
            <p className={`text-sm font-bold ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Tendencia</p>
            <p className="text-sm font-bold text-foreground">
              {growth >= 0 ? '📈 ↑' : '📉 ↓'}
            </p>
          </div>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 animate-fade-in">
            <p className="text-[10px] text-primary leading-snug">
              💡 <span className="font-medium">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
