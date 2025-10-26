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
          <div>
            <p className="text-sm font-medium text-foreground">🔥 Mapa de Calor por Categoría</p>
            <p className="text-[9px] text-muted-foreground">Intensidad de gasto mensual - Más oscuro = Más gasto</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header */}
            <div className="flex gap-1 mb-2">
              <div className="w-28 flex-shrink-0" />
              {months.map((month) => (
                <div key={month} className="flex-1 text-center">
                  <p className="text-[9px] text-muted-foreground font-semibold">{month}</p>
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            <div className="space-y-1.5">
              {data.slice(0, 8).map((category) => {
                const categoryTotal = Object.values(category.months).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
                
                return (
                  <div key={category.category} className="flex gap-1">
                    <div className="w-28 flex-shrink-0 flex items-center">
                      <p className="text-[9px] text-foreground truncate font-medium" title={category.category}>
                        {category.category.replace(/^[^\s]+\s/, '')}
                      </p>
                    </div>
                    {months.map((month) => {
                      const value = category.months[month] || 0;
                      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                      
                      return (
                        <div
                          key={month}
                          className={`flex-1 h-10 rounded-lg ${getColorIntensity(value)} flex items-center justify-center transition-all hover:scale-105 hover:shadow-md cursor-pointer group relative border border-gray-200/30`}
                          title={`${category.category} - ${month}: $${value.toLocaleString('es-MX')}`}
                        >
                          {value > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-lg">
                              <span className="text-[8px] font-bold text-white">
                                ${(value / 1000).toFixed(1)}k
                              </span>
                              <span className="text-[7px] text-white/80">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="w-16 flex-shrink-0 flex items-center justify-end pl-2">
                      <p className="text-[8px] text-muted-foreground font-semibold">
                        ${(categoryTotal / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <p className="text-[9px] text-muted-foreground font-medium">Intensidad:</p>
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded bg-gray-100 border border-gray-200" title="Sin gastos" />
                  <div className="w-5 h-5 rounded bg-purple-100 border border-purple-200" title="Muy bajo" />
                  <div className="w-5 h-5 rounded bg-purple-300 border border-purple-400" title="Medio" />
                  <div className="w-5 h-5 rounded bg-purple-500 border border-purple-600" title="Alto" />
                  <div className="w-5 h-5 rounded bg-purple-600 border border-purple-700" title="Muy alto" />
                </div>
              </div>
              <p className="text-[8px] text-muted-foreground italic">Pasa el cursor para ver detalles</p>
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
