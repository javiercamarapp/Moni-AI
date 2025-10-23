import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Droplets } from "lucide-react";

interface LiquidityGaugeWidgetProps {
  months: number;
  liquidAssets: number;
  monthlyExpenses: number;
}

export default function LiquidityGaugeWidget({ 
  months, 
  liquidAssets, 
  monthlyExpenses 
}: LiquidityGaugeWidgetProps) {
  const validMonths = months && !isNaN(months) ? Math.max(0, months) : 0;
  const validLiquidAssets = liquidAssets && !isNaN(liquidAssets) ? liquidAssets : 0;
  const validExpenses = monthlyExpenses && !isNaN(monthlyExpenses) && monthlyExpenses > 0 ? monthlyExpenses : 0;

  const maxMonths = 6;
  const percentage = validExpenses > 0 ? Math.min((validMonths / maxMonths) * 100, 100) : 0;
  
  // Determinar nivel de salud financiera
  let status = '';
  let statusColor = '';
  let gaugeColor = '';
  let statusIcon = '';
  
  if (validMonths >= 3) {
    status = 'Saludable';
    statusColor = 'text-emerald-600';
    gaugeColor = '#10b981';
    statusIcon = '✅';
  } else if (validMonths >= 2) {
    status = 'Regular';
    statusColor = 'text-yellow-600';
    gaugeColor = '#eab308';
    statusIcon = '🟡';
  } else if (validMonths >= 1) {
    status = 'Se puede mejorar';
    statusColor = 'text-orange-600';
    gaugeColor = '#f97316';
    statusIcon = '🟠';
  } else {
    status = 'Tomemos acción';
    statusColor = 'text-red-600';
    gaugeColor = '#ef4444';
    statusIcon = '🔴';
  }
  
  const data = [
    { value: percentage, color: gaugeColor },
    { value: 100 - percentage, color: '#e5e7eb' }
  ];

  return (
    <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-xs font-bold text-foreground">💧 Liquidez de Emergencia</p>
          </div>
          <span className={`text-[9px] font-semibold ${statusColor}`}>{statusIcon} {status}</span>
        </div>

        <div className="relative">
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={0}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{
                      filter: index === 0 ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none'
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in" style={{ top: '52%', animationDelay: '0.5s' }}>
            <p className="text-2xl font-bold text-foreground">{validMonths.toFixed(1)}</p>
            <p className="text-[9px] text-muted-foreground">meses</p>
            <p className="text-[7px] text-gray-500">(balance ÷ gasto)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-lg p-1.5 border border-blue-200">
            <p className="text-[8px] text-blue-700 font-medium">Liquidez</p>
            <p className="text-[11px] font-bold text-blue-900">${(validLiquidAssets / 1000).toFixed(1)}k</p>
            <p className="text-[7px] text-gray-500">(efectivo disponible)</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-1.5 border border-purple-200">
            <p className="text-[8px] text-purple-700 font-medium">Gasto/mes</p>
            <p className="text-[11px] font-bold text-purple-900">${(validExpenses / 1000).toFixed(1)}k</p>
          </div>
        </div>

        {validMonths >= 3 && (
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <p className="text-[9px] text-emerald-700 font-semibold">
              {statusIcon} Fondo de emergencia saludable
            </p>
            <p className="text-[7px] text-gray-500">(3-6 meses es ideal)</p>
          </div>
        )}

        {validMonths >= 2 && validMonths < 3 && (
          <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
            <p className="text-[8px] text-yellow-700 font-semibold">{statusIcon} Situación Regular</p>
            <p className="text-[9px] text-yellow-900">
              Tienes ${(validLiquidAssets).toLocaleString('es-MX')}. Te faltan ${((3 * validExpenses) - validLiquidAssets).toLocaleString('es-MX')} para estar saludable
            </p>
            <p className="text-[7px] text-gray-500 mt-0.5">(meta: 3 meses mínimo)</p>
          </div>
        )}

        {validMonths >= 1 && validMonths < 2 && (
          <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
            <p className="text-[8px] text-orange-700 font-semibold">{statusIcon} Se puede mejorar</p>
            <p className="text-[9px] text-orange-900">
              Necesitas ${((3 - validMonths) * validExpenses).toLocaleString('es-MX')} más para alcanzar 3 meses de cobertura
            </p>
            <p className="text-[7px] text-gray-500 mt-0.5">(aumenta tu ahorro mensual)</p>
          </div>
        )}

        {validMonths < 1 && validExpenses > 0 && (
          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
            <p className="text-[8px] text-red-700 font-semibold">{statusIcon} ¡Tomemos acción!</p>
            <p className="text-[9px] text-red-900">
              Situación crítica. Necesitas ${(3 * validExpenses).toLocaleString('es-MX')} para un fondo de emergencia básico
            </p>
            <p className="text-[7px] text-gray-500 mt-0.5">(prioriza crear un colchón de ahorro)</p>
          </div>
        )}
      </div>
    </Card>
  );
}
