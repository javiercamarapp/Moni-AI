import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Lock, Trophy, TrendingUp, Target, ArrowLeft, Award, Crown, Gem, Sparkles, Medal, Zap, Rocket, Shield, Diamond, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNetWorth } from "@/hooks/useNetWorth";
import { Progress } from "@/components/ui/progress";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import EarthPlanet3D from "@/components/EarthPlanet3D";
import spaceBackground from "@/assets/space-background.jpg";
import { motion } from "framer-motion";
import { CelebrationConfetti } from "@/components/ui/celebration-confetti";
import { JourneyCelebration } from "@/components/ui/journey-celebration";

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
  
  // Estado para celebraciones
  const [showProgressCelebration, setShowProgressCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [lastCelebratedProgress, setLastCelebratedProgress] = useState<number>(() => {
    const saved = localStorage.getItem('last_celebrated_journey_progress');
    return saved ? parseFloat(saved) : 0;
  });
  const [lastCelebratedBadges, setLastCelebratedBadges] = useState<number[]>(() => {
    const saved = localStorage.getItem('last_celebrated_badges');
    return saved ? JSON.parse(saved) : [];
  });
  const [hasSeenNotification, setHasSeenNotification] = useState(() => {
    return localStorage.getItem('journey_notification_seen') === 'true';
  });

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

  // Detectar avance de 0.5% y celebrar - solo la primera vez por sesión
  useEffect(() => {
    if (currentProgress > 0) {
      const currentMilestone = Math.floor(currentProgress / 0.5) * 0.5;
      const lastMilestone = Math.floor(lastCelebratedProgress / 0.5) * 0.5;
      
      // Si hay un nuevo avance, resetear la notificación vista y mostrar
      if (currentMilestone > lastMilestone && currentProgress > lastCelebratedProgress) {
        setCelebrationMessage(`Avanzaste al ${currentMilestone.toFixed(1)}%`);
        setShowProgressCelebration(true);
        setHasSeenNotification(false); // Resetear para que se pueda ver
        localStorage.setItem('journey_notification_seen', 'false');
        setLastCelebratedProgress(currentProgress);
        localStorage.setItem('last_celebrated_journey_progress', currentProgress.toString());
        
        // Marcar como vista después de 5 segundos
        setTimeout(() => {
          setHasSeenNotification(true);
          localStorage.setItem('journey_notification_seen', 'true');
          setShowProgressCelebration(false);
        }, 5000);
      }
    }
  }, [currentProgress]);

  // Detectar desbloqueo de badges y celebrar - solo la primera vez por sesión
  const badgeLevels = [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
  useEffect(() => {
    // Solo mostrar la última insignia desbloqueada
    const unlockedBadges = badgeLevels.filter(level => 
      currentLevel >= level && !lastCelebratedBadges.includes(level)
    );
    
    if (unlockedBadges.length > 0) {
      const latestBadge = Math.max(...unlockedBadges);
      const badgeNames: Record<number, string> = {
        250: "Piedra Base 🪨",
        500: "Conector Sencillo 📎",
        750: "Herramienta Básica 🔧",
        1000: "Eslabón Fuerte ⛓️",
        1500: "Engranaje Industrial ⚙️",
        2000: "Estructura de Acero 🏗️",
        2500: "Oro Refinado 💰",
        3000: "Rayo de Energía ⚡",
        4000: "Cohete de Innovación 🚀",
        5000: "Estrella Brillante ⭐",
        6000: "Corona Imperial 👑",
        7000: "Cristal Precioso 💎",
        8000: "Escudo Supremo 🛡️",
        9000: "Joya del Infinito 💍",
        10000: "Planeta de Libertad 🌍"
      };
      
      setCelebrationMessage(`Insignia desbloqueada: ${badgeNames[latestBadge]}`);
      setShowProgressCelebration(true);
      setHasSeenNotification(false); // Resetear para que se pueda ver
      localStorage.setItem('journey_notification_seen', 'false');
      
      const newBadges = [...lastCelebratedBadges, ...unlockedBadges];
      setLastCelebratedBadges(newBadges);
      localStorage.setItem('last_celebrated_badges', JSON.stringify(newBadges));
      
      // Marcar como vista después de 5 segundos
      setTimeout(() => {
        setHasSeenNotification(true);
        localStorage.setItem('journey_notification_seen', 'true');
        setShowProgressCelebration(false);
      }, 5000);
    }
  }, [currentLevel]);

  const generateNodes = () => {
    const nodes: JourneyNode[] = [];
    
    const getNodePosition = (index: number) => {
      // Último nivel - centrado y más abajo
      if (index === 200) {
        return {
          x: 50, // Centrado
          y: 7150 // Posición final ajustada para que el globo sea lo último
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
    <>
      <div 
        className="min-h-screen flex flex-col relative"
        style={{
          backgroundImage: `url(${spaceBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
      {/* Header completamente fijo */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-transparent backdrop-blur-sm pt-4 pb-2">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Botón de regresar arriba del card */}
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="icon"
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Mostrar notificación o botón de análisis */}
            {showProgressCelebration ? (
              <JourneyCelebration 
                show={showProgressCelebration}
                message={celebrationMessage}
                onComplete={() => setShowProgressCelebration(false)}
              />
            ) : (
              <Button
                type="button"
                onClick={() => navigate('/aspirations-analysis')}
                className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground h-10 px-4 hover:scale-105 transition-all border border-blue-100"
              >
                <Target className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Análisis</span>
              </Button>
            )}
          </div>
          
          <Card className="p-3 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-[20px] hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <GlowingEffect disabled={false} spread={30} />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-0.5">
                Tu Camino Financiero
              </p>
              
              {/* Net Worth */}
              <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-lg hover:scale-105 hover:bg-white/30 hover:border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-[9px] text-muted-foreground">Actual:</p>
                      <p className="text-xs font-semibold text-foreground">
                        ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-[9px] text-muted-foreground">Objetivo:</p>
                      <p className="text-xs font-semibold text-primary">
                        ${totalAspiration.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/edit-aspirations")}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-lg hover:scale-105 hover:bg-white/30 hover:border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
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
      <div className="flex-1 overflow-y-auto relative" style={{ marginTop: '180px' }}>

        <div className="container mx-auto px-4 max-w-2xl">
          <div className="relative w-full pb-4 pt-2" style={{ minHeight: '7300px' }}>
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
                          transition-all duration-300 border-2 border-slate-300 cursor-pointer
                          bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 shadow-lg shadow-amber-500/60
                          ${isUnlocked ? 'shadow-xl hover:scale-110 hover:shadow-amber-400/80' : 'grayscale cursor-not-allowed opacity-40'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30" />
                        )}
                        <span className="text-2xl">🪨</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'bronze250' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-amber-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Piedra Base
                      </div>
                    )}

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
                              <span className="text-xl">🪨</span>
                            </div>
                            <div className="flex-1 min-w-0">
                               <h3 className="font-bold text-sm text-amber-700 truncate">
                                Piedra Base
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 250
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Tu primer paso, lo sólido que da inicio al camino.
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
                          transition-all duration-300 border-2 border-slate-300 cursor-pointer
                          bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-lg shadow-gray-400/60
                          ${isUnlocked ? 'shadow-xl hover:scale-110 hover:shadow-gray-300/80' : 'grayscale cursor-not-allowed opacity-40'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-300 animate-ping opacity-30" />
                        )}
                        <span className="text-2xl">📎</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'silver500' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-100 text-gray-600
                          shadow-md z-30
                        `}
                      >
                        Conector Sencillo
                      </div>
                    )}

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
                              <span className="text-xl">📎</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-600 truncate">
                                Conector Sencillo
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 500
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Empiezas a enlazar ideas y componentes.
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
                          transition-all duration-300 border-2 border-slate-300 cursor-pointer
                          bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 shadow-lg shadow-amber-500/60
                          ${isUnlocked ? 'shadow-xl hover:scale-110 hover:shadow-amber-400/80' : 'grayscale cursor-not-allowed opacity-40'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30" />
                        )}
                        <span className="text-2xl">🪑</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'bronze750' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-amber-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Asiento Firmado
                      </div>
                    )}

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
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700">
                              <span className="text-xl">🪑</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Asiento Firmado
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 750
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Tienes tu sitio, te instalas con claridad.
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
                          transition-all duration-300 border-2 border-slate-300 cursor-pointer
                          bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-xl shadow-yellow-400/70
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 hover:shadow-yellow-300/90' : 'grayscale cursor-not-allowed opacity-40'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-yellow-300 animate-ping opacity-30" />
                        )}
                        <span className="text-3xl">📐</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'gold1000' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-yellow-100 text-yellow-700
                          shadow-md z-30
                        `}
                      >
                        Ángulo Preciso
                      </div>
                    )}

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
                              <span className="text-2xl">📐</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Ángulo Preciso
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 1000
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Mides, ajustas, haces que todo encaje.
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
                        <span className="text-2xl">🧱</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'bronze1250' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-amber-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Bloque Fundamental
                      </div>
                    )}

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
                              <span className="text-xl">🧱</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Bloque Fundamental
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 1250
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Eres parte de la estructura que sostiene.
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
                        <span className="text-3xl">🧮</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'silver1500' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-100 text-gray-600
                          shadow-md z-30
                        `}
                      >
                        Cuenta Clara
                      </div>
                    )}

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
                              <span className="text-2xl">🧮</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-600 truncate">
                                Cuenta Clara
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 1500
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Llevas registro, das seguimiento con exactitud.
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
                        <span className="text-3xl">📊</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'mastery1750' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-amber-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Gráfico Ascendente
                      </div>
                    )}

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
                              <span className="text-2xl">📊</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Gráfico Ascendente
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 1750
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Tus resultados muestran crecimiento visible.
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
                        <span className="text-3xl">🧭</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'gold2000' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-yellow-100 text-yellow-700
                          shadow-md z-30
                        `}
                      >
                        Brújula Activa
                      </div>
                    )}

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
                              <span className="text-2xl">🧭</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Brújula Activa
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 2000
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Marcas rumbo, defines dirección para otros.
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
                        <span className="text-3xl">🔑</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'mastery2250' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-amber-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Llave Maestra
                      </div>
                    )}

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
                              <span className="text-2xl">🔑</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Llave Maestra
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 2250
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Tienes la capacidad de abrir nuevas puertas.
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
                        <span className="text-3xl">🧱</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'silver2500' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-100 text-gray-600
                          shadow-md z-30
                        `}
                      >
                        Ladrillo Maestro
                      </div>
                    )}

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
                              <span className="text-2xl">🧱</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-600 truncate">
                                Ladrillo Maestro
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 2500
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Construyes pieza a pieza hacia algo mayor.
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
                        <span className="text-3xl">📦</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'mastery2750' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-amber-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Caja Completa
                      </div>
                    )}

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
                              <span className="text-2xl">📦</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-amber-700 truncate">
                                Caja Completa
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 2750
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Tus entregas están listas y completas.
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
                        <span className="text-3xl">📒</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'gold3000' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-yellow-100 text-yellow-700
                          shadow-md z-30
                        `}
                      >
                        Libro Abierto
                      </div>
                    )}

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
                              <span className="text-2xl">📒</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Libro Abierto
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 3000
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Compartes conocimiento y transparencia.
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
                          transition-all duration-300 border-2 border-slate-300 cursor-pointer
                          bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 shadow-xl shadow-pink-500/70
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 hover:shadow-pink-400/90' : 'grayscale cursor-not-allowed opacity-40'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-30" />
                        )}
                        <span className="text-3xl">🖥️</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'ruby3250' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-red-100 text-red-700
                          shadow-md z-30
                        `}
                      >
                        Pantalla Clara
                      </div>
                    )}

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
                              <span className="text-2xl">🖥️</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Pantalla Clara
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 3250
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Presentas ideas de forma visible y accesible.
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
                        <span className="text-3xl">🛰️</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'silvermastery3500' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-100 text-gray-700
                          shadow-md z-30
                        `}
                      >
                        Satélite Enviado
                      </div>
                    )}

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
                              <span className="text-2xl">🛰️</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-700 truncate">
                                Satélite Enviado
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 3500
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Te conectas al panorama más amplio del sistema.
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
                        <span className="text-3xl">🚀</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'ruby3750' && (
                      <div 
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-red-100 text-red-700
                          shadow-md z-30
                        `}
                      >
                        Cohete Despegue
                      </div>
                    )}

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
                              <span className="text-2xl">🚀</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Cohete Despegue
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 3750
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Tu impacto comienza a alcanzar altura.
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
                        <span className="text-3xl">🧩</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'ruby4250' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-red-100 text-red-700
                          shadow-md z-30
                        `}
                      >
                        Pieza Clave
                      </div>
                    )}

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
                              <span className="text-2xl">🧩</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Pieza Clave
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 4250
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Eres indispensable para que el conjunto funcione.
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
                          transition-all duration-300 border-2 border-slate-300 cursor-pointer
                          bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 shadow-xl shadow-yellow-400/70
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 hover:shadow-yellow-300/90' : 'grayscale cursor-not-allowed opacity-40'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-yellow-300 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">💡</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'goldmastery4000' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-yellow-100 text-yellow-700
                          shadow-md z-30
                        `}
                      >
                        Bombilla Iluminada
                      </div>
                    )}

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
                              <span className="text-3xl">💡</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-yellow-700 truncate">
                                Bombilla Iluminada
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 4000
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Traes ideas que iluminan el camino.
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
                        <span className="text-4xl">📌</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'silvermastery4500' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-100 text-gray-700
                          shadow-md z-30
                        `}
                      >
                        Clavija Fija
                      </div>
                    )}

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
                              <span className="text-3xl">📌</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-700 truncate">
                                Clavija Fija
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 4500
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Anclas proyectos, haces que permanezcan.
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
                        <span className="text-4xl">📍</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'rubymastery4750' && (
                      <div 
                        className={`
                          absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-red-100 text-red-700
                          shadow-md z-30
                        `}
                      >
                        Hito Señalado
                      </div>
                    )}

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
                              <span className="text-3xl">📍</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Hito Señalado
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 4750
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Dejas un punto de referencia para que otros sigan.
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
                        <span className="text-4xl">🎯</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'rubymastery5250' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-red-100 text-red-700
                          shadow-md z-30
                        `}
                      >
                        Diana Impactada
                      </div>
                    )}

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
                              <span className="text-3xl">🎯</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Diana Impactada
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 5250
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Alcanzas objetivos con precisión.
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Plata #3 - Nivel 5500 */}
            {(() => {
              const level5500 = 5500;
              const nodeIndex = level5500 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 100;
              const badgeX = 75;
              const isUnlocked = currentLevel >= level5500;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'silvermastery5500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'silvermastery5500' ? null : 'silvermastery5500');
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
                          bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-400 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🪜</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'silvermastery5500' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-100 text-gray-600
                          shadow-md z-30
                        `}
                      >
                        Escalón Superado
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'silvermastery5500' && isUnlocked && (
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
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shrink-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500">
                              <span className="text-3xl">🪜</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-gray-600 truncate">
                                Escalón Superado
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 5500
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Has subido de nivel, avanzas sin mirar atrás.
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Oro #2 - Nivel 6000 */}
            {(() => {
              const level6000 = 6000;
              const nodeIndex = level6000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 40;
              const badgeX = 75;
              const isUnlocked = currentLevel >= level6000;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'goldmastery6000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'goldmastery6000' ? null : 'goldmastery6000');
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
                          bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">💼</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'goldmastery6000' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-yellow-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Maletín Profesional
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'goldmastery6000' && isUnlocked && (
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                              <span className="text-xl">💼</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Maletín Profesional</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Tu desempeño se ve y se valora como estándar.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-700 bg-yellow-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">💼</span>
                            <span>Nivel 6,000</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Platino #1 - Nivel 6250 */}
            {(() => {
              const level6250 = 6250;
              const nodeIndex = level6250 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 40;
              const badgeX = 10;
              const isUnlocked = currentLevel >= level6250;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'platinum6250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'platinum6250' ? null : 'platinum6250');
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
                          bg-gradient-to-br from-slate-300 via-gray-400 to-zinc-500 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-slate-400 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">📜</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'platinum6250' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-slate-100 text-slate-700
                          shadow-md z-30
                        `}
                      >
                        Pergamino Honorario
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'platinum6250' && isUnlocked && (
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 via-gray-400 to-zinc-500 flex items-center justify-center shrink-0">
                              <span className="text-xl">📜</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Pergamino Honorario</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Reconocimiento formal por tu trayectoria.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">📜</span>
                            <span>Nivel 6,250</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Black #1 - Nivel 6500 */}
            {(() => {
              const level6500 = 6500;
              const nodeIndex = level6500 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 60;
              const badgeX = 80;
              const isUnlocked = currentLevel >= level6500;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'black6500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'black6500' ? null : 'black6500');
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
                          bg-gradient-to-br from-gray-900 via-black to-gray-800 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-700 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🏆</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'black6500' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-900 text-white
                          shadow-md z-30
                        `}
                      >
                        Trofeo Real
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'black6500' && isUnlocked && (
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center shrink-0">
                              <span className="text-xl">🏆</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Trofeo Real</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Logro que trasciende lo habitual.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-white bg-gray-900 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🏆</span>
                            <span>Nivel 6,500</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Platino #2 - Nivel 6750 */}
            {(() => {
              const level6750 = 6750;
              const nodeIndex = level6750 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 20;
              const badgeX = 25;
              const isUnlocked = currentLevel >= level6750;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'platinum6750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'platinum6750' ? null : 'platinum6750');
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
                          bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-slate-500 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🌌</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'platinum6750' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-slate-100 text-slate-700
                          shadow-md z-30
                        `}
                      >
                        Galaxia Abierta
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'platinum6750' && isUnlocked && (
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 flex items-center justify-center shrink-0">
                              <span className="text-xl">🌌</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Galaxia Abierta</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Observas, exploras y te expandes más allá de lo común.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🌌</span>
                            <span>Nivel 6,750</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Oro #3 - Nivel 7000 */}
            {(() => {
              const level7000 = 7000;
              const nodeIndex = level7000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 55;
              const badgeX = 70;
              const isUnlocked = currentLevel >= level7000;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'goldmastery7000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'goldmastery7000' ? null : 'goldmastery7000');
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
                          bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-600 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🪙</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'goldmastery7000' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-yellow-100 text-amber-700
                          shadow-md z-30
                        `}
                      >
                        Moneda Valiosa
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'goldmastery7000' && isUnlocked && (
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-600 flex items-center justify-center shrink-0">
                              <span className="text-xl">🪙</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Moneda Valiosa</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Tu valor es claro y cuantificable.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-700 bg-yellow-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🪙</span>
                            <span>Nivel 7,000</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Platino #3 - Nivel 7250 */}
            {(() => {
              const level7250 = 7250;
              const nodeIndex = level7250 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 10;
              const badgeX = 12;
              const isUnlocked = currentLevel >= level7250;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'platinum7250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'platinum7250' ? null : 'platinum7250');
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
                          bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-slate-600 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🧬</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'platinum7250' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-slate-100 text-slate-700
                          shadow-md z-30
                        `}
                      >
                        Código Genético
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'platinum7250' && isUnlocked && (
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700 flex items-center justify-center shrink-0">
                              <span className="text-xl">🧬</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Código Genético</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Tu marca personal se ha convertido en parte de la esencia.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🧬</span>
                            <span>Nivel 7,250</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Black #2 - Nivel 7500 */}
            {(() => {
              const level7500 = 7500;
              const nodeIndex = level7500 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 20;
              const badgeX = 80;
              const isUnlocked = currentLevel >= level7500;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'black7500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'black7500' ? null : 'black7500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-gray-800 cursor-pointer
                          bg-gradient-to-br from-black via-gray-900 to-zinc-950 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-gray-900 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">⚜️</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'black7500' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-gray-900 text-white
                          shadow-md z-30
                        `}
                      >
                        Fleur-de-lis Noble
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'black7500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-black via-gray-900 to-zinc-950 flex items-center justify-center shrink-0">
                              <span className="text-xl">⚜️</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Fleur-de-lis Noble</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Elegancia, prestigio y categoría.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">⚜️</span>
                            <span>Nivel 7,500</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría de Platino #1 - Nivel 7750 */}
            {(() => {
              const level7750 = 7750;
              const nodeIndex = level7750 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 15;
              const badgeX = 15;
              const isUnlocked = currentLevel >= level7750;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'platinummastery7750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'platinummastery7750' ? null : 'platinummastery7750');
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
                          bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 shadow-xl
                          ${isUnlocked ? 'shadow-xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-slate-500 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">👑</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'platinummastery7750' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-slate-100 text-slate-700
                          shadow-md z-30
                        `}
                      >
                        Corona Soberana
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'platinummastery7750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 flex items-center justify-center shrink-0">
                              <span className="text-xl">👑</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Corona Soberana</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Liderazgo rotundo, presencia imponente.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">👑</span>
                            <span>Nivel 7,750</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestro 👑 - Nivel 8000 */}
            {(() => {
              const level8000 = 8000;
              const nodeIndex = level8000 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 25;
              const badgeX = 85;
              const isUnlocked = currentLevel >= level8000;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'maestro8000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'maestro8000' ? null : 'maestro8000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-12 h-12 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-yellow-300 cursor-pointer
                          bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🌠</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'maestro8000' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-yellow-100 text-amber-800
                          shadow-md z-30
                        `}
                      >
                        Cometa Resplandeciente
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'maestro8000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                              <span className="text-xl">🌠</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Cometa Resplandeciente</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Tu paso deja huella visible para todos.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-800 bg-yellow-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🌠</span>
                            <span>Nivel 8,000</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Escudo Legendario - Nivel 8250 */}
            {(() => {
              const level8250 = 8250;
              const nodeIndex = level8250 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 30;
              const badgeX = 15;
              const isUnlocked = currentLevel >= level8250;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'shield8250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'shield8250' ? null : 'shield8250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-14 h-14 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-yellow-300 cursor-pointer
                          bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🛡️</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'shield8250' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-green-100 text-green-800
                          shadow-md z-30
                        `}
                      >
                        Escudo Legendario
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'shield8250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center shrink-0">
                              <span className="text-2xl">🛡️</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Escudo Legendario</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Proteges, sostienes y lideras con integridad.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-green-800 bg-green-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🛡️</span>
                            <span>Nivel 8,250</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Brújula Maestra - Nivel 8500 */}
            {(() => {
              const level8500 = 8500;
              const nodeIndex = level8500 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 30;
              const badgeX = 80;
              const isUnlocked = currentLevel >= level8500;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'compass8500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'compass8500' ? null : 'compass8500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-14 h-14 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-blue-300 cursor-pointer
                          bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🧭</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'compass8500' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-blue-100 text-blue-800
                          shadow-md z-30
                        `}
                      >
                        Brújula Maestra
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'compass8500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                              <span className="text-2xl">🧭</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Brújula Maestra</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            No sólo marcas rumbo, lo escribes para otros.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🧭</span>
                            <span>Nivel 8,500</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Caja Diamantina - Nivel 8750 */}
            {(() => {
              const level8750 = 8750;
              const nodeIndex = level8750 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 60;
              const badgeX = 25;
              const isUnlocked = currentLevel >= level8750;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'box8750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'box8750' ? null : 'box8750');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-14 h-14 rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-red-300 cursor-pointer
                          bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🧧</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'box8750' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-red-100 text-red-800
                          shadow-md z-30
                        `}
                      >
                        Caja Diamantina
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'box8750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 flex items-center justify-center shrink-0">
                              <span className="text-2xl">🧧</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Caja Diamantina</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Guardas secretos, riquezas de valor intangible.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-red-800 bg-red-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🧧</span>
                            <span>Nivel 8,750</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Planeta Conquistado - Nivel 9000 */}
            {(() => {
              const level9000 = 9000;
              const nodeIndex = level9000 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 20;
              const badgeX = 75;
              const isUnlocked = currentLevel >= level9000;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'planet9000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'planet9000' ? null : 'planet9000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-16 h-16 rounded-full flex items-center justify-center
                          transition-all duration-300 border-3 border-cyan-300 cursor-pointer
                          bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-30" />
                        )}
                        <span className="text-5xl">🌍</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'planet9000' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-cyan-100 text-cyan-900
                          shadow-md z-30
                        `}
                      >
                        Planeta Conquistado
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'planet9000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 flex items-center justify-center shrink-0">
                              <span className="text-3xl">🌍</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Planeta Conquistado</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Tu influencia cruza fronteras, abarca mundos.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-900 bg-cyan-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🌍</span>
                            <span>Nivel 9,000</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Nave Estelar - Nivel 9250 */}
            {(() => {
              const level9250 = 9250;
              const nodeIndex = level9250 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 50;
              const badgeX = 15;
              const isUnlocked = currentLevel >= level9250;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'ship9250' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'ship9250' ? null : 'ship9250');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-16 h-16 rounded-full flex items-center justify-center
                          transition-all duration-300 border-3 border-purple-300 cursor-pointer
                          bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-30" />
                        )}
                        <span className="text-5xl">🛸</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'ship9250' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-purple-100 text-purple-900
                          shadow-md z-30
                        `}
                      >
                        Nave Estelar
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'ship9250' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 flex items-center justify-center shrink-0">
                              <span className="text-3xl">🛸</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Nave Estelar</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Viajas más allá, innovas y exploras lo desconocido.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-purple-900 bg-purple-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🛸</span>
                            <span>Nivel 9,250</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Espacio Infinito - Nivel 9500 */}
            {(() => {
              const level9500 = 9500;
              const nodeIndex = level9500 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 30;
              const badgeX = 70;
              const isUnlocked = currentLevel >= level9500;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'space9500' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'space9500' ? null : 'space9500');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-16 h-16 rounded-full flex items-center justify-center
                          transition-all duration-300 border-3 border-indigo-300 cursor-pointer
                          bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30" />
                        )}
                        <span className="text-5xl">🌌</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'space9500' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-indigo-100 text-indigo-900
                          shadow-md z-30
                        `}
                      >
                        Espacio Infinito
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'space9500' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 flex items-center justify-center shrink-0">
                              <span className="text-3xl">🌌</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Espacio Infinito</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            No tienes límites visibles, tu proyección es libre.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-900 bg-indigo-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">🌌</span>
                            <span>Nivel 9,500</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Diamante Imponente - Nivel 9750 */}
            {(() => {
              const level9750 = 9750;
              const nodeIndex = level9750 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 25;
              const badgeX = 75;
              const isUnlocked = currentLevel >= level9750;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'diamond9750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'diamond9750' ? null : 'diamond9750');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-16 h-16 rounded-full flex items-center justify-center
                          transition-all duration-300 border-3 border-cyan-300 cursor-pointer
                          bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-2xl
                          ${isUnlocked ? 'shadow-2xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-30" />
                        )}
                        <span className="text-5xl">💠</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'diamond9750' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-cyan-100 text-cyan-900
                          shadow-md z-30
                        `}
                      >
                        Diamante Imponente
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'diamond9750' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                              <span className="text-3xl">💠</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Diamante Imponente</h3>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                            Ya eres sinónimo de brillo, dureza y exclusividad.
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-900 bg-cyan-50 px-2 py-1 rounded-full w-fit">
                            <span className="text-sm">💠</span>
                            <span>Nivel 9,750</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Diamante Supremo - Nivel 10000 (MÁXIMO) */}
            {(() => {
              const level10000 = 10000;
              const nodeIndex = level10000 / 50;
              const badgeY = 40 + (nodeIndex * 35) + 10;
              const badgeX = 20;
              const isUnlocked = currentLevel >= level10000;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'supreme10000' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'supreme10000' ? null : 'supreme10000');
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative w-20 h-20 rounded-full flex items-center justify-center
                          transition-all duration-300 border-4 border-pink-300 cursor-pointer
                          bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 shadow-3xl
                          ${isUnlocked ? 'shadow-3xl hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <>
                            <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-40" />
                            <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-30 animation-delay-150" />
                          </>
                        )}
                        <span className="text-6xl">💎</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'supreme10000' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[11px] font-bold text-center whitespace-nowrap px-3 py-1.5 rounded-full
                          transition-opacity duration-200 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-900
                          shadow-lg z-30 border border-pink-200
                        `}
                      >
                        💎 Diamante Supremo 💎
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'supreme10000' && isUnlocked && (
                      <Card 
                        className="absolute bg-white/95 backdrop-blur-sm rounded-[24px] shadow-2xl
                          border-2 border-pink-200 w-72 max-w-[calc(100vw-40px)] animate-scale-in overflow-hidden top-full mt-3 left-1/2 -translate-x-1/2"
                      >
                        <GlowingEffect disabled={false} spread={30} />
                        <div className="relative p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBadge(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                          >
                            ✕
                          </button>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
                              <span className="text-4xl">💎</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                                Diamante Supremo
                              </h3>
                              <p className="text-xs text-purple-600 font-semibold">Nivel Máximo</p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed font-medium">
                            ¡Felicitaciones! Has alcanzado el nivel más alto: valor excepcional, legado, perfección.
                          </p>
                          
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 rounded-full shadow-md">
                            <span className="text-lg">💎</span>
                            <span>NIVEL 10,000 - MÁXIMO</span>
                            <span className="text-lg">💎</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Maestría Rubí #3 - Nivel 5750 */}
            {(() => {
              const level5750 = 5750;
              const nodeIndex = level5750 / 50;
              const badgeY = 40 + (nodeIndex * 35) - 30;
              const badgeX = 20;
              const isUnlocked = currentLevel >= level5750;
              
              return (
                <div
                  className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                  style={{
                    top: `${badgeY}px`,
                    left: `${badgeX}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: expandedBadge === 'rubymastery5750' ? 100 : 20
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === 'rubymastery5750' ? null : 'rubymastery5750');
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
                          <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
                        )}
                        <span className="text-4xl">🧪</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'rubymastery5750' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-red-100 text-red-700
                          shadow-md z-30
                        `}
                      >
                        Experimento Éxito
                      </div>
                    )}

                    {/* Card de descripción expandida */}
                    {expandedBadge === 'rubymastery5750' && isUnlocked && (
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
                              <span className="text-3xl">🧪</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-red-700 truncate">
                                Experimento Éxito
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 5750
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Lo que probaste ya funciona y aporta.
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
                        <span className="text-4xl">🧱</span>
                      </div>
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    {isUnlocked && expandedBadge !== 'diamondmastery5000' && (
                      <div 
                        className={`
                          absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none
                          text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                          transition-opacity duration-200 bg-cyan-100 text-cyan-700
                          shadow-md z-30
                        `}
                      >
                        Muro Construido
                      </div>
                    )}

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
                              <span className="text-3xl">🧱</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-cyan-700 truncate">
                                Muro Construido
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel 5000
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Ya no eres parte del muro, eres el muro que todos reconocen.
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
                          transition-all duration-300 z-10 border border-white/20
                          ${node.isCompleted
                            ? 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500 shadow-lg shadow-slate-400/50 hover:scale-110 hover:shadow-slate-300/60'
                            : node.isCurrent
                            ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 shadow-xl shadow-cyan-400/70 scale-110 hover:scale-125 animate-pulse'
                            : node.isUnlocked
                            ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 shadow-md shadow-blue-500/40 hover:scale-110'
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-sm hover:scale-105'
                          }
                        `}
                      >
                        {node.isCompleted ? (
                          <Star className="h-3.5 w-3.5 text-white fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        ) : node.isCurrent ? (
                          <div className="relative">
                            <Star className="h-3.5 w-3.5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            </div>
                          </div>
                        ) : node.isUnlocked ? (
                          <Target className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                        ) : (
                          <Lock className="h-2.5 w-2.5 text-gray-500" />
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
                          stroke="rgba(34,211,238,0.4)"
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
                          ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-400' 
                          : node.isUnlocked
                          ? 'bg-white/95 backdrop-blur-sm border border-blue-300 shadow-blue-500/30'
                          : 'bg-gray-900/90 backdrop-blur-md border border-slate-600 shadow-lg shadow-slate-700/50'
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
                        ${node.isCurrent ? 'text-cyan-600' : node.isUnlocked ? 'text-foreground' : 'text-slate-200'}
                      `}>
                        {node.title}
                      </h3>
                      <p className={`
                        text-xs leading-tight
                        ${node.isUnlocked ? 'text-foreground/70' : 'text-slate-300'}
                      `}>
                        {node.description}
                      </p>
                      
                      {node.isCurrent && (
                        <div className="mt-2 pt-2 border-t border-cyan-200">
                          <div className="flex items-center justify-center gap-1 text-xs text-cyan-600">
                            <TrendingUp className="h-3 w-3" />
                            <span className="font-semibold">Nivel Actual</span>
                          </div>
                        </div>
                      )}

                       {node.isCompleted && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-300">
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
    </>
  );
}
