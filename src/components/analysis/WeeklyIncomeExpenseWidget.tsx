import { Card } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from "lucide-react";

interface DailyData {
  date?: string;
  day: string;
  dayFull?: string;
  income: number;
  expense: number;
  balance?: number;
  net?: number;
}

interface WeeklyIncomeExpenseProps {
  data: DailyData[];
  insight?: string;
}

export default function WeeklyIncomeExpenseWidget({ data }: WeeklyIncomeExpenseProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden animate-fade-in">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div className="text-center text-muted-foreground py-4 relative z-10">
          No hay datos de los últimos 7 días
        </div>
      </Card>
    );
  }

  // Formatear datos para el gráfico
  const chartData = data.map(item => ({
    day: item.day,
    Ingresos: item.income,
    Gastos: item.expense
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-border">
          <p className="text-xs font-medium mb-1">{payload[0].payload.day}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString('es-MX')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden animate-fade-in">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <div className="space-y-2 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-primary" />
          <h3 className="text-sm sm:text-xs font-bold text-foreground drop-shadow-sm">📊 Actividad Reciente (Últimos 7 días)</h3>
        </div>

        {/* Gráfico */}
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 8, fill: '#6B7280' }}
                stroke="#9CA3AF"
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 8, fill: '#6B7280' }}
                stroke="#9CA3AF"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '9px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="Ingresos" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Gastos" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
