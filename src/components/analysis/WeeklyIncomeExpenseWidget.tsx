import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

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
  const [expandedData, setExpandedData] = useState<DailyData[]>([]);
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(false);

  // Fetch 30 days of data when dialog opens
  useEffect(() => {
    if (isDialogOpen && expandedData.length === 0) {
      fetchLast30Days();
    }
  }, [isDialogOpen]);

  const fetchLast30Days = async () => {
    try {
      setIsLoadingExpanded(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 30 days of data
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 29); // Last 30 days including today
      startDate.setHours(0, 0, 0, 0);

      console.log('📅 Últimos 30 días:', {
        inicio: startDate.toISOString().split('T')[0],
        fin: today.toISOString().split('T')[0]
      });

      // Fetch transactions for last 30 days
      const { data: monthTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', today.toISOString().split('T')[0]);

      // Create a map for all 30 days
      const dayMap = new Map<string, { date: string; dayName: string; income: number; expense: number }>();
      
      // Initialize all 30 days - from most recent to oldest
      for (let i = 0; i <= 29; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('es-MX', { weekday: 'short' });
        const fullDayName = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
        
        dayMap.set(dateStr, { 
          date: fullDayName,
          dayName: dayName,
          income: 0, 
          expense: 0 
        });
      }

      // Process transactions
      if (monthTransactions) {
        monthTransactions.forEach(t => {
          const dateStr = t.transaction_date;
          
          if (dayMap.has(dateStr)) {
            const data = dayMap.get(dateStr)!;
            
            if (t.type === 'ingreso') {
              data.income += Number(t.amount);
            } else {
              data.expense += Number(t.amount);
            }
          }
        });
      }

      // Convert to array format for chart - keep chronological order from most recent
      const last30DaysArray: DailyData[] = Array.from(dayMap.entries()).map(([dateStr, data]) => ({
        day: data.dayName,
        dayFull: data.date,
        date: dateStr,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense
      }));

      setExpandedData(last30DaysArray);
    } catch (error) {
      console.error('Error fetching 30 days data:', error);
    } finally {
      setIsLoadingExpanded(false);
    }
  };

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
      const data = payload[0].payload;
      const ingresos = data.Ingresos || 0;
      const gastos = data.Gastos || 0;
      const balance = ingresos - gastos;
      const isPositive = balance >= 0;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-border">
          <p className="text-xs font-medium mb-2">{data.dayFull || data.day}</p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Ingresos: ${ingresos.toLocaleString('es-MX')}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            Gastos: ${gastos.toLocaleString('es-MX')}
          </p>
          <div className={`text-xs font-bold mt-2 pt-2 border-t ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                  dataKey="Gastos" 
                  fill="hsl(0, 70%, 55%)" 
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  dataKey="Ingresos" 
                  stroke="hsl(150, 60%, 45%)" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(150, 60%, 45%)' }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Insight de la IA */}
          {insight ? (
            <div className="bg-primary/10 rounded-2xl px-3 py-2.5 border border-primary/20 shadow-sm animate-fade-in">
              <p className="text-[10px] text-primary leading-snug font-medium">
                <span className="text-xs">🤖</span> <span className="font-semibold">Análisis IA:</span> {insight}
              </p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-2xl px-3 py-2.5 border border-border/20 shadow-sm">
              <p className="text-[10px] text-muted-foreground leading-snug font-medium">
                <span className="text-xs">🤖</span> <span className="font-semibold">Análisis IA:</span> No hay suficientes datos para análisis
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
          {isLoadingExpanded ? (
            <div className="flex items-center justify-center h-[320px]">
              <p className="text-sm text-muted-foreground">Cargando últimos 30 días...</p>
            </div>
          ) : (
            <>
            {/* Estadísticas de gastos */}
            {(() => {
              const daysWithExpenses = expandedData.filter(d => d.expense > 0);
              if (daysWithExpenses.length === 0) return null;
              
              const maxExpenseDay = daysWithExpenses.reduce((max, day) => 
                day.expense > max.expense ? day : max
              );
              const minExpenseDay = daysWithExpenses.reduce((min, day) => 
                day.expense < min.expense ? day : min
              );

              return (
                <div className="grid grid-cols-2 gap-2.5 mb-4 px-2">
                  <div className="backdrop-blur-xl bg-red-500/10 dark:bg-red-500/20 p-2.5 rounded-2xl border border-red-200/30 dark:border-red-400/20 shadow-sm">
                    <p className="text-[10px] font-medium text-red-600 dark:text-red-400 mb-0.5 tracking-wide uppercase opacity-80">
                      Más gastaste
                    </p>
                    <p className="text-xs font-semibold text-foreground/90 mb-1">
                      {maxExpenseDay.dayFull}
                    </p>
                    <p className="text-base font-bold text-red-600 dark:text-red-400">
                      ${maxExpenseDay.expense.toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div className="backdrop-blur-xl bg-green-500/10 dark:bg-green-500/20 p-2.5 rounded-2xl border border-green-200/30 dark:border-green-400/20 shadow-sm">
                    <p className="text-[10px] font-medium text-green-600 dark:text-green-400 mb-0.5 tracking-wide uppercase opacity-80">
                      Menos gastaste
                    </p>
                    <p className="text-xs font-semibold text-foreground/90 mb-1">
                      {minExpenseDay.dayFull}
                    </p>
                    <p className="text-base font-bold text-green-600 dark:text-green-400">
                      ${minExpenseDay.expense.toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              );
            })()}
            
            <ScrollArea className="w-full h-[320px]" orientation="horizontal">
              <div className="w-[1400px] h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={expandedChartData} margin={{ top: 20, right: 30, left: 5, bottom: 20 }}>
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
                    domain={[0, (dataMax: number) => {
                      const maxExpense = Math.max(...expandedChartData.map(d => d.Gastos));
                      return Math.ceil(maxExpense * 1.1);
                    }]}
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
                    dataKey="Gastos" 
                    fill="hsl(0, 70%, 55%)" 
                    radius={[4, 4, 0, 0]}
                  />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
