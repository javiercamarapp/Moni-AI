import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    { dimension: 'Ahorro', value: components.savingsAndLiquidity, fullMark: 30, explanation: 'Evalúa tu capacidad de ahorro mensual y liquidez disponible para emergencias' },
    { dimension: 'Deuda', value: components.debt, fullMark: 20, explanation: 'Analiza tu nivel de endeudamiento y tu capacidad para manejar deudas existentes' },
    { dimension: 'Control', value: components.control, fullMark: 20, explanation: 'Mide tu disciplina en el control de gastos y adherencia al presupuesto' },
    { dimension: 'Crecimiento', value: components.growth, fullMark: 15, explanation: 'Considera tus inversiones y estrategias de crecimiento patrimonial' },
    { dimension: 'Hábitos', value: components.behavior, fullMark: 15, explanation: 'Evalúa la consistencia de tus buenos hábitos financieros en el tiempo' }
  ];

  const scoreChange = previousScore ? scoreMoni - previousScore : 0;

  return (
    <div className="space-y-3">
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

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis 
              dataKey="dimension" 
              tick={{ fill: 'white', fontSize: 10 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 30]}
              tick={{ fill: 'white', fontSize: 8 }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.9)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '8px',
                fontSize: '11px'
              }}
              labelStyle={{ color: 'white' }}
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

      <TooltipProvider>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {radarData.map((item, idx) => (
            <UITooltip key={idx}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between cursor-help hover:bg-white/5 rounded px-2 py-1 transition-colors">
                  <span className="text-xs text-white/60">{item.dimension}</span>
                  <span className="text-xs font-medium text-white">
                    {item.value}/{item.fullMark}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-black/95 border-white/20">
                <p className="text-xs text-white">{item.explanation}</p>
              </TooltipContent>
            </UITooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
