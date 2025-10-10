import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle } from "lucide-react";

interface ScoreComponents {
  savingsAndLiquidity: number;
  debt: number;
  control: number;
  growth: number;
  behavior: number;
}

interface ScoreBreakdownProps {
  components: ScoreComponents;
  scoreMoni: number;
  changeReason?: string;
  previousScore?: number;
}

export default function ScoreBreakdownWidget({ components, scoreMoni, changeReason, previousScore }: ScoreBreakdownProps) {
  const radarData = [
    { 
      dimension: 'Ahorro', 
      value: components.savingsAndLiquidity, 
      fullMark: 30, 
      explanation: 'Ahorro y Liquidez (30 pts): Se evalúa tu tasa de ahorro mensual (% de ingreso que ahorras) y tu fondo de emergencia (meses de gastos cubiertos). Para mejorar: aumenta tu ahorro mensual y mantén 3-6 meses de gastos en efectivo.'
    },
    { 
      dimension: 'Deuda', 
      value: components.debt, 
      fullMark: 20, 
      explanation: 'Manejo de Deudas (20 pts): Se mide tu nivel de endeudamiento vs ingresos y si pagas puntualmente. Para mejorar: reduce deudas de alto interés primero y evita nuevas deudas innecesarias.'
    },
    { 
      dimension: 'Control', 
      value: components.control, 
      fullMark: 20, 
      explanation: 'Control de Gastos (20 pts): Evalúa si cumples tu presupuesto mensual y reduces gastos hormiga. Para mejorar: registra todos tus gastos, define presupuestos por categoría y revísalos semanalmente.'
    },
    { 
      dimension: 'Crecimiento', 
      value: components.growth, 
      fullMark: 15, 
      explanation: 'Crecimiento Patrimonial (15 pts): Considera tus inversiones, activos y estrategias de crecimiento. Para mejorar: destina un % de tus ingresos a inversiones de largo plazo y diversifica tu portafolio.'
    },
    { 
      dimension: 'Hábitos', 
      value: components.behavior, 
      fullMark: 15, 
      explanation: 'Hábitos Financieros (15 pts): Mide la consistencia de tus buenos hábitos como revisar gastos diariamente, actualizar presupuestos y planear compras grandes. Para mejorar: crea rutinas financieras diarias y mensuales.'
    }
  ];

  const scoreChange = previousScore ? scoreMoni - previousScore : 0;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium text-white/80 mb-1">Desglose Score Moni</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-white">{scoreMoni}</p>
          <span className="text-sm text-white/60">/100</span>
          {scoreChange !== 0 && (
            <span className={`text-xs font-medium ${scoreChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {scoreChange > 0 ? '↑' : '↓'} {Math.abs(scoreChange)} pts
            </span>
          )}
        </div>
      </div>

      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis 
              dataKey="dimension" 
              tick={{ fill: 'white', fontSize: 14, fontWeight: 600 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 30]}
              tick={{ fill: 'white', fontSize: 12 }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
              strokeWidth={3}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.9)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '8px',
                fontSize: '13px',
                padding: '12px'
              }}
              labelStyle={{ color: 'white', fontWeight: 'bold' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {changeReason && (
        <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-purple-300 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-purple-200">¿Por qué cambió?</p>
              <p className="text-xs text-white/70 mt-1">{changeReason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <h3 className="text-base font-bold text-white mb-3">Desglose por Componente</h3>
        {radarData.map((item, idx) => (
          <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-white">{item.dimension}</span>
              <span className="text-lg font-bold text-purple-300">
                {item.value}/{item.fullMark}
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{item.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
