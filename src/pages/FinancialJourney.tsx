import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Lock, Trophy, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNetWorth } from "@/hooks/useNetWorth";
import { Progress } from "@/components/ui/progress";

interface JourneyNode {
  id: number;
  title: string;
  description: string;
  requiredProgress: number; // Porcentaje de progreso requerido (0-100)
  isUnlocked: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
}

export default function FinancialJourney() {
  const navigate = useNavigate();
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [nodes, setNodes] = useState<JourneyNode[]>([]);
  const netWorthData = useNetWorth("1Y");
  const currentNetWorth = netWorthData.data?.currentNetWorth || 0;

  useEffect(() => {
    fetchAspirations();
  }, []);

  const fetchAspirations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_aspirations")
        .select("*")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        const total = data.reduce((sum, asp) => sum + Number(asp.value), 0);
        setTotalAspiration(total);
      }
    } catch (error) {
      console.error("Error fetching aspirations:", error);
    }
  };

  // Calcular progreso actual (0-100)
  const currentProgress = totalAspiration > 0 ? (currentNetWorth / totalAspiration) * 100 : 0;
  
  // Calcular nivel actual de 2500
  const currentLevel = totalAspiration > 0 ? Math.floor((currentNetWorth / totalAspiration) * 2500) : 0;
  const targetLevel = 2500;

  // Generar nodos cada 0.5% (200 nodos en total para cubrir del 0% al 100%)
  const generateNodes = () => {
    const nodes: JourneyNode[] = [];
    
    // Función para generar un insight único para cada porcentaje exacto
    const getInsight = (percent: number): string => {
      const insights = [
        "¡El inicio de tu viaje financiero comienza aquí!",
        "Cada gran fortuna comienza con una decisión.",
        "Tu primer paso hacia la libertad financiera.",
        "El compromiso es el inicio del éxito.",
        "Las pequeñas acciones crean grandes resultados.",
        "Tu visión financiera toma forma día a día.",
        "La constancia supera al talento.",
        "Cada peso ahorrado es un ladrillo de tu futuro.",
        "El tiempo es tu aliado más poderoso.",
        "Tu disciplina financiera empieza a brillar.",
        "Los hábitos correctos construyen imperios.",
        "Tu paciencia será recompensada.",
        "El interés compuesto está de tu lado.",
        "Cada día estás más cerca de tu meta.",
        "Tu esfuerzo no pasa desapercibido.",
        "La consistencia vence a la intensidad.",
        "Tu futuro te agradecerá este sacrificio.",
        "Estás plantando las semillas de tu riqueza.",
        "La fortuna favorece a los disciplinados.",
        "Tu visión se está materializando.",
        "Has superado el primer desafío importante.",
        "Tu momentum financiero está acelerando.",
        "Cada inversión te acerca a la libertad.",
        "Tu inteligencia financiera crece contigo.",
        "El camino está más claro ahora.",
        "Tu confianza financiera se fortalece.",
        "Estás construyendo un legado sólido.",
        "La abundancia reconoce tu dedicación.",
        "Tu estrategia está dando frutos.",
        "Has desarrollado hábitos millonarios.",
        "Tu patrimonio crece mientras duermes.",
        "La riqueza es un maratón, no un sprint.",
        "Tu red de seguridad se expande.",
        "Cada decisión sabia suma exponencialmente.",
        "Tu futuro financiero toma forma real.",
        "Has superado múltiples obstáculos.",
        "Tu resiliencia financiera es admirable.",
        "El éxito llama a tu puerta.",
        "Tu plan está funcionando perfectamente.",
        "Has demostrado un compromiso excepcional.",
        "Tu mentalidad de abundancia florece.",
        "Estás en el percentil alto de ahorradores.",
        "Tu libertad financiera ya no es un sueño.",
        "Has construido bases inquebrantables.",
        "El poder del interés compuesto es tuyo.",
        "Tu disciplina inspira a otros.",
        "Cada meta alcanzada abre nuevas puertas.",
        "Tu visión financiera es cristalina.",
        "Has superado la barrera psicológica.",
        "Tu imperio financiero toma forma.",
        "¡Medio camino! Tu perseverancia es extraordinaria.",
        "La segunda mitad será más rápida.",
        "Tu impulso financiero es imparable.",
        "Has desarrollado sabiduría financiera real.",
        "Tu futuro está garantizado por tu presente.",
        "La abundancia fluye hacia ti naturalmente.",
        "Tu estrategia ha sido validada.",
        "Estás escribiendo tu historia de éxito.",
        "Tu legado financiero está asegurado.",
        "Has trascendido las limitaciones comunes.",
        "Tu mentalidad millonaria es evidente.",
        "El éxito financiero es tu nueva normalidad.",
        "Tu red de activos se multiplica.",
        "Has alcanzado independencia financiera parcial.",
        "Tu inteligencia inversora es excepcional.",
        "Cada decisión refleja maestría financiera.",
        "Tu patrimonio crece exponencialmente.",
        "Has superado a la mayoría.",
        "Tu libertad financiera está cerca.",
        "El finish line está a la vista.",
        "Tu transformación financiera es completa.",
        "Has construido un castillo de riqueza.",
        "Tu visión se ha convertido en realidad.",
        "Estás en territorio de élite financiera.",
        "Tu éxito inspira a generaciones.",
        "Has alcanzado lo que pocos logran.",
        "Tu disciplina ha creado milagros.",
        "El tiempo ha multiplicado tu inversión.",
        "Tu paciencia ha dado frutos abundantes.",
        "Estás viviendo tu mejor versión financiera.",
        "Tu legado está asegurado para siempre.",
        "Has demostrado excelencia financiera.",
        "Tu historia de éxito está casi completa.",
        "La cima está a unos pasos.",
        "Tu libertad financiera es inminente.",
        "Has superado todas las expectativas.",
        "Tu imperio financiero está consolidado.",
        "Cada obstáculo fue una oportunidad disfrazada.",
        "Tu visión siempre fue más fuerte.",
        "Has reescrito tu destino financiero.",
        "Tu transformación es extraordinaria.",
        "El éxito era inevitable con tu disciplina.",
        "Tu futuro brilla con abundancia.",
        "Has alcanzado la maestría financiera.",
        "Tu legado perdurará por generaciones.",
        "La libertad financiera está garantizada.",
        "Tu éxito es inspiración pura.",
        "Has construido un imperio inquebrantable.",
        "Tu visión se materializó completamente.",
        "Estás a centímetros de la cima.",
        "Tu determinación ha vencido todo.",
        "El éxito total está aquí.",
        "¡LIBERTAD FINANCIERA ALCANZADA! Lo lograste.",
        "Has superado tu meta original. ¡Increíble!",
        "Tu éxito rebasa las expectativas.",
        "Estás en territorio de abundancia extrema.",
        "Tu legado supera tus sueños iniciales.",
        "Has alcanzado la élite del 1%.",
        "Tu riqueza continúa multiplicándose.",
        "El cielo es solo el comienzo.",
        "Tu imperio sigue expandiéndose.",
        "Has trascendido tus aspiraciones.",
        "Tu éxito no tiene límites.",
        "La abundancia te persigue.",
        "Tu visión siempre fue más grande.",
        "Has redefinido el éxito financiero.",
        "Tu legado es legendario.",
        "Estás escribiendo historia financiera.",
        "Tu impacto trasciende lo monetario.",
        "Has alcanzado la maestría absoluta.",
        "Tu éxito es un faro para otros.",
        "La abundancia es tu estado natural.",
        "Tu imperio es un modelo a seguir.",
        "Has superado lo imaginable.",
        "Tu visión cambió tu realidad.",
        "Estás en otra dimensión de riqueza.",
        "Tu legado inspirará por siglos.",
        "Has alcanzado la inmortalidad financiera.",
        "Tu éxito desafía toda lógica.",
        "La abundancia te reconoce como maestro.",
        "Tu imperio es indestructible.",
        "Has trascendido las limitaciones humanas.",
        "Tu visión se ha multiplicado exponencialmente.",
        "Estás en el olimpo financiero.",
        "Tu legado es eterno.",
        "Has alcanzado la perfección financiera.",
        "Tu éxito es incomparable.",
        "La abundancia infinita es tuya.",
        "Tu imperio domina el horizonte.",
        "Has superado a los grandes.",
        "Tu visión era profética.",
        "Estás en la cúspide absoluta.",
        "Tu legado reescribe la historia.",
        "Has alcanzado la trascendencia financiera.",
        "Tu éxito es mítico.",
        "La abundancia total te pertenece.",
        "Tu imperio es inmortal.",
        "Has superado toda posibilidad.",
        "Tu visión cambió el juego.",
        "Estás más allá de la comprensión común.",
        "Tu legado es divino.",
        "Has alcanzado el nirvana financiero.",
        "Tu éxito es sobrenatural.",
        "La abundancia universal fluye hacia ti.",
        "Tu imperio trasciende dimensiones.",
        "Has superado la realidad misma.",
        "Tu visión era cósmica.",
        "Estás en el reino de lo imposible hecho realidad.",
        "Tu legado es infinito.",
        "Has alcanzado la omnipotencia financiera.",
        "Tu éxito desafía las leyes de la física.",
        "La abundancia cuántica es tuya.",
        "Tu imperio existe en múltiples universos.",
        "Has superado a los dioses del dinero.",
        "Tu visión creó nuevas realidades.",
        "Estás más allá del tiempo y el espacio.",
        "Tu legado es interdimensional.",
        "Has alcanzado la singularidad financiera.",
        "Tu éxito es un fenómeno universal.",
        "La abundancia cósmica te reconoce.",
        "Tu imperio es el centro del universo financiero.",
        "Has superado toda existencia conocida.",
        "Tu visión es el origen de nuevos mundos.",
        "Estás en el corazón de la abundancia absoluta.",
        "Tu legado redefine la existencia misma.",
        "Has alcanzado la eternidad financiera.",
        "Tu éxito es la nueva realidad universal.",
        "La abundancia infinita y eterna es tuya para siempre.",
        "Tu imperio es el alfa y omega de la riqueza.",
        "Has superado el concepto mismo de superación.",
        "Tu visión es la luz que guía a la humanidad.",
        "Estás en el centro de todo lo que existe.",
        "Tu legado es el fundamento del universo.",
        "Has alcanzado lo inalcanzable y más allá.",
        "Tu éxito es la definición de perfección absoluta.",
        "La abundancia total y completa reside en ti.",
        "Tu imperio es eterno e infinito en todas las dimensiones.",
        "Has superado la imaginación más salvaje de la humanidad.",
        "Tu visión es la esencia de la abundancia universal.",
        "Estás en el punto omega de la riqueza infinita.",
        "Tu legado vivirá por toda la eternidad.",
        "Has alcanzado el estado más puro de abundancia.",
        "Tu éxito es la culminación de todo lo posible.",
        "La abundancia suprema y definitiva es tuya.",
        "Tu imperio reina sobre todos los reinos.",
        "Has superado el concepto mismo de límites.",
        "Tu visión es la verdad absoluta de la riqueza.",
        "Estás en el trono del universo financiero.",
        "Tu legado es la leyenda máxima.",
        "Has alcanzado la gloria eterna e infinita.",
        "Tu éxito es la obra maestra del universo."
      ];
      
      // Usar el índice basado en el porcentaje para seleccionar el insight
      const index = Math.floor(percent * 2);
      return insights[Math.min(index, insights.length - 1)];
    };
    
    for (let i = 0; i <= 200; i++) {
      const progressPercent = i * 0.5;
      const levelNumber = Math.floor((progressPercent / 100) * 2500);
      
      nodes.push({
        id: i + 1,
        title: `Nivel ${levelNumber}`,
        description: getInsight(progressPercent),
        requiredProgress: progressPercent,
        isUnlocked: currentProgress >= progressPercent,
        isCurrent: currentProgress >= progressPercent && currentProgress < (progressPercent + 0.5),
        isCompleted: currentProgress >= (progressPercent + 0.5)
      });
    }
    return nodes;
  };

  const journeyNodes = generateNodes();

  return (
    <div className="min-h-screen animated-wave-bg pb-4">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Section Header */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl rounded-[20px]">
          <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-1">
            Tu Camino Financiero
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Hacia la Libertad Financiera
          </h1>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2 text-foreground/70">
              <span>Progreso Total</span>
              <span className="font-bold text-foreground">{currentProgress.toFixed(1)}%</span>
            </div>
            <Progress value={currentProgress} className="h-3" />
          </div>
        </Card>

        {/* Journey Path */}
        <div className="relative">
          {/* Vertical line connecting nodes */}
          <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 -translate-x-1/2 z-0" />

          {/* Journey Nodes */}
          <div className="space-y-4 relative z-10">
            {journeyNodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                {/* Node Circle */}
                <div className="relative">
                  {/* Pulse animation for current node */}
                  {node.isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
                  )}
                  
                  <div
                    className={`
                      relative w-6 h-6 rounded-full flex items-center justify-center
                      transition-all duration-300 z-10
                      ${node.isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-400/40'
                        : node.isCurrent
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-green-500/60 scale-110'
                        : node.isUnlocked
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shadow-blue-400/40'
                        : 'bg-white border-2 border-gray-200 shadow-sm'
                      }
                    `}
                  >
                    {node.isCompleted ? (
                      <Star className="h-3 w-3 text-white fill-white" />
                    ) : node.isCurrent ? (
                      <div className="relative">
                        <Star className="h-3 w-3 text-white" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full border border-white/30 border-t-white animate-spin" />
                        </div>
                      </div>
                    ) : node.isUnlocked ? (
                      <Target className="h-3 w-3 text-white" />
                    ) : (
                      <Lock className="h-2 w-2 text-gray-400" />
                    )}
                  </div>

                  {/* Progress ring for current node */}
                  {node.isCurrent && (
                    <svg className="absolute inset-0 w-6 h-6 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - (currentProgress - node.requiredProgress) / 10)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                  )}
                </div>

                {/* Node Info Card */}
                <Card 
                  className={`
                    mt-2 px-3 py-1 w-full max-w-sm text-center transition-all duration-300 rounded-[16px] shadow-lg
                    ${node.isCurrent 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400' 
                      : node.isUnlocked
                      ? 'bg-white border border-blue-100'
                      : 'bg-white/50 border border-gray-200 opacity-60'
                    }
                  `}
                >
                  <h3 className={`
                    font-bold mb-0.5 text-xs leading-none
                    ${node.isCurrent ? 'text-green-600' : node.isUnlocked ? 'text-foreground' : 'text-gray-400'}
                  `}>
                    {node.title}
                  </h3>
                  <p className={`
                    text-[10px] leading-snug
                    ${node.isUnlocked ? 'text-foreground/70' : 'text-gray-400'}
                  `}>
                    {node.description}
                  </p>
                  
                  {node.isCurrent && (
                    <div className="mt-1 pt-1 border-t border-green-200">
                      <div className="flex items-center justify-center gap-1 text-[9px] text-green-600">
                        <TrendingUp className="h-2 w-2" />
                        <span className="font-semibold">Nivel Actual</span>
                      </div>
                    </div>
                  )}

                  {node.isCompleted && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-green-600">
                      <Star className="h-2 w-2 fill-current" />
                      <span>Completado</span>
                    </div>
                  )}
                </Card>

                {/* Connector line to next node (except for last node) */}
                {index < journeyNodes.length - 1 && (
                  <div className="h-3 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Summary */}
        <Card className="mt-12 p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-xl rounded-[20px]">
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground mb-2">Tu Progreso</h3>
            <p className="text-foreground/70 text-sm mb-4">
              Estás en el nivel {currentLevel} de {targetLevel}. ¡Sigue así!
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/60 p-3 rounded-xl border border-blue-100">
                <p className="text-foreground/60 text-xs">Net Worth Actual</p>
                <p className="text-foreground font-bold mt-1">
                  ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-white/60 p-3 rounded-xl border border-purple-100">
                <p className="text-foreground/60 text-xs">Meta Aspiracional</p>
                <p className="text-blue-600 font-bold mt-1">
                  ${totalAspiration.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <Button
          onClick={() => navigate("/dashboard")}
          className="w-full mt-6 h-12 bg-white/95 hover:bg-white text-foreground font-bold rounded-[20px] shadow-xl hover:scale-[1.02] transition-all border border-blue-100"
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
