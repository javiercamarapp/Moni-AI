import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface IncomeExpensePieWidgetProps {
  income: number;
  expenses: number;
}

export default function IncomeExpensePieWidget({ income, expenses }: IncomeExpensePieWidgetProps) {
  const data = [
    { name: 'Ingresos', value: income, color: '#10b981' },
    { name: 'Gastos', value: expenses, color: '#ef4444' },
  ];

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <p className="text-sm font-medium text-white/90 mb-3">💰 Distribución Ingresos vs Gastos</p>
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
      <div className="mt-3 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/70">Balance</span>
          <span className={`font-bold ${income - expenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${(income - expenses).toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
}
