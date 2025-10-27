import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

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
      <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
        <div className="text-center text-muted-foreground py-4">
          No hay datos de los últimos 7 días
        </div>
      </Card>
    );
  }

  // Encontrar el día con mayor ingreso y mayor gasto
  const maxIncomeDay = data.reduce((prev, current) => 
    (current.income > prev.income) ? current : prev
  );
  
  const maxExpenseDay = data.reduce((prev, current) => 
    (current.expense > prev.expense) ? current : prev
  );

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
    <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">📊 Últimos 7 Días</h3>
        </div>

        {/* Gráfico */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                stroke="#9CA3AF"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="Ingresos" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="Gastos" 
                fill="#ef4444" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-[10px] text-green-700 font-medium">Mayor Ingreso</span>
            </div>
            <p className="text-xs font-bold text-green-800">{maxIncomeDay.day}</p>
            <p className="text-lg font-black text-green-600">
              ${maxIncomeDay.income.toLocaleString('es-MX')}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-[10px] text-red-700 font-medium">Mayor Gasto</span>
            </div>
            <p className="text-xs font-bold text-red-800">{maxExpenseDay.day}</p>
            <p className="text-lg font-black text-red-600">
              ${maxExpenseDay.expense.toLocaleString('es-MX')}
            </p>
          </div>
        </div>

        {/* Resumen semanal */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-[10px] text-blue-700 font-medium mb-1">Resumen de 7 días</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] text-blue-600">Ingresos</p>
              <p className="text-xs font-bold text-blue-800">
                ${data.reduce((sum, d) => sum + d.income, 0).toLocaleString('es-MX')}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-blue-600">Gastos</p>
              <p className="text-xs font-bold text-blue-800">
                ${data.reduce((sum, d) => sum + d.expense, 0).toLocaleString('es-MX')}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-blue-600">Balance</p>
              <p className={`text-xs font-bold ${
                data.reduce((sum, d) => sum + (d.balance ?? d.net ?? 0), 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                ${data.reduce((sum, d) => sum + (d.balance ?? d.net ?? 0), 0).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
