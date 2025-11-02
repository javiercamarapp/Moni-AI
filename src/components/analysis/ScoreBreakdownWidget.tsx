import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, TrendingDown, TrendingUp, Info } from "lucide-react";
import { RetroCarousel, ScoreCard } from "@/components/ui/retro-carousel";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ScorePopup } from "@/components/ui/celebration-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const scoreChange = previousScore ? scoreMoni - previousScore : 0;
  
  // Calcular los componentes previos desde localStorage o usar valores por defecto
  const previousComponents = {
    savingsAndLiquidity: 10,
    debt: 8,
    control: 7,
    growth: 5,
    behavior: 5
  };

  useEffect(() => {
    // Solo mostrar si el score actual es diferente al último que notificamos
    if (scoreMoni !== lastNotifiedScore && scoreChange !== 0) {
      setShowCelebration(true);
      setLastNotifiedScore(scoreMoni);
      localStorage.setItem('last_notified_score', scoreMoni.toString());
    }
  }, [scoreMoni]);

  const getComponentDetails = (componentKey: string, current: number, previous: number) => {
    const change = current - previous;
    const details: Record<string, any> = {
      savingsAndLiquidity: {
        title: 'Ahorro y Liquidez',
        icon: '💰',
        reasons: change < 0 ? [
          'Tu tasa de ahorro mensual disminuyó este periodo',
          'Tus gastos aumentaron más que tus ingresos',
          'Tu fondo de emergencia se redujo',
          'Menor consistencia en aportes al ahorro'
        ] : [
          'Aumentaste tu tasa de ahorro mensual',
          'Redujiste gastos innecesarios',
          'Fortaleciste tu fondo de emergencia',
          'Mayor disciplina en tus aportes'
        ],
        tips: [
          'Establece una meta de ahorro del 20% de tus ingresos',
          'Automatiza transferencias a tu cuenta de ahorro',
          'Mantén 3-6 meses de gastos en tu fondo de emergencia',
          'Revisa y ajusta gastos variables cada semana'
        ]
      },
      debt: {
        title: 'Manejo de Deudas',
        icon: '💳',
        reasons: change < 0 ? [
          'Aumentó tu nivel de endeudamiento vs ingresos',
          'Nuevas deudas de alto interés fueron contraídas',
          'Pagos mínimos en lugar de amortizar capital',
          'Incremento en el uso de tarjetas de crédito'
        ] : [
          'Redujiste tu nivel de endeudamiento',
          'Pagaste deudas de alto interés',
          'Mayor disciplina en pagos puntuales',
          'Evitaste nuevas deudas innecesarias'
        ],
        tips: [
          'Prioriza pagar deudas con mayor tasa de interés',
          'Evita usar más del 30% de tu línea de crédito',
          'Consolida deudas para obtener mejor tasa',
          'Crea un plan de pago acelerado para cada deuda'
        ]
      },
      control: {
        title: 'Control de Gastos',
        icon: '📊',
        reasons: change < 0 ? [
          'Superaste tu presupuesto en varias categorías',
          'Aumento en gastos hormiga (cafés, apps, etc.)',
          'Menor registro de transacciones diarias',
          'Compras impulsivas sin planificación'
        ] : [
          'Cumpliste tu presupuesto mensual',
          'Redujiste gastos hormiga significativamente',
          'Mayor disciplina en registro de gastos',
          'Planificación mejorada de compras grandes'
        ],
        tips: [
          'Define presupuestos claros por categoría',
          'Registra TODOS tus gastos diariamente',
          'Revisa tus gastos semanalmente',
          'Establece alertas cuando te acerques al límite'
        ]
      },
      growth: {
        title: 'Crecimiento Patrimonial',
        icon: '📈',
        reasons: change < 0 ? [
          'Disminuyó el valor de tus inversiones',
          'No realizaste nuevas inversiones este periodo',
          'Activos sin generar rendimientos',
          'Menor diversificación de portafolio'
        ] : [
          'Crecimiento en el valor de tus inversiones',
          'Nuevas inversiones de largo plazo',
          'Mejor diversificación de activos',
          'Rendimientos positivos consistentes'
        ],
        tips: [
          'Destina al menos 10% de ingresos a inversiones',
          'Diversifica entre acciones, bonos y otros activos',
          'Invierte en fondos indexados de bajo costo',
          'Reinvierte dividendos y ganancias'
        ]
      },
      behavior: {
        title: 'Hábitos Financieros',
        icon: '🎯',
        reasons: change < 0 ? [
          'Menor consistencia en revisión de finanzas',
          'No actualizaste presupuestos este mes',
          'Menos seguimiento de metas financieras',
          'Decisiones financieras reactivas vs proactivas'
        ] : [
          'Mayor consistencia en revisión diaria',
          'Actualizaste presupuestos regularmente',
          'Mejor seguimiento de metas',
          'Decisiones financieras más planificadas'
        ],
        tips: [
          'Revisa tus gastos 5 minutos cada día',
          'Actualiza presupuestos el primer día del mes',
          'Define metas SMART (específicas y medibles)',
          'Programa recordatorios para revisiones semanales'
        ]
      }
    };
    return details[componentKey];
  };

  const radarData = [
    { 
      dimension: 'Ahorro',
      componentKey: 'savingsAndLiquidity',
      value: components.savingsAndLiquidity,
      previousValue: previousComponents.savingsAndLiquidity,
      fullMark: 30, 
      explanation: 'Ahorro y Liquidez (30 pts): Se evalúa tu tasa de ahorro mensual (% de ingreso que ahorras) y tu fondo de emergencia (meses de gastos cubiertos). Para mejorar: aumenta tu ahorro mensual y mantén 3-6 meses de gastos en efectivo.'
    },
    { 
      dimension: 'Deuda',
      componentKey: 'debt',
      value: components.debt,
      previousValue: previousComponents.debt,
      fullMark: 20, 
      explanation: 'Manejo de Deudas (20 pts): Se mide tu nivel de endeudamiento vs ingresos y si pagas puntualmente. Para mejorar: reduce deudas de alto interés primero y evita nuevas deudas innecesarias.'
    },
    { 
      dimension: 'Control',
      componentKey: 'control',
      value: components.control,
      previousValue: previousComponents.control,
      fullMark: 20, 
      explanation: 'Control de Gastos (20 pts): Evalúa si cumples tu presupuesto mensual y reduces gastos hormiga. Para mejorar: registra todos tus gastos, define presupuestos por categoría y revísalos semanalmente.'
    },
    { 
      dimension: 'Crecimiento',
      componentKey: 'growth',
      value: components.growth,
      previousValue: previousComponents.growth,
      fullMark: 15, 
      explanation: 'Crecimiento Patrimonial (15 pts): Considera tus inversiones, activos y estrategias de crecimiento. Para mejorar: destina un % de tus ingresos a inversiones de largo plazo y diversifica tu portafolio.'
    },
    { 
      dimension: 'Hábitos',
      componentKey: 'behavior',
      value: components.behavior,
      previousValue: previousComponents.behavior,
      fullMark: 15, 
      explanation: 'Hábitos Financieros (15 pts): Mide la consistencia de tus buenos hábitos como revisar gastos diariamente, actualizar presupuestos y planear compras grandes. Para mejorar: crea rutinas financieras diarias y mensuales.'
    }
  ];

  const handleComponentClick = (item: any) => {
    const details = getComponentDetails(item.componentKey, item.value, item.previousValue);
    setSelectedComponent({
      ...item,
      ...details,
      change: item.value - item.previousValue
    });
    setShowDetailsDialog(true);
  };

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
        <h3 className="text-lg font-semibold text-foreground mb-2">Desglose por Componente</h3>
        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Toca cada tarjeta para ver detalles de cambios
        </p>
        <RetroCarousel 
          items={radarData.map((item, index) => (
            <div key={item.dimension} onClick={() => handleComponentClick(item)} className="cursor-pointer">
              <ScoreCard
                component={{
                  title: item.dimension,
                  value: item.value,
                  maxValue: item.fullMark,
                  description: item.explanation
                }}
                index={index}
              />
            </div>
          ))}
        />
      </div>
      
      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[400px] rounded-3xl border-none shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
              {selectedComponent?.icon} {selectedComponent?.title}
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-2xl font-bold text-foreground">
                  {selectedComponent?.value}/{selectedComponent?.fullMark}
                </span>
                {selectedComponent?.change !== 0 && (
                  <span className={`flex items-center gap-1 text-sm font-semibold ${
                    selectedComponent?.change > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {selectedComponent?.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {selectedComponent?.change > 0 ? '+' : ''}{selectedComponent?.change} pts
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Razones del cambio */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                {selectedComponent?.change < 0 ? '📉 ¿Por qué bajó?' : '📈 ¿Por qué mejoró?'}
              </h4>
              <ul className="space-y-2">
                {selectedComponent?.reasons?.slice(0, 3).map((reason: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Tips para mejorar */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                💡 Cómo mejorar este rubro
              </h4>
              <ul className="space-y-2">
                {selectedComponent?.tips?.slice(0, 3).map((tip: string, idx: number) => (
                  <li key={idx} className="text-xs text-purple-700 flex items-start gap-2">
                    <span className="font-bold mt-0.5">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
