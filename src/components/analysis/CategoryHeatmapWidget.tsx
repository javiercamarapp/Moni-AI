import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface CategoryMonth {
  category: string;
  months: {
    [month: string]: number;
  };
}

interface CategoryHeatmapProps {
  data: CategoryMonth[];
  insight?: string;
}

export default function CategoryHeatmapWidget({ data, insight }: CategoryHeatmapProps) {
  // Get all unique months
  const months = data.length > 0 
    ? Object.keys(data[0].months).slice(-6) // Last 6 months
    : [];

  // Get max value for color scaling
  const maxValue = Math.max(
    ...data.flatMap(cat => Object.values(cat.months))
  );

  const getColorIntensity = (value: number) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = Math.round((value / maxValue) * 5);
    const colors = [
      'bg-purple-100',
      'bg-purple-200',
      'bg-purple-300',
      'bg-purple-400',
      'bg-purple-500',
      'bg-purple-600'
    ];
    return colors[Math.min(intensity, 5)];
  };

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">🔥 Mapa de Calor por Categoría</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header */}
            <div className="flex gap-1 mb-2">
              <div className="w-24 flex-shrink-0" />
              {months.map((month) => (
                <div key={month} className="flex-1 text-center">
                  <p className="text-[9px] text-muted-foreground font-medium">{month}</p>
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            <div className="space-y-1">
              {data.slice(0, 8).map((category) => (
                <div key={category.category} className="flex gap-1">
                  <div className="w-24 flex-shrink-0">
                    <p className="text-[9px] text-foreground truncate" title={category.category}>
                      {category.category}
                    </p>
                  </div>
                  {months.map((month) => {
                    const value = category.months[month] || 0;
                    return (
                      <div
                        key={month}
                        className={`flex-1 h-8 rounded ${getColorIntensity(value)} flex items-center justify-center transition-all hover:scale-110 cursor-pointer group relative`}
                        title={`${category.category} - ${month}: $${value.toLocaleString('es-MX')}`}
                      >
                        {value > 0 && (
                          <span className="text-[8px] font-bold text-white opacity-0 group-hover:opacity-100">
                            ${(value / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
              <p className="text-[9px] text-muted-foreground">Intensidad:</p>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-gray-100" />
                <div className="w-4 h-4 rounded bg-purple-100" />
                <div className="w-4 h-4 rounded bg-purple-300" />
                <div className="w-4 h-4 rounded bg-purple-500" />
                <div className="w-4 h-4 rounded bg-purple-600" />
              </div>
              <p className="text-[9px] text-muted-foreground ml-auto">Más gasto →</p>
            </div>
          </div>
        </div>

        {insight && (
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 animate-fade-in">
            <p className="text-[10px] text-primary leading-snug">
              💡 <span className="font-medium">Insight:</span> {insight}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
