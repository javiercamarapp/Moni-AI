import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface FinancialHealthPieWidgetProps {
  savings: number;
  fixedExpenses: number;
  variableExpenses: number;
}

export default function FinancialHealthPieWidget({ 
  savings, 
  fixedExpenses, 
  variableExpenses 
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
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-medium text-white/90">💚 Salud Financiera</p>
        <span className="text-xs text-white/70">{healthStatus}</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => {
              const validPercentage = percentage && !isNaN(percentage) ? percentage : 0;
              return `${name} ${validPercentage.toFixed(0)}%`;
            }}
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
        {data.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-white/70">{item.name}</span>
            </div>
            <span className="text-white/90 font-medium">
              ${item.value.toLocaleString()} ({(item.percentage || 0).toFixed(1)}%)
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-white/60">
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
