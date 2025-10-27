import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IncomeExpensePieWidgetProps {
  income: number;
  expenses: number;
  period: 'month' | 'year';
  onPeriodChange: (period: 'month' | 'year') => void;
}

export default function IncomeExpensePieWidget({ income, expenses, period, onPeriodChange }: IncomeExpensePieWidgetProps) {
  const validIncome = income && !isNaN(income) ? income : 0;
  const validExpenses = expenses && !isNaN(expenses) ? expenses : 0;

  const hasData = validIncome > 0 || validExpenses > 0;

  const data = [
    { name: 'Ingresos', value: validIncome, color: '#10b981' },
    { name: 'Gastos', value: validExpenses, color: '#ef4444' },
  ];

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-medium text-foreground">💰 Distribución Ingresos vs Gastos</p>
        <Tabs value={period} onValueChange={(value) => onPeriodChange(value as 'month' | 'year')} className="w-auto">
          <TabsList className="h-7">
            <TabsTrigger value="month" className="text-xs px-2 py-1">Mes</TabsTrigger>
            <TabsTrigger value="year" className="text-xs px-2 py-1">Año</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Sin datos disponibles</p>
        </div>
      ) : (
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
      )}
      {hasData && (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span className="text-muted-foreground">Ingresos</span>
            </div>
            <span className="text-foreground font-medium">
              {validIncome >= 1000000 
                ? `$${(validIncome / 1000000).toFixed(2)}M` 
                : `$${validIncome.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="text-muted-foreground">Gastos</span>
            </div>
            <span className="text-foreground font-medium">
              {validExpenses >= 1000000 
                ? `$${(validExpenses / 1000000).toFixed(2)}M` 
                : `$${validExpenses.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
            </span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Balance</span>
            <span className={`font-bold ${validIncome - validExpenses >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {Math.abs(validIncome - validExpenses) >= 1000000 
                ? `$${((validIncome - validExpenses) / 1000000).toFixed(2)}M` 
                : `$${(validIncome - validExpenses).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
