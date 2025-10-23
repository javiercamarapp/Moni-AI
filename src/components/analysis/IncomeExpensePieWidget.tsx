import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface IncomeExpensePieWidgetProps {
  income: number;
  expenses: number;
}

export default function IncomeExpensePieWidget({ income, expenses }: IncomeExpensePieWidgetProps) {
  const validIncome = income && !isNaN(income) ? income : 0;
  const validExpenses = expenses && !isNaN(expenses) ? expenses : 0;

  const hasData = validIncome > 0 || validExpenses > 0;

  const data = [
    { name: 'Ingresos', value: validIncome, color: '#10b981' },
    { name: 'Gastos', value: validExpenses, color: '#ef4444' },
  ];

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all border border-blue-100 animate-fade-in">
      <p className="text-sm font-medium text-foreground mb-3">💰 Distribución Ingresos vs Gastos</p>
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
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: any) => `$${value.toLocaleString()}`}
          />
        </PieChart>
      </ResponsiveContainer>
      )}
      {hasData && (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Balance</span>
            <span className={`font-bold ${validIncome - validExpenses >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ${(validIncome - validExpenses).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
