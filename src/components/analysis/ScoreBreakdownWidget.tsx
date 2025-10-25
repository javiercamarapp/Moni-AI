import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle } from "lucide-react";
import { RetroCarousel, ScoreCard } from "@/components/ui/retro-carousel";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ScorePopup } from "@/components/ui/celebration-confetti";

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
  loadingReason?: boolean;
}

export default function ScoreBreakdownWidget({ components, scoreMoni, changeReason, previousScore, loadingReason }: ScoreBreakdownProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastNotifiedScore, setLastNotifiedScore] = useState<number>(() => {
    // Cargar el último score notificado desde localStorage
    const saved = localStorage.getItem('last_notified_score');
    return saved ? parseInt(saved) : scoreMoni;
  });
  
  const scoreChange = previousScore ? scoreMoni - previousScore : 0;

  useEffect(() => {
    // Solo mostrar si el score actual es diferente al último que notificamos
    if (scoreMoni !== lastNotifiedScore && scoreChange !== 0) {
      setShowCelebration(true);
      setLastNotifiedScore(scoreMoni);
      localStorage.setItem('last_notified_score', scoreMoni.toString());
    }
  }, [scoreMoni]);

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

  return (
    <>
      <ScorePopup 
        show={showCelebration} 
        scoreChange={scoreChange}
        onComplete={() => setShowCelebration(false)}
      />
      
      <div className="space-y-4">
        <motion.div 
          className="bg-white/90 backdrop-blur-md rounded-[24px] shadow-lg border-0 p-5 hover:shadow-xl transition-all duration-300"
          initial={{ scale: 1 }}
          animate={scoreChange > 0 ? { 
            scale: [1, 1.02, 1],
          } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium text-muted-foreground mb-2">Score Moni</p>
          <div className="flex items-baseline gap-2">
            <motion.p 
              className="text-4xl font-bold text-foreground"
              key={scoreMoni}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.5 }}
            >
              {scoreMoni}
            </motion.p>
            <span className="text-base text-muted-foreground">/100</span>
            {scoreChange !== 0 && (
              <motion.span 
                className={`text-sm font-semibold ${scoreChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {scoreChange > 0 ? '↑' : '↓'} {Math.abs(scoreChange)} pts
              </motion.span>
            )}
          </div>
        </motion.div>

      <div className="bg-white/90 backdrop-blur-md rounded-[24px] shadow-lg border-0 p-5 hover:shadow-xl transition-all duration-300">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
              <PolarGrid stroke="rgba(139, 92, 246, 0.1)" />
              <PolarAngleAxis 
                dataKey="dimension" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 30]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
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
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '16px',
                  fontSize: '13px',
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(changeReason || loadingReason) && (
        <div className="bg-gradient-to-br from-purple-50/90 to-violet-50/90 backdrop-blur-md rounded-[24px] p-5 border-0 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-700 mb-1">¿Por qué cambió?</p>
              {loadingReason ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-foreground/70">Analizando cambios...</p>
                </div>
              ) : (
                <p className="text-sm text-foreground/70 leading-relaxed mt-1">{changeReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Desglose por Componente</h3>
        <RetroCarousel 
          items={radarData.map((item, index) => (
            <ScoreCard
              key={item.dimension}
              component={{
                title: item.dimension,
                value: item.value,
                maxValue: item.fullMark,
                description: item.explanation
              }}
              index={index}
            />
          ))}
        />
      </div>
      </div>
    </>
  );
}
