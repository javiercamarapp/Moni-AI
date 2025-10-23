import { Card } from "@/components/ui/card";
import { Droplets } from "lucide-react";

interface LiquidityGaugeWidgetProps {
  months: number;
  currentBalance: number;
  monthlyExpenses: number;
}

export default function LiquidityGaugeWidget({ 
  months, 
  currentBalance, 
  monthlyExpenses 
}: LiquidityGaugeWidgetProps) {
  const validMonths = months && !isNaN(months) ? Math.max(0, months) : 0;
  const validBalance = currentBalance && !isNaN(currentBalance) ? currentBalance : 0;
  const validExpenses = monthlyExpenses && !isNaN(monthlyExpenses) && monthlyExpenses > 0 ? monthlyExpenses : 0;

  const maxMonths = 6;
  const percentage = validExpenses > 0 ? Math.min((validMonths / maxMonths) * 100, 100) : 0;

  const status = validMonths >= 3 ? 'Saludable' : validMonths >= 1.5 ? 'Bajo' : 'Crítico';
  const statusColor = validMonths >= 3 ? 'text-emerald-600' : validMonths >= 1.5 ? 'text-amber-600' : 'text-red-600';
  const barColor = validMonths >= 3 ? 'from-emerald-500 to-green-500' : validMonths >= 1.5 ? 'from-amber-500 to-yellow-500' : 'from-red-500 to-orange-500';

  return (
    <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-xs font-bold text-foreground">💧 Liquidez de Emergencia</p>
          </div>
          <span className={`text-[9px] font-semibold ${statusColor}`}>{status}</span>
        </div>

        <div className="text-center py-2">
          <p className="text-3xl font-bold text-foreground animate-scale-in">{validMonths.toFixed(1)}</p>
          <p className="text-[9px] text-muted-foreground">meses de cobertura</p>
          <p className="text-[7px] text-gray-500 mt-0.5">(balance actual ÷ gasto mensual)</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">0 meses</span>
            <span className="text-muted-foreground">6 meses</span>
          </div>
          
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000 ease-out animate-fade-in shadow-lg`}
              style={{ 
                width: `${percentage}%`,
                animation: 'slide-in-right 1s ease-out'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse" />
            </div>
            
            {/* Marcador de 3 meses (recomendado) */}
            <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-400" style={{ left: '50%' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="text-[7px] text-blue-600 font-medium whitespace-nowrap">↓ 3m</span>
              </div>
            </div>
          </div>
          
          <p className="text-[8px] text-center text-gray-500">(meta: 3-6 meses de gastos)</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <p className="text-[8px] text-blue-700 font-medium">Balance actual</p>
            <p className="text-[11px] font-bold text-blue-900">${(validBalance / 1000).toFixed(1)}k</p>
            <p className="text-[7px] text-gray-500">(ahorro disponible)</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
            <p className="text-[8px] text-purple-700 font-medium">Gasto mensual</p>
            <p className="text-[11px] font-bold text-purple-900">${(validExpenses / 1000).toFixed(1)}k</p>
            <p className="text-[7px] text-gray-500">(promedio de egresos)</p>
          </div>
        </div>

        {validMonths < 3 && validExpenses > 0 && (
          <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
            <p className="text-[8px] text-amber-700 font-semibold">⚠️ Recomendación</p>
            <p className="text-[9px] text-amber-900">
              Necesitas ${((3 - validMonths) * validExpenses).toLocaleString('es-MX')} más para alcanzar 3 meses de cobertura
            </p>
          </div>
        )}

        {validMonths >= 3 && (
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <p className="text-[9px] text-emerald-700 font-semibold">
              🎯 ¡Excelente! Tu fondo de emergencia está saludable
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
