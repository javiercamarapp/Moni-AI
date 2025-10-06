import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryBreakdownWidgetProps {
  categories: CategoryData[];
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export default function CategoryBreakdownWidget({ categories }: CategoryBreakdownWidgetProps) {
  const validCategories = categories.filter(cat => cat.value && !isNaN(cat.value) && cat.value > 0);
  const total = validCategories.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <p className="text-sm font-medium text-white/90 mb-3">📊 Gastos por Categoría</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={validCategories}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {validCategories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
      <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
        {validCategories.map((cat, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
              />
              <span className="text-white/70">{cat.name}</span>
            </div>
            <span className="text-white/90 font-medium">
              ${cat.value.toLocaleString()} ({((cat.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
