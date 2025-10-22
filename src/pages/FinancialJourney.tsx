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

interface Badge {
  level: number;
  name: string;
  description: string;
  icon: any;
  type: 'bronze' | 'silver' | 'gold' | 'diamond' | 'regular' | 'special' | 'mega';
  color: string;
}

export default function FinancialJourney() {
  const navigate = useNavigate();
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [nodes, setNodes] = useState<JourneyNode[]>([]);
  const [expandedNode, setExpandedNode] = useState<number | null>(null);
  const [expandedBadge, setExpandedBadge] = useState<number | null>(null);
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

  const getBadges = (): Badge[] => {
    const badges: Badge[] = [];
    
    // Insignias especiales originales
    badges.push(
      { level: 500, name: "Primer Paso", description: "Has dado tu primer paso hacia la libertad financiera. Cada gran viaje comienza con una decisión valiente.", icon: Sparkles, type: 'regular', color: 'text-blue-500' },
      { level: 1000, name: "Persistente", description: "Tu constancia demuestra verdadera fortaleza. Has superado las primeras barreras y sigues adelante.", icon: Shield, type: 'special', color: 'text-purple-500' },
      { level: 1500, name: "Disciplinado", description: "La disciplina es tu aliada. Has demostrado que puedes mantener el rumbo incluso en momentos difíciles.", icon: Target, type: 'regular', color: 'text-green-500' },
      { level: 2000, name: "Constructor", description: "Estás construyendo las bases sólidas de tu imperio financiero. Cada decisión suma al resultado final.", icon: TrendingUp, type: 'regular', color: 'text-orange-500' },
      { level: 2500, name: "Visionario", description: "¡Logro importante! Tu visión es clara y tu camino está marcado. Has alcanzado un hito significativo.", icon: Crown, type: 'mega', color: 'text-yellow-500' },
      { level: 3000, name: "Determinado", description: "Tu determinación te distingue del resto. No hay obstáculo que pueda detenerte ahora.", icon: Zap, type: 'regular', color: 'text-cyan-500' },
      { level: 3500, name: "Guerrero", description: "Has enfrentado cada desafío con valentía. Tu espíritu guerrero te llevará a la victoria.", icon: Medal, type: 'regular', color: 'text-red-500' },
      { level: 4000, name: "Estratega", description: "Tus decisiones estratégicas están dando frutos. Cada movimiento está calculado hacia el éxito.", icon: Award, type: 'regular', color: 'text-indigo-500' },
      { level: 4500, name: "Campeón", description: "Eres un verdadero campeón financiero. Tu dedicación es inspiración para otros.", icon: Trophy, type: 'regular', color: 'text-amber-500' },
      { level: 5500, name: "Invencible", description: "Tu momentum es imparable. Has desarrollado una mentalidad inquebrantable hacia el éxito.", icon: Rocket, type: 'regular', color: 'text-pink-500' },
      { level: 6000, name: "Líder", description: "Te has convertido en un líder financiero. Tu ejemplo inspira a quienes te rodean.", icon: Star, type: 'regular', color: 'text-violet-500' },
      { level: 6500, name: "Sabio", description: "La sabiduría financiera que has adquirido es invaluable. Cada decisión refleja tu experiencia.", icon: Sparkles, type: 'regular', color: 'text-teal-500' },
      { level: 7000, name: "Innovador", description: "Tu enfoque innovador te diferencia. Has encontrado formas únicas de acelerar tu crecimiento.", icon: Diamond, type: 'regular', color: 'text-fuchsia-500' },
      { level: 7500, name: "Maestro", description: "Has alcanzado la maestría financiera. Tu dominio es evidente en cada resultado.", icon: Award, type: 'regular', color: 'text-lime-500' },
      { level: 8000, name: "Titán", description: "Como un titán, tu presencia financiera es formidable. Pocas personas llegan a este nivel.", icon: Shield, type: 'regular', color: 'text-rose-500' },
      { level: 8500, name: "Legendario", description: "Tu historia es legendaria. Has superado todas las expectativas y alcanzado lo extraordinario.", icon: Medal, type: 'regular', color: 'text-sky-500' },
      { level: 9000, name: "Élite", description: "Perteneces a la élite financiera. Tu éxito es testimonio de tu excelencia sostenida.", icon: Gem, type: 'regular', color: 'text-amber-600' },
      { level: 9500, name: "Excepcional", description: "Tu desempeño es excepcional en todos los sentidos. Estás a un paso de la cumbre absoluta.", icon: Trophy, type: 'regular', color: 'text-purple-600' }
    );
    
    // Medallas de Bronce cada 250 niveles (SIEMPRE, sin excluir)
    for (let level = 250; level < 10000; level += 250) {
      // Solo si no es múltiplo de 500 (para no repetir con plata/oro)
      if (level % 500 !== 0) {
        badges.push({
          level,
          name: `Bronce ${level}`,
          description: `Medalla de bronce por alcanzar el nivel ${level}. Tu constancia te distingue.`,
          icon: Medal,
          type: 'bronze',
          color: 'text-amber-700'
        });
      }
    }
    
    // Medallas de Plata cada 500 niveles (SIEMPRE, incluso si hay insignia)
    for (let level = 500; level <= 10000; level += 500) {
      // Solo si no es múltiplo de 1000 (para no repetir con oro)
      if (level % 1000 !== 0) {
        badges.push({
          level,
          name: `Plata ${level}`,
          description: `Medalla de plata por alcanzar el nivel ${level}. Tu dedicación brilla.`,
          icon: Award,
          type: 'silver',
          color: 'text-gray-400'
        });
      }
    }
    
    // Medallas de Oro cada 1,000 niveles (SIEMPRE, incluso si hay insignia)
    for (let level = 1000; level <= 10000; level += 1000) {
      // Solo si no es diamante
      if (level % 5000 !== 0) {
        badges.push({
          level,
          name: `Oro ${level}`,
          description: `Medalla de oro por alcanzar el nivel ${level}. Tu excelencia es evidente.`,
          icon: Trophy,
          type: 'gold',
          color: 'text-yellow-500'
        });
      }
    }
    
    // Diamantes cada 5,000 niveles (SIEMPRE, incluso si hay insignia)
    badges.push(
      { level: 5000, name: "Diamante 5000", description: "Medalla de diamante por alcanzar el nivel 5000. Un logro extraordinario.", icon: Gem, type: 'diamond', color: 'text-cyan-400' },
      { level: 10000, name: "Diamante Supremo", description: "¡Medalla Diamante Suprema! Has alcanzado la libertad financiera total. Eres inspiración pura.", icon: Gem, type: 'diamond', color: 'text-cyan-400' }
    );
    
    // Ordenar por nivel
    return badges.sort((a, b) => a.level - b.level);
  };

  const getBadgePosition = (level: number, index: number, badgesAtLevel: number, badgeIndexAtLevel: number) => {
    // Calcular el índice del nodo que corresponde exactamente a este nivel
    const nodeIndex = (level / 50) - 1;
    
    // Usar la misma fórmula base que los nodos
    const baseY = 40 + (nodeIndex * 35);
    
    // Determinar el lado basado en el índice de la insignia en ese nivel
    // Si hay múltiples insignias, alternar entre izquierda y derecha
    const side = badgeIndexAtLevel % 2 === 0 ? 'left' : 'right';
    
    // Si hay múltiples insignias en el mismo nivel, espaciarlas verticalmente
    let yOffset = 0;
    if (badgesAtLevel > 1) {
      // Espaciar más para evitar choques (60px entre cada insignia)
      yOffset = (badgeIndexAtLevel - (badgesAtLevel - 1) / 2) * 60;
    }
    
    return { y: baseY + yOffset, side };
  };

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
            {/* Renderizar Insignias */}
            {(() => {
              const allBadges = getBadges();
              
              // Agrupar insignias por nivel para manejar duplicados
              const badgesByLevel = new Map<number, Badge[]>();
              allBadges.forEach(badge => {
                if (!badgesByLevel.has(badge.level)) {
                  badgesByLevel.set(badge.level, []);
                }
                badgesByLevel.get(badge.level)!.push(badge);
              });
              
              // Renderizar todas las insignias agrupadas
              const renderedBadges: JSX.Element[] = [];
              let globalIndex = 0;
              
              badgesByLevel.forEach((badgesAtLevel, level) => {
                badgesAtLevel.forEach((badge, badgeIndexAtLevel) => {
                  const isUnlocked = currentLevel >= badge.level;
                  const BadgeIcon = badge.icon;
                  const position = getBadgePosition(badge.level, globalIndex, badgesAtLevel.length, badgeIndexAtLevel);
                  
                  renderedBadges.push(
                    <div
                      key={`badge-${badge.level}-${badge.type}-${badge.name}`}
                      className={`absolute transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} group`}
                      style={{
                        [position.side]: '1%',
                        top: `${position.y}px`,
                        transform: 'translateY(-50%)',
                        zIndex: 20
                      }}
                    >
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <button
                      onClick={() => {
                        if (isUnlocked) {
                          setExpandedBadge(expandedBadge === badge.level ? null : badge.level);
                          setExpandedNode(null);
                        }
                      }}
                      disabled={!isUnlocked}
                      className="focus:outline-none relative"
                    >
                      <div
                        className={`
                          relative rounded-full flex items-center justify-center
                          transition-all duration-300 border-2 border-white cursor-pointer
                          ${badge.type === 'diamond' ? 'w-14 h-14 bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-400 shadow-2xl' : 
                            badge.type === 'gold' ? 'w-11 h-11 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-xl' : 
                            badge.type === 'silver' ? 'w-9 h-9 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-lg' :
                            badge.type === 'bronze' ? 'w-8 h-8 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-md' :
                            badge.type === 'mega' ? 'w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-xl' : 
                            badge.type === 'special' ? 'w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg' :
                            'w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg'}
                          ${isUnlocked ? 'shadow-lg hover:scale-110 animate-pulse' : 'grayscale cursor-not-allowed opacity-50'}
                        `}
                      >
                        {isUnlocked && (
                          <div className={`absolute inset-0 rounded-full ${
                            badge.type === 'diamond' ? 'bg-cyan-400' : 
                            badge.type === 'gold' ? 'bg-yellow-400' :
                            badge.type === 'silver' ? 'bg-gray-400' :
                            badge.type === 'bronze' ? 'bg-amber-600' :
                            badge.type === 'mega' ? 'bg-yellow-400' :
                            badge.type === 'special' ? 'bg-purple-400' :
                            'bg-blue-400'
                          } animate-ping opacity-30`} />
                        )}
                        <BadgeIcon 
                          className={`${
                            badge.type === 'diamond' ? 'w-7 h-7' :
                            badge.type === 'gold' ? 'w-6 h-6' : 
                            badge.type === 'silver' ? 'w-5 h-5' :
                            badge.type === 'bronze' ? 'w-4 h-4' :
                            badge.type === 'mega' ? 'w-6 h-6' :
                            badge.type === 'special' ? 'w-5 h-5' :
                            'w-5 h-5'
                          } text-white relative z-10 drop-shadow-md`}
                        />
                      </div>
                      {/* Indicador "¡NUEVA!" para insignias recién desbloqueadas */}
                      {isUnlocked && currentLevel < badge.level + 500 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full animate-bounce">
                          ¡NEW!
                        </span>
                      )}
                    </button>
                    
                    {/* Tooltip al hacer hover */}
                    <div 
                      className={`
                        absolute top-full mt-1 opacity-0 group-hover:opacity-100 pointer-events-none
                        text-[10px] font-bold text-center whitespace-nowrap px-2 py-1 rounded-full
                        transition-opacity duration-200
                        ${badge.type === 'diamond' ? 'bg-cyan-100' : 
                          badge.type === 'gold' ? 'bg-yellow-100' : 
                          badge.type === 'mega' ? 'bg-yellow-100' :
                          badge.type === 'special' ? 'bg-purple-100' :
                          'bg-white'}
                        ${isUnlocked ? badge.color : 'text-gray-400'}
                        shadow-md z-30
                      `}
                    >
                      {badge.name}
                    </div>

                    {/* Card de descripción expandida */}
                    {expandedBadge === badge.level && isUnlocked && (
                      <Card 
                        className={`
                          absolute bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl
                          border-0 w-64 animate-scale-in overflow-hidden
                          ${position.side === 'left' ? 'left-full ml-3' : 'right-full mr-3'}
                        `}
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
                            <div
                              className={`
                                rounded-full flex items-center justify-center border-2 border-white shrink-0
                                ${badge.type === 'diamond' ? 'w-14 h-14 bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-400' : 
                                  badge.type === 'gold' ? 'w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500' : 
                                  badge.type === 'silver' ? 'w-10 h-10 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500' :
                                  badge.type === 'bronze' ? 'w-10 h-10 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800' :
                                  badge.type === 'mega' ? 'w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500' :
                                  badge.type === 'special' ? 'w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600' :
                                  'w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600'}
                              `}
                            >
                              <BadgeIcon className={`${
                                badge.type === 'diamond' ? 'w-7 h-7' :
                                badge.type === 'gold' ? 'w-6 h-6' : 
                                badge.type === 'mega' ? 'w-6 h-6' :
                                'w-5 h-5'
                              } text-white`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold ${
                                badge.type === 'diamond' ? 'text-base' : 
                                badge.type === 'gold' ? 'text-sm' : 
                                badge.type === 'mega' ? 'text-base' :
                                'text-sm'
                              } ${badge.color} truncate`}>
                                {badge.name}
                              </h3>
                              <p className="text-[10px] text-muted-foreground">
                                Nivel {badge.level} • {
                                  badge.type === 'diamond' ? 'Diamante' :
                                  badge.type === 'gold' ? 'Oro' :
                                  badge.type === 'silver' ? 'Plata' :
                                  badge.type === 'bronze' ? 'Bronce' :
                                  badge.type === 'mega' ? 'Insignia Especial' :
                                  badge.type === 'special' ? 'Insignia Premium' :
                                  'Insignia'
                                }
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {badge.description}
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
                      );
                      globalIndex++;
                    });
                  });
                  
                  return renderedBadges;
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
