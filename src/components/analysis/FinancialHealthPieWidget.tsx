import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialHealthPieWidgetProps {
  savings: number;
  fixedExpenses: number;
  variableExpenses: number;
  period: 'month' | 'year';
  onPeriodChange: (period: 'month' | 'year') => void;
}

export default function FinancialHealthPieWidget({ 
  savings, 
  fixedExpenses, 
  variableExpenses,
  period,
  onPeriodChange
}: FinancialHealthPieWidgetProps) {
  const validSavings = savings && !isNaN(savings) ? Math.max(0, savings) : 0;
  const validFixed = fixedExpenses && !isNaN(fixedExpenses) ? Math.max(0, fixedExpenses) : 0;
  const validVariable = variableExpenses && !isNaN(variableExpenses) ? Math.max(0, variableExpenses) : 0;
  
  const total = validSavings + validFixed + validVariable;
  
  const data = [
    { 
      name: 'Ahorro', 
      value: validSavings, 
      color: '#10b981',
      percentage: total > 0 ? (validSavings / total) * 100 : 0
    },
    { 
      name: 'Gastos Fijos', 
      value: validFixed, 
      color: '#f59e0b',
      percentage: total > 0 ? (validFixed / total) * 100 : 0
    },
    { 
      name: 'Gastos Variables', 
      value: validVariable, 
      color: '#8b5cf6',
      percentage: total > 0 ? (validVariable / total) * 100 : 0
    },
  ];

  const savingsRate = total > 0 ? (validSavings / total) * 100 : 0;
  const healthStatus = savingsRate >= 20 ? '✅ Excelente' : savingsRate >= 10 ? '⚠️ Mejorable' : '❌ Crítico';

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">💚 Salud Financiera</p>
          <span className="text-xs text-muted-foreground">{healthStatus}</span>
        </div>
        <Tabs value={period} onValueChange={(value) => onPeriodChange(value as 'month' | 'year')} className="w-auto">
          <TabsList className="h-7">
            <TabsTrigger value="month" className="text-xs px-2 py-1">Mes</TabsTrigger>
            <TabsTrigger value="year" className="text-xs px-2 py-1">Año</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
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
            formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="text-foreground font-medium">
              ${(item.value / 1000).toFixed(1)}k ({(item.percentage || 0).toFixed(0)}%)
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {savingsRate >= 20 
              ? '🎯 Tasa de ahorro ideal. ¡Sigue así!' 
              : savingsRate >= 10 
              ? '💪 Intenta aumentar tu ahorro al 20%' 
              : '⚠️ Revisa tus gastos y aumenta el ahorro'}
          </p>
        </div>
      </div>
    </Card>
  );
}
