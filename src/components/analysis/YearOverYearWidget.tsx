import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from "lucide-react";

interface YearData {
  month: string;
  [year: string]: number | string;
}

interface YearOverYearProps {
  data: YearData[];
  insight?: string;
}

export default function YearOverYearWidget({ data, insight }: YearOverYearProps) {
  // Extract unique years from data
  const years = data.length > 0 
    ? Object.keys(data[0]).filter(key => key !== 'month')
    : [];

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">📅 Comparación Año vs Año</p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
              />
              <YAxis 
                stroke="rgba(0,0,0,0.5)" 
                tick={{ fill: 'rgba(0,0,0,0.7)', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
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
                formatter={(value: any) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
              />
              {years.map((year, index) => (
                <Bar 
                  key={year}
                  dataKey={year} 
                  fill={colors[index % colors.length]} 
                  name={year}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 animate-fade-in">
            <p className="text-[10px] text-primary leading-snug">
              📊 <span className="font-medium">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
