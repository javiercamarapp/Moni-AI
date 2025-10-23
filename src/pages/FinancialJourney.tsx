import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Lock, Trophy, TrendingUp, Target, ArrowLeft, Award, Crown, Gem, Sparkles, Medal, Zap, Rocket, Shield, Diamond } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNetWorth } from "@/hooks/useNetWorth";
import { Progress } from "@/components/ui/progress";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import EarthPlanet3D from "@/components/EarthPlanet3D";

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
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);
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
      @keyframes dash {
        to {
          stroke-dashoffset: -24;
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
      const levelNumber = Math.round((progressPercent / 100) * 10000);
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
          const element = document.getElementById(`node-${currentNode.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [totalAspiration, currentNetWorth]); // Se ejecuta cuando cambian estos valores

  return (
    <div className="min-h-screen animated-wave-bg flex flex-col">
      {/* Header completamente fijo */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-transparent backdrop-blur-sm pt-4 pb-2">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Botón de regresar arriba del card */}
          <div className="mb-3">
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <Card className="p-4 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-[20px] hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <GlowingEffect disabled={false} spread={30} />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">
                Tu Camino Financiero
              </p>
              <h1 className="text-xl font-bold text-foreground">
                Tu deseo, tu realidad
              </h1>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1 text-foreground/70">
                  <span>Progreso Total</span>
                  <span className="font-bold text-foreground">{currentProgress.toFixed(1)}%</span>
                </div>
                <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                    style={{ 
                      width: `${currentProgress}%`,
                      animation: 'electricPulse 2s ease-in-out infinite'
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Zona desplazable de niveles - con altura fija */}
      <div className="flex-1 overflow-y-auto" style={{ marginTop: '180px' }}>
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="relative w-full pb-4 pt-2" style={{ minHeight: '7200px' }}>
          {/* 9 Secciones de fondo */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((section) => (
              <div
                key={`section-${section}`}
                className="w-full h-[800px] relative pointer-events-none"
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
              <linearGradient id="lockedGray" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d1d5db" />
                <stop offset="50%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#6b7280" />
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
              
              // Determinar si ambos nodos están desbloqueados/completados
              const bothUnlocked = (node.isCompleted && prevNode.isCompleted) || 
                                  (node.isCurrent && prevNode.isCompleted);
              
              // Determinar si ambos nodos están bloqueados
              const bothLocked = !node.isUnlocked && !prevNode.isUnlocked;
              
              // Solo dibujar líneas si ambos nodos están en el mismo estado (desbloqueados o bloqueados)
              if (!bothUnlocked && !bothLocked) return null;
              
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
                  stroke={bothUnlocked ? "url(#electricGreen)" : "url(#lockedGray)"}
                  strokeWidth={bothUnlocked ? "5" : "3"}
                  strokeLinecap="round"
                  strokeDasharray={bothLocked ? "8,4" : undefined}
                  filter={bothUnlocked ? "url(#glow)" : undefined}
                  className={bothUnlocked ? "animate-pulse" : ""}
                  style={bothLocked ? {
                    animation: 'dash 2s linear infinite',
                    opacity: 0.4
                  } : undefined}
                />
              );
            })}
          </svg>

          <div className="relative z-10 px-4">
            {/* Insignia de Bronce 250 */}
            {(() => {
              const level250 = 250;
              const nodeIndex = level250 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 45; // 45px abajo del nodo
              const isUnlocked = currentLevel >= level250;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'bronze250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'bronze250' ? null : 'bronze250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-md
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-20" />
                        )}
                        <Medal className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-amber-100 text-amber-700
                        shadow-md z-30
                      `}
                    >
                      Bronce 250
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'bronze250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800">
                              <Medal className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Insigna de Bronce
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                250 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insigna de Bronce 250 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Insignia de Plata 500 */}
            {(() => {
              const level500 = 500;
              const nodeIndex = level500 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 45; // 45px abajo del nodo
              const isUnlocked = currentLevel >= level500;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'silver500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'silver500' ? null : 'silver500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-11 h-11 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-lg
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-400 animate-ping opacity-20" />
                        )}
                        <Award className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-gray-100 text-gray-600
                        shadow-md z-30
                      `}
                    >
                      Plata 500
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'silver500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-600 truncate">
                                Insigna de Plata
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                500 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insigna de Plata 500 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Bronce 750 #2 */}
            {(() => {
              const level750 = 750;
              const nodeIndex = level750 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 45; // 45px abajo del nodo
              const isUnlocked = currentLevel >= level750;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'bronze750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'bronze750' ? null : 'bronze750');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-md
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-20" />
                        )}
                        <Star className="w-5 h-5 text-white relative z-10 drop-shadow-md fill-white" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-amber-100 text-amber-700
                        shadow-md z-30
                      `}
                    >
                      Bronce 750 #2
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'bronze750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800">
                              <Star className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Medalla de Bronce #2
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                750 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Medalla de Bronce 750 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Oro 1000 */}
            {(() => {
              const level1000 = 1000;
              const nodeIndex = level1000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 30; // 30px arriba del nodo
              const isUnlocked = currentLevel >= level1000;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'gold1000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'gold1000' ? null : 'gold1000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20" />
                        )}
                        <Trophy className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-yellow-100 text-yellow-700
                        shadow-md z-30
                      `}
                    >
                      Oro 1000
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'gold1000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Medalla de Oro
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                1000 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Medalla de Oro 1000 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Bronce 1250 #3 */}
            {(() => {
              const level1250 = 1250;
              const nodeIndex = level1250 / 50;
              const badgeY = 40 + (nodeIndex * 35); // Alineado con el nodo
              const isUnlocked = currentLevel >= level1250;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'bronze1250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'bronze1250' ? null : 'bronze1250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-md
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-20" />
                        )}
                        <Shield className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-amber-100 text-amber-700
                        shadow-md z-30
                      `}
                    >
                      Bronce 1250 #3
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'bronze1250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Medalla de Bronce #3
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                1250 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Medalla de Bronce 1250 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Insignia de Plata 1500 #2 */}
            {(() => {
              const level1500 = 1500;
              const nodeIndex = level1500 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 25; // 25px arriba del nodo
              const isUnlocked = currentLevel >= level1500;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'silver1500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'silver1500' ? null : 'silver1500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-11 h-11 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-lg
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-400 animate-ping opacity-20" />
                        )}
                        <Gem className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-gray-100 text-gray-600
                        shadow-md z-30
                      `}
                    >
                      Plata 1500 #2
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'silver1500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500">
                              <Gem className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-600 truncate">
                                Insignia de Plata #2
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                1500 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Plata 1500 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Insignia de Maestría Bronce 1750 #1 */}
            {(() => {
              const level1750 = 1750;
              const nodeIndex = level1750 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 30; // 30px arriba del nodo
              const isUnlocked = currentLevel >= level1750;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'mastery1750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'mastery1750' ? null : 'mastery1750');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-11 h-11 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 shadow-lg
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-20" />
                        )}
                        <Crown className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-amber-100 text-amber-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Bronce 1750 #1
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'mastery1750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900">
                              <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Insignia de Maestría Bronce #1
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                1750 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Maestría Bronce 1750 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Oro 2000 #2 */}
            {(() => {
              const level2000 = 2000;
              const nodeIndex = level2000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 25; // 25px arriba del nodo
              const isUnlocked = currentLevel >= level2000;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'gold2000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'gold2000' ? null : 'gold2000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20" />
                        )}
                        <Award className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-yellow-100 text-yellow-700
                        shadow-md z-30
                      `}
                    >
                      Oro 2000 #2
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'gold2000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Medalla de Oro 2000 #2
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                2000 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Medalla de Oro 2000 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Bronce 2250 #2 */}
            {(() => {
              const level2250 = 2250;
              const nodeIndex = level2250 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 20; // 20px arriba del nodo
              const isUnlocked = currentLevel >= level2250;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'mastery2250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'mastery2250' ? null : 'mastery2250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-11 h-11 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 shadow-lg
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-20" />
                        )}
                        <Crown className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-amber-100 text-amber-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Bronce 2250 #2
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'mastery2250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900">
                              <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Insignia de Maestría Bronce #2
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                2250 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Maestría Bronce 2250 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Plata 2500 #3 */}
            {(() => {
              const level2500 = 2500;
              const nodeIndex = level2500 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 20; // 20px arriba del nodo
              const isUnlocked = currentLevel >= level2500;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'silver2500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'silver2500' ? null : 'silver2500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-11 h-11 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-lg
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-400 animate-ping opacity-20" />
                        )}
                        <Sparkles className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-gray-100 text-gray-600
                        shadow-md z-30
                      `}
                    >
                      Plata 2500 #3
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'silver2500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500">
                              <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-600 truncate">
                                Insignia de Plata #3
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                2500 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Plata 2500 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Bronce 2750 #3 */}
            {(() => {
              const level2750 = 2750;
              const nodeIndex = level2750 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 15; // 15px arriba del nodo
              const isUnlocked = currentLevel >= level2750;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'mastery2750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'mastery2750' ? null : 'mastery2750');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-11 h-11 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 shadow-lg
                          ${isUnlocked ? 'shadow-lg hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-20" />
                        )}
                        <Crown className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-amber-100 text-amber-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Bronce 2750 #3
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'mastery2750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900">
                              <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Insignia de Maestría Bronce #3
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                2750 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Maestría Bronce 2750 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Oro 3000 #3 */}
            {(() => {
              const level3000 = 3000;
              const nodeIndex = level3000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 25; // 25px arriba del nodo
              const isUnlocked = currentLevel >= level3000;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'gold3000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'gold3000' ? null : 'gold3000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20" />
                        )}
                        <Trophy className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-yellow-100 text-yellow-700
                        shadow-md z-30
                      `}
                    >
                      Oro 3000 #3
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'gold3000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Medalla de Oro #3
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                3000 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Medalla de Oro 3000 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Rubí 3250 #1 */}
            {(() => {
              const level3250 = 3250;
              const nodeIndex = level3250 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 10; // 10px abajo del nodo
              const isUnlocked = currentLevel >= level3250;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'ruby3250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'ruby3250' ? null : 'ruby3250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                        )}
                        <Diamond className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-red-100 text-red-700
                        shadow-md z-30
                      `}
                    >
                      Rubí 3250 #1
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'ruby3250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-red-500 via-rose-600 to-pink-700">
                              <Diamond className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Insignia de Rubí #1
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                3250 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Rubí 3250 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría de Plata 3500 #1 */}
            {(() => {
              const level3500 = 3500;
              const nodeIndex = level3500 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 25; // 25px arriba del nodo
              const isUnlocked = currentLevel >= level3500;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'silvermastery3500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'silvermastery3500' ? null : 'silvermastery3500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-400 animate-ping opacity-20" />
                        )}
                        <Crown className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-gray-100 text-gray-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Plata 3500 #1
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'silvermastery3500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600">
                              <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-700 truncate">
                                Insignia de Maestría Plata #1
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                3500 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Maestría Plata 3500 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Medalla de Rubí 3750 #2 */}
            {(() => {
              const level3750 = 3750;
              const nodeIndex = level3750 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 5; // 5px abajo del nodo
              const isUnlocked = currentLevel >= level3750;
              
              return (
                <div
                  className={`absolute right-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'ruby3750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'ruby3750' ? null : 'ruby3750');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                        )}
                        <Diamond className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-red-100 text-red-700
                        shadow-md z-30
                      `}
                    >
                      Rubí 3750 #2
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'ruby3750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden right-full mr-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-red-500 via-rose-600 to-pink-700">
                              <Diamond className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Insignia de Rubí #2
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                3750 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Rubí 3750 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Rubí 4250 #3 */}
            {(() => {
              const level4250 = 4250;
              const nodeIndex = level4250 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 5; // 5px abajo del nodo
              const isUnlocked = currentLevel >= level4250;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'ruby4250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'ruby4250' ? null : 'ruby4250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                        )}
                        <Diamond className="w-6 h-6 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-red-100 text-red-700
                        shadow-md z-30
                      `}
                    >
                      Rubí 4250 #3
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'ruby4250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-red-500 via-rose-600 to-pink-700">
                              <Diamond className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Insignia de Rubí #3
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                4250 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Rubí 4250 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Oro 4000 #1 */}
            {(() => {
              const level4000 = 4000;
              const nodeIndex = level4000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 20; // 20px arriba del nodo
              const isUnlocked = currentLevel >= level4000;
              
              return (
                <div
                  className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'goldmastery4000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'goldmastery4000' ? null : 'goldmastery4000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-600 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20" />
                        )}
                        <Crown className="w-7 h-7 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-yellow-100 text-yellow-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Oro 4000 #1
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'goldmastery4000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
                        style={{
                          top: '0'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-600">
                              <Crown className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Insignia de Maestría Oro #1
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                4000 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Maestría Oro 4000 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Plata 4500 #2 */}
            {(() => {
              const level4500 = 4500;
              const nodeIndex = level4500 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 50; // 50px arriba del nodo
              const isUnlocked = currentLevel >= level4500;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'silvermastery4500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'silvermastery4500' ? null : 'silvermastery4500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-gray-300 via-gray-400 to-slate-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-300 animate-ping opacity-20" />
                        )}
                        <Shield className="w-7 h-7 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-gray-100 text-gray-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Plata 4500 #2
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'silvermastery4500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-48 max-w-[calc(100vw-100px)] animate-scale-in overflow-hidden left-full ml-2 top-1/2 -translate-y-1/2"
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-gray-300 via-gray-400 to-slate-500">
                              <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-700 truncate">
                                Insignia de Maestría Plata #2
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                4500 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Maestría Plata 4500 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría de Rubí 4750 #1 */}
            {(() => {
              const level4750 = 4750;
              const nodeIndex = level4750 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 50; // 50px arriba del nodo
              const isUnlocked = currentLevel >= level4750;
              
              return (
                <div
                  className={`absolute left-[10px] transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    transform: 'translateY(-50%)',
                    zIndex: expandedBadge === 'rubymastery4750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'rubymastery4750' ? null : 'rubymastery4750');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-red-600 via-rose-700 to-pink-800 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                        )}
                        <Award className="w-7 h-7 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-red-100 text-red-700
                        shadow-md z-30
                      `}
                    >
                      Maestría de Rubí 4750 #1
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'rubymastery4750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-60px)] animate-scale-in overflow-hidden left-full ml-3"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-red-600 via-rose-700 to-pink-800">
                              <Award className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Insignia de Maestría de Rubí #1
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                4750 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Insignia de Maestría de Rubí 4750 puntos
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Rubí #2 - Nivel 5250 */}
            {(() => {
              const level5250 = 5250;
              const nodeIndex = level5250 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 50;
              const badgeX = 25;
              const isUnlocked = currentLevel >= level5250;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'rubymastery5250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'rubymastery5250' ? null : 'rubymastery5250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                        )}
                        <Gem className="w-7 h-7 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-red-100 text-red-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Rubí #2
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'rubymastery5250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
                        style={{
                          top: '0'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-red-400 via-rose-500 to-pink-600">
                              <Gem className="w-7 h-7 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Maestría Rubí #2
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                5250 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Has alcanzado el nivel 5,250. Tu dedicación es excepcional.
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría de Diamante 5000 #1 */}
            {(() => {
              const level5000 = 5000;
              const nodeIndex = level5000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 75; // 75px arriba del nodo
              const badgeX = 25; // 25% desde la izquierda
              const isUnlocked = currentLevel >= level5000;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'diamondmastery5000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'diamondmastery5000' ? null : 'diamondmastery5000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-cyan-300 animate-ping opacity-30" />
                        )}
                        <Gem className="w-7 h-7 text-white relative z-10 drop-shadow-md" />
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200 bg-cyan-100 text-cyan-700
                        shadow-md z-30
                      `}
                    >
                      Maestría Diamante 5000 #1
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'diamondmastery5000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
                        style={{
                          top: '0'
                        }}
                      >
                        <GlowingEffect disabled={false} spread={20} />
                        <div className="relative p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500">
                              <Gem className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-cyan-700 truncate">
                                Insignia de Maestría Diamante #1
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                5000 puntos
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            ¡Máximo nivel alcanzado! Has completado el viaje de educación financiera.
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Renderizar Nodos */}
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
                    
                    {/* Último nivel especial con Planeta Tierra 3D */}
                    {node.id === 201 ? (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-40 scale-150" />
                        <div
                          className="relative w-32 h-32 flex items-center justify-center cursor-pointer
                            hover:scale-110 transition-all duration-300"
                          style={{ 
                            filter: 'drop-shadow(0 10px 30px rgba(59, 130, 246, 0.6))'
                          }}
                        >
                          <EarthPlanet3D />
                        </div>
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
    </div>
  );
}
