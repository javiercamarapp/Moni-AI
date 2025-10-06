import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Droplets } from "lucide-react";

interface LiquidityGaugeWidgetProps {
  months: number;
  currentBalance: number;
  monthlyExpenses: number;
}

export default function LiquidityGaugeWidget({ 
  months, 
  currentBalance, 
  monthlyExpenses 
}: LiquidityGaugeWidgetProps) {
  // Create gauge data (semicircle)
  const maxMonths = 6;
  const percentage = Math.min((months / maxMonths) * 100, 100);
  
  const data = [
    { value: percentage, color: months >= 3 ? '#10b981' : months >= 1.5 ? '#f59e0b' : '#ef4444' },
    { value: 100 - percentage, color: 'rgba(255,255,255,0.1)' }
  ];

  const status = months >= 3 ? 'Saludable' : months >= 1.5 ? 'Bajo' : 'Crítico';
  const icon = months >= 3 ? '✅' : months >= 1.5 ? '⚠️' : '🔴';

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-white/90 flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          Liquidez de Emergencia
        </p>
        <span className="text-xs text-white/70">{icon} {status}</span>
      </div>
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '60%' }}>
          <p className="text-3xl font-bold text-white">{months.toFixed(1)}</p>
          <p className="text-xs text-white/60">meses</p>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-white/70">Balance actual</span>
          <span className="text-white/90 font-medium">${currentBalance.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Gasto mensual</span>
          <span className="text-white/90 font-medium">${monthlyExpenses.toLocaleString()}</span>
        </div>
        <div className="pt-2 border-t border-white/10">
          <p className="text-white/60">
            {months >= 3 
              ? '🎯 Fondo de emergencia saludable (3-6 meses)' 
              : `⚠️ Necesitas $${((3 - months) * monthlyExpenses).toLocaleString()} más para 3 meses`}
          </p>
        </div>
      </div>
    </Card>
  );
}
