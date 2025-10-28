import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Calendar, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export default function WeeklyIncomeExpenseWidget({ data, insight }: WeeklyIncomeExpenseProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // For the expanded view, we want to show last 30 days grouped by week
  const expandedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Get last 30 days of data from the API
    const today = new Date();
    const last30Days: DailyData[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
      
      // Find existing data for this date or create empty
      const existingData = data.find(d => d.date === dateStr);
      
      last30Days.push({
        day: dayName.split(' ')[0],
        dayFull: dayName,
        date: dateStr,
        income: existingData?.income || 0,
        expense: existingData?.expense || 0,
        net: (existingData?.income || 0) - (existingData?.expense || 0)
      });
    }
    
    return last30Days;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="w-full p-3 bg-card backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden animate-fade-in">
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

  // Take only last 7 days for the small view
  const last7Days = data.slice(-7);

  // Formatear datos para el gráfico pequeño (últimos 7 días)
  const chartData = last7Days.map(item => ({
    day: item.day,
    dayFull: item.dayFull,
    date: item.date,
    Ingresos: item.income,
    Gastos: item.expense,
    balance: item.income - item.expense
  }));

  // Formatear datos para el gráfico expandido (últimos 30 días)
  const expandedChartData = expandedData.map(item => ({
    day: item.day,
    dayFull: item.dayFull,
    date: item.date,
    Ingresos: item.income,
    Gastos: item.expense,
    balance: item.income - item.expense
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const balance = payload[0].payload.balance;
      const isPositive = balance >= 0;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-border">
          <p className="text-xs font-medium mb-1">{payload[0].payload.dayFull || payload[0].payload.day}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString('es-MX')}
            </p>
          ))}
          <div className={`text-xs font-bold mt-2 pt-2 border-t ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            Balance: ${Math.abs(balance).toLocaleString('es-MX')} {isPositive ? '✓' : '✗'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card 
        className="w-full p-3 bg-card backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden animate-fade-in cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsDialogOpen(true)}
      >
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
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-primary" />
              <h3 className="text-sm sm:text-xs font-bold text-foreground drop-shadow-sm">📊 Actividad Reciente (Últimos 7 días)</h3>
            </div>
            <Maximize2 className="h-3 w-3 text-primary" />
          </div>

          {/* Gráfico pequeño - últimos 7 días */}
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '9px' }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="Ingresos" 
                  fill="hsl(150, 60%, 45%)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="Gastos" 
                  fill="hsl(0, 70%, 55%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insight de la IA */}
          {insight && (
            <div className="bg-primary/10 rounded-2xl px-3 py-2.5 border border-primary/20 shadow-sm animate-fade-in">
              <p className="text-[10px] text-primary leading-snug font-medium">
                <span className="text-xs">🤖</span> <span className="font-semibold">Análisis IA:</span> {insight}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Dialog con gráfica expandida - últimos 30 días */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Actividad Financiera (Último Mes)
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="w-full h-[350px]" orientation="horizontal">
            <div className="w-[1400px] h-[300px] pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expandedChartData} margin={{ top: 20, right: 30, left: 5, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="dayFull"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="Ingresos" 
                    fill="hsl(150, 60%, 45%)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="Gastos" 
                    fill="hsl(0, 70%, 55%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
