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

  const hasData = validCategories.length > 0 && total > 0;

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <p className="text-sm font-medium text-foreground mb-3">📊 Gastos por Categoría</p>
      {!hasData ? (
        <div className="h-[220px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Sin datos disponibles</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={validCategories}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
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
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '12px',
              color: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
            labelStyle={{
              color: 'white',
              fontWeight: '600',
              marginBottom: '4px'
            }}
            formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
          />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {validCategories.map((cat, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                />
                <span className="text-muted-foreground truncate">{cat.name}</span>
              </div>
              <span className="text-foreground font-medium flex-shrink-0 text-right">
                ${(cat.value / 1000).toFixed(1)}k ({((cat.value / total) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </>
      )}
    </Card>
  );
}
