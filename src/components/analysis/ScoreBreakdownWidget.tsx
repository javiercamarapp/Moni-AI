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
    { dimension: 'Ahorro', value: components.savingsAndLiquidity, fullMark: 30 },
    { dimension: 'Deuda', value: components.debt, fullMark: 20 },
    { dimension: 'Control', value: components.control, fullMark: 20 },
    { dimension: 'Crecimiento', value: components.growth, fullMark: 15 },
    { dimension: 'Hábitos', value: components.behavior, fullMark: 15 }
  ];

  const scoreChange = previousScore ? scoreMoni - previousScore : 0;

  return (
    <div className="space-y-3">
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

      <div className="grid grid-cols-2 gap-2 pt-2">
        {radarData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-xs text-white/60">{item.dimension}</span>
            <span className="text-xs font-medium text-white">
              {item.value}/{item.fullMark}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
