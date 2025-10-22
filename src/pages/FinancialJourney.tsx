import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Lock, Trophy, TrendingUp, Target, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNetWorth } from "@/hooks/useNetWorth";
import { Progress } from "@/components/ui/progress";
import treasureChest from "@/assets/treasure-chest.png";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface JourneyNode {
  id: number;
  title: string;
  description: string;
  requiredProgress: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  position: { x: number; y: number };
}

export default function FinancialJourney() {
  const navigate = useNavigate();
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [nodes, setNodes] = useState<JourneyNode[]>([]);
  const [expandedNode, setExpandedNode] = useState<number | null>(null);
  const netWorthData = useNetWorth("1Y");
  const currentNetWorth = netWorthData.data?.currentNetWorth || 0;

  useEffect(() => {
    fetchAspirations();
    
    // Add electric pulse animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes electricPulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
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

  const currentProgress = totalAspiration > 0 ? (currentNetWorth / totalAspiration) * 100 : 0;
  const currentLevel = totalAspiration > 0 ? Math.floor((currentNetWorth / totalAspiration) * 10000) : 0;
  const targetLevel = 10000;

  const generateNodes = () => {
    const nodes: JourneyNode[] = [];
    
    const getNodePosition = (index: number) => {
      // Último nivel - centrado y más abajo
      if (index === 200) {
        return {
          x: 50, // Centrado
          y: 7100 // Bien abajo
        };
      }
      
      // Crear un camino completamente aleatorio y orgánico (no uniforme)
      const seed1 = (index * 7919) % 100;
      const seed2 = (index * 3571) % 100;
      const seed3 = (index * 9241) % 100;
      
      // Posición horizontal aleatoria usando más ancho (10% - 90%)
      const baseX = 10 + (seed1 * 0.8); // De 10% a 90% para usar más ancho
      const offsetX = ((seed2 % 20) - 10); // Variación adicional
      
      // Posición vertical más comprimida
      const baseY = 40 + (index * 35); // Reducido a 40 para estar más cerca del recuadro
      const offsetY = (seed3 % 15) - 7; // Variación sutil vertical
      
      return {
        x: Math.min(Math.max(baseX + offsetX, 10), 90), // Rango más amplio
        y: baseY + offsetY
      };
    };
    
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
        "¡LIBERTAD FINANCIERA ALCANZADA! Lo lograste."
      ];
      
      const index = Math.floor(percent * 2) % insights.length;
      return insights[index];
    };
    
    for (let i = 0; i <= 200; i++) {
      const progressPercent = i * 0.5;
      const levelNumber = Math.floor((progressPercent / 100) * 10000);
      const position = getNodePosition(i);
      
      nodes.push({
        id: i + 1,
        title: `Nivel ${levelNumber}`,
        description: getInsight(progressPercent),
        requiredProgress: progressPercent,
        isUnlocked: currentProgress >= progressPercent,
        isCurrent: currentProgress >= progressPercent && currentProgress < (progressPercent + 0.5),
        isCompleted: currentProgress >= (progressPercent + 0.5),
        position
      });
    }
    return nodes;
  };

  const journeyNodes = generateNodes();

  // Scroll automático al nivel actual cuando se carga la página
  useEffect(() => {
    if (journeyNodes.length > 0 && currentProgress > 0) {
      const currentNode = journeyNodes.find(node => node.isCurrent);
      if (currentNode) {
        // Expandir el nodo actual automáticamente
        setExpandedNode(currentNode.id);
        
        // Scroll al nodo actual después de un pequeño delay
        setTimeout(() => {
          const scrollPosition = currentNode.position.y - 200; // 200px de offset para que no quede pegado arriba
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }, 300);
      }
    }
  }, [totalAspiration, currentNetWorth]); // Se ejecuta cuando cambian estos valores

  return (
    <div className="min-h-screen animated-wave-bg pb-4 overflow-y-auto">
      {/* Header fijo con botón de regresar integrado */}
      <div className="sticky top-0 z-40 bg-transparent backdrop-blur-sm pt-4 pb-2">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Botón de regresar arriba del card */}
          <div className="mb-3">
            <Button
              onClick={(e) => {
                e.preventDefault();
                navigate(-1);
              }}
              variant="ghost"
              size="icon"
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-[20px] hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <GlowingEffect disabled={false} spread={30} />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">
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
            </div>
          </Card>
        </div>
      </div>

      {/* Contenedor deslizante del camino */}
      <div className="container mx-auto px-4 max-w-2xl mt-4">
        <div className="relative w-full pb-4 pt-2" style={{ minHeight: '7200px' }}>
          {/* 9 Secciones de fondo */}
          <div className="absolute inset-0 w-full h-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((section) => (
              <div
                key={`section-${section}`}
                className="w-full h-[800px] relative"
                style={{
                  // Aquí puedes agregar imágenes o videos de fondo
                  // backgroundImage: `url('/path-to-image-${section}.jpg')`,
                  // backgroundSize: 'cover',
                  // backgroundPosition: 'center',
                  backgroundColor: section % 2 === 0 ? 'rgba(240, 253, 244, 0.3)' : 'rgba(239, 246, 255, 0.3)'
                }}
              >
                {/* Para video de fondo, descomenta esto:
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src={`/path-to-video-${section}.mp4`} type="video/mp4" />
                </video>
                */}
              </div>
            ))}
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <linearGradient id="electricGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {journeyNodes.map((node, index) => {
              if (index === 0) return null;
              const prevNode = journeyNodes[index - 1];
              
              // Dibujar líneas entre nodos completados O si el nodo actual está en progreso
              const shouldDrawLine = (node.isCompleted && prevNode.isCompleted) || 
                                    (node.isCurrent && prevNode.isCompleted);
              
              if (!shouldDrawLine) return null;
              
              const x1 = prevNode.position.x;
              const y1 = prevNode.position.y;
              const x2 = node.position.x;
              const y2 = node.position.y;
              
              return (
                <line
                  key={`line-${node.id}`}
                  x1={`${x1}%`}
                  y1={y1}
                  x2={`${x2}%`}
                  y2={y2}
                  stroke="url(#electricGreen)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
              );
            })}
          </svg>

          <div className="relative z-10 px-4">
            {journeyNodes.map((node) => (
              <div 
                key={node.id}
                id={`node-${node.id}`}
                className={`absolute transition-all duration-300 ${expandedNode === node.id ? 'z-[100]' : 'z-10'}`}
                style={{
                  left: `${node.position.x}%`,
                  top: `${node.position.y}px`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '60px' // Asegurar espacio mínimo
                }}
              >
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                    className="relative focus:outline-none"
                  >
                     {node.isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
                    )}
                    
                    {/* Último nivel especial con cofre de tesoro */}
                    {node.id === 201 ? (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-40 scale-150" />
                        <div
                          className="relative w-32 h-32 flex items-center justify-center cursor-pointer
                            hover:scale-110 transition-all duration-300"
                        >
                          <img 
                            src={treasureChest} 
                            alt="Cofre del Tesoro - Libertad Financiera" 
                            className="w-full h-full object-contain animate-bounce"
                            style={{ 
                              filter: 'drop-shadow(0 10px 30px rgba(234, 179, 8, 0.6))',
                              animationDuration: '2s'
                            }}
                          />
                        </div>
                        {/* Monedas/galones decorativos flotantes */}
                        <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-yellow-400 animate-bounce shadow-lg shadow-yellow-400/50" style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
                        <div className="absolute -top-6 -left-4 w-6 h-6 rounded-full bg-amber-500 animate-bounce shadow-lg shadow-amber-500/50" style={{ animationDelay: '0.2s', animationDuration: '1.8s' }} />
                        <div className="absolute -bottom-4 -right-6 w-7 h-7 rounded-full bg-yellow-300 animate-bounce shadow-lg shadow-yellow-300/50" style={{ animationDelay: '0.4s', animationDuration: '2s' }} />
                        <div className="absolute -bottom-6 -left-2 w-5 h-5 rounded-full bg-yellow-500 animate-bounce shadow-lg shadow-yellow-500/50" style={{ animationDelay: '0.6s', animationDuration: '1.6s' }} />
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 text-yellow-400 animate-pulse text-2xl">✨</div>
                        <div className="absolute bottom-0 right-0 text-yellow-300 animate-pulse text-xl" style={{ animationDelay: '0.5s' }}>💎</div>
                      </div>
                    ) : (
                      <div
                        className={`
                          relative w-7 h-7 rounded-full flex items-center justify-center cursor-pointer
                          transition-all duration-300 z-10
                          ${node.isCompleted
                            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-md shadow-green-400/30 hover:scale-110'
                            : node.isCurrent
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50 scale-110 hover:scale-125'
                            : node.isUnlocked
                            ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shadow-blue-400/30 hover:scale-110'
                            : 'bg-white border-2 border-gray-200 shadow-sm hover:scale-105'
                          }
                        `}
                      >
                        {node.isCompleted ? (
                          <Star className="h-3.5 w-3.5 text-white fill-white" />
                        ) : node.isCurrent ? (
                          <div className="relative">
                            <Star className="h-3.5 w-3.5 text-white" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            </div>
                          </div>
                        ) : node.isUnlocked ? (
                          <Target className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <Lock className="h-2.5 w-2.5 text-gray-400" />
                        )}
                      </div>
                    )}

                    {node.isCurrent && (
                      <svg className="absolute inset-0 w-7 h-7 -rotate-90 pointer-events-none" viewBox="0 0 100 100">
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
                  </button>

                  {expandedNode === node.id && (
                    <Card 
                      className={`
                        px-3 py-2 w-44 text-center animate-scale-in rounded-[16px] shadow-xl z-50 absolute
                        hover:shadow-2xl transition-all duration-300 overflow-hidden
                        ${node.isCurrent 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400' 
                          : node.isUnlocked
                          ? 'bg-white border border-blue-100'
                          : 'bg-white/50 border border-gray-200 opacity-60'
                        }
                      `}
                      style={{
                        ...(node.position.x < 30 
                          ? { left: '50px', top: '-20px' }  // Muy a la izquierda -> aparece a la derecha
                          : node.position.x > 70
                          ? { right: '50px', top: '-20px' }  // Muy a la derecha -> aparece a la izquierda
                          : node.position.y < 100
                          ? { left: '50%', transform: 'translateX(-50%)', top: '40px' }  // Muy arriba -> abajo
                          : { left: '50%', transform: 'translateX(-50%)', top: '-90px' }  // Normal -> arriba
                        )
                      }}
                    >
                      {node.isCurrent && <GlowingEffect disabled={false} spread={15} />}
                      <div className="relative z-10">
                      <h3 className={`
                        font-bold mb-1 text-sm
                        ${node.isCurrent ? 'text-green-600' : node.isUnlocked ? 'text-foreground' : 'text-gray-400'}
                      `}>
                        {node.title}
                      </h3>
                      <p className={`
                        text-xs leading-tight
                        ${node.isUnlocked ? 'text-foreground/70' : 'text-gray-400'}
                      `}>
                        {node.description}
                      </p>
                      
                      {node.isCurrent && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            <span className="font-semibold">Nivel Actual</span>
                          </div>
                        </div>
                      )}

                      {node.isCompleted && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span>Completado</span>
                        </div>
                      )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
