import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNetWorth } from "@/hooks/useNetWorth";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Logros() {
  const navigate = useNavigate();
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<typeof allBadges[0] | null>(null);
  const netWorthData = useNetWorth("1Y");
  const currentNetWorth = netWorthData.data?.currentNetWorth || 0;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const currentLevel = totalAspiration > 0 ? Math.floor((currentNetWorth / totalAspiration) * 10000) : 0;
  const currentProgress = totalAspiration > 0 ? (currentNetWorth / totalAspiration) * 100 : 0;

  // Sistema de insignias
  const allBadges = [
    { 
      level: 250, 
      name: "Piedra Base", 
      emoji: "🪨", 
      color: "from-blue-400 to-blue-600", 
      description: "Primeros pasos",
      explanation: "Tu primer paso, lo sólido que da inicio al camino.",
      growthPercentage: 2.5
    },
    { 
      level: 500, 
      name: "Conector Sencillo", 
      emoji: "📎", 
      color: "from-blue-400 to-blue-600", 
      description: "Educación financiera",
      explanation: "Empiezas a enlazar ideas y componentes.",
      growthPercentage: 5.0
    },
    { 
      level: 750, 
      name: "Asiento Firmado", 
      emoji: "🪑", 
      color: "from-blue-400 to-blue-600", 
      description: "Progreso inicial",
      explanation: "Tienes tu sitio, te instalas con claridad.",
      growthPercentage: 7.5
    },
    { 
      level: 1000, 
      name: "Ángulo Preciso", 
      emoji: "📐", 
      color: "from-green-400 to-green-600", 
      description: "Control y ahorro",
      explanation: "¡10% alcanzado! Mides, ajustas, haces que todo encaje.",
      growthPercentage: 10.0
    },
    { 
      level: 1250, 
      name: "Ladrillo Sólido", 
      emoji: "🧱", 
      color: "from-green-400 to-green-600", 
      description: "Metas de ahorro",
      explanation: "Estás cumpliendo tus metas de ahorro y viendo crecer tu patrimonio.",
      growthPercentage: 12.5
    },
    { 
      level: 1500, 
      name: "Cuenta Clara", 
      emoji: "🧮", 
      color: "from-green-400 to-green-600", 
      description: "Ahorro consistente",
      explanation: "Llevas registro, das seguimiento con exactitud.",
      growthPercentage: 15.0
    },
    { 
      level: 1750, 
      name: "Gráfico Ascendente", 
      emoji: "📊", 
      color: "from-green-400 to-green-600", 
      description: "Maestría en ahorro",
      explanation: "Tus resultados muestran crecimiento visible.",
      growthPercentage: 17.5
    },
    { 
      level: 2000, 
      name: "Brújula Activa", 
      emoji: "🧭", 
      color: "from-purple-400 to-purple-600", 
      description: "Primeras inversiones",
      explanation: "¡20% completado! Marcas rumbo, defines dirección para otros.",
      growthPercentage: 20.0
    },
    { 
      level: 2500, 
      name: "Ladrillo Maestro", 
      emoji: "🧱", 
      color: "from-purple-400 to-purple-600", 
      description: "Diversificación activa",
      explanation: "Construyes pieza a pieza hacia algo mayor.",
      growthPercentage: 25.0
    },
    { 
      level: 2750, 
      name: "Martillo Constructor", 
      emoji: "🔨", 
      color: "from-purple-400 to-purple-600", 
      description: "Construcción sólida",
      explanation: "Forjas tus objetivos con precisión.",
      growthPercentage: 27.5
    },
    { 
      level: 3000, 
      name: "Libro Abierto", 
      emoji: "📒", 
      color: "from-purple-400 to-purple-600", 
      description: "Portafolio en crecimiento",
      explanation: "30% alcanzado. Compartes conocimiento y transparencia.",
      growthPercentage: 30.0
    },
    { 
      level: 3250, 
      name: "Telescopio Enfocado", 
      emoji: "🔭", 
      color: "from-purple-400 to-purple-600", 
      description: "Visión clara",
      explanation: "Ves más allá, planeas con claridad.",
      growthPercentage: 32.5
    },
    { 
      level: 3500, 
      name: "Satélite Enviado", 
      emoji: "🛰️", 
      color: "from-purple-400 to-purple-600", 
      description: "Estrategia de inversión",
      explanation: "Te conectas al panorama más amplio del sistema.",
      growthPercentage: 35.0
    },
    { 
      level: 4000, 
      name: "Bombilla Iluminada", 
      emoji: "💡", 
      color: "from-orange-400 to-orange-600", 
      description: "Análisis y optimización",
      explanation: "¡40% de tu meta! Traes ideas que iluminan el camino.",
      growthPercentage: 40.0
    },
    { 
      level: 4250, 
      name: "Engranaje Preciso", 
      emoji: "⚙️", 
      color: "from-orange-400 to-orange-600", 
      description: "Sistema optimizado",
      explanation: "Todo funciona con sincronía perfecta.",
      growthPercentage: 42.5
    },
    { 
      level: 4500, 
      name: "Clavija Fija", 
      emoji: "📌", 
      color: "from-orange-400 to-orange-600", 
      description: "Optimización de activos",
      explanation: "Anclas proyectos, haces que permanezcan.",
      growthPercentage: 45.0
    },
    { 
      level: 4750, 
      name: "Llave Maestra", 
      emoji: "🔑", 
      color: "from-orange-400 to-orange-600", 
      description: "Acceso total",
      explanation: "Abres puertas, desbloqueas oportunidades.",
      growthPercentage: 47.5
    },
    { 
      level: 5000, 
      name: "Muro Construido", 
      emoji: "🧱", 
      color: "from-orange-400 to-orange-600", 
      description: "Maestría estratégica",
      explanation: "¡Mitad del camino! Ya no eres parte del muro, eres el muro que todos reconocen.",
      growthPercentage: 50.0
    },
    { 
      level: 5250, 
      name: "Estrella Brillante", 
      emoji: "⭐", 
      color: "from-orange-400 to-orange-600", 
      description: "Destacado",
      explanation: "Tu brillo es visible desde lejos.",
      growthPercentage: 52.5
    },
    { 
      level: 5500, 
      name: "Corona Ganada", 
      emoji: "👑", 
      color: "from-orange-400 to-orange-600", 
      description: "Logro superior",
      explanation: "Tu liderazgo es indiscutible.",
      growthPercentage: 55.0
    },
    { 
      level: 5750, 
      name: "Trofeo Conquistado", 
      emoji: "🏆", 
      color: "from-orange-400 to-orange-600", 
      description: "Victoria estratégica",
      explanation: "Tus logros hablan por ti.",
      growthPercentage: 57.5
    },
    { 
      level: 6000, 
      name: "Maletín Profesional", 
      emoji: "💼", 
      color: "from-orange-400 to-orange-600", 
      description: "Planificación avanzada",
      explanation: "60% completado. Tu desempeño se ve y se valora como estándar.",
      growthPercentage: 60.0
    },
    { 
      level: 6250, 
      name: "Reloj Suizo", 
      emoji: "⌚", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Precisión temporal",
      explanation: "Tu timing es perfecto, nunca fallas.",
      growthPercentage: 62.5
    },
    { 
      level: 6500, 
      name: "Balanza Equilibrada", 
      emoji: "⚖️", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Balance perfecto",
      explanation: "Mantienes todo en armonía.",
      growthPercentage: 65.0
    },
    { 
      level: 6750, 
      name: "Ancla Firme", 
      emoji: "⚓", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Estabilidad absoluta",
      explanation: "Permaneces firme ante cualquier tormenta.",
      growthPercentage: 67.5
    },
    { 
      level: 7000, 
      name: "Moneda Valiosa", 
      emoji: "🪙", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Independencia financiera",
      explanation: "Nivel Visionario alcanzado. Tu valor es claro y cuantificable.",
      growthPercentage: 70.0
    },
    { 
      level: 7250, 
      name: "Cohete Espacial", 
      emoji: "🚀", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Ascenso imparable",
      explanation: "Tu crecimiento no tiene límites.",
      growthPercentage: 72.5
    },
    { 
      level: 7500, 
      name: "Faro Luminoso", 
      emoji: "🗼", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Guía brillante",
      explanation: "Iluminas el camino para otros.",
      growthPercentage: 75.0
    },
    { 
      level: 7750, 
      name: "Gema Preciosa", 
      emoji: "💠", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Valor excepcional",
      explanation: "Tu rareza te hace único.",
      growthPercentage: 77.5
    },
    { 
      level: 8000, 
      name: "Cometa Resplandeciente", 
      emoji: "🌠", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Plan a largo plazo",
      explanation: "80% alcanzado. Tu paso deja huella visible para todos.",
      growthPercentage: 80.0
    },
    { 
      level: 8250, 
      name: "Sol Radiante", 
      emoji: "☀️", 
      color: "from-yellow-400 to-yellow-600", 
      description: "Energía infinita",
      explanation: "Tu poder es la fuente de todo.",
      growthPercentage: 82.5
    },
    { 
      level: 8500, 
      name: "Galaxia Expandida", 
      emoji: "🌌", 
      color: "from-yellow-400 to-yellow-600", 
      description: "Expansión cósmica",
      explanation: "Tu alcance es universal.",
      growthPercentage: 85.0
    },
    { 
      level: 8750, 
      name: "Volcán Activo", 
      emoji: "🌋", 
      color: "from-yellow-400 to-yellow-600", 
      description: "Potencia explosiva",
      explanation: "Tu fuerza es imparable.",
      growthPercentage: 87.5
    },
    { 
      level: 9000, 
      name: "Planeta Conquistado", 
      emoji: "🌍", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Casi libre financieramente",
      explanation: "¡90%! Tu influencia cruza fronteras, abarca mundos.",
      growthPercentage: 90.0
    },
    { 
      level: 9250, 
      name: "Universo Paralelo", 
      emoji: "🌐", 
      color: "from-yellow-400 to-yellow-600", 
      description: "Realidad alternativa",
      explanation: "Creas nuevos mundos con tus decisiones.",
      growthPercentage: 92.5
    },
    { 
      level: 9500, 
      name: "Espacio Infinito", 
      emoji: "🌌", 
      color: "from-yellow-400 to-yellow-600", 
      description: "Élite financiera",
      explanation: "95% completado. No tienes límites visibles, tu proyección es libre.",
      growthPercentage: 95.0
    },
    { 
      level: 9750, 
      name: "Supernova Brillante", 
      emoji: "✨", 
      color: "from-yellow-400 to-yellow-600", 
      description: "Explosión de éxito",
      explanation: "Tu brillo ilumina todo el universo.",
      growthPercentage: 97.5
    },
    { 
      level: 10000, 
      name: "Diamante Supremo", 
      emoji: "💎", 
      color: "from-yellow-400 via-pink-500 to-purple-600", 
      description: "Máximo nivel alcanzado",
      explanation: "¡LO LOGRASTE! Leyenda Moni. Valor excepcional, legado, perfección.",
      growthPercentage: 100.0
    }
  ];

  return (
    <div className="min-h-screen animated-wave-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => navigate("/aspirations-analysis")}
              variant="ghost"
              size="icon"
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Tus Logros</h1>
              <p className="text-sm text-gray-500">Sistema de reconocimientos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl -mt-2">
        {/* Progress Card */}
        <div className="mb-6">
          <Card className="bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg border border-blue-100 p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Progreso actual
              </p>
              <p className="text-lg font-bold text-foreground">
                {currentProgress.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {currentLevel} / 10,000 puntos
              </p>
            </div>
          </Card>
        </div>

        {/* Grid de logros */}
        <div className="grid grid-cols-2 gap-3">
          {allBadges.map((badge, index) => {
            const isUnlocked = currentLevel >= badge.level;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => setSelectedBadge(badge)}
                  className={`
                    p-2 rounded-[16px] transition-all duration-300 overflow-hidden relative
                    ${isUnlocked 
                      ? 'bg-white/70 backdrop-blur-xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-105 cursor-pointer' 
                      : 'bg-white/40 backdrop-blur-md shadow-md border border-gray-300/30 opacity-70 cursor-pointer'
                    }
                  `}
                >
                  {/* Gradient overlay for unlocked badges */}
                  {isUnlocked && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${badge.color} opacity-10 pointer-events-none`} />
                  )}
                  
                  <div className="flex flex-col items-center text-center gap-1 relative z-10">
                    {/* Icono */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isUnlocked 
                        ? `bg-gradient-to-br ${badge.color} shadow-md` 
                        : 'bg-gray-200 shadow-sm'
                      }
                    `}>
                      {isUnlocked ? (
                        <span className="text-2xl">{badge.emoji}</span>
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Nombre */}
                    <h3 className={`
                      text-[10px] font-bold leading-tight
                      ${isUnlocked ? 'text-foreground' : 'text-gray-500'}
                    `}>
                      {badge.name}
                    </h3>

                    {/* Nivel */}
                    <p className={`
                      text-[8px] font-medium
                      ${isUnlocked ? 'text-muted-foreground' : 'text-gray-400'}
                    `}>
                      Nivel {badge.level}
                    </p>

                    {/* Badge de estado */}
                    <div className={`
                      px-1.5 py-0.5 rounded-full text-[7px] font-semibold shadow-sm
                      ${isUnlocked 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}>
                      {isUnlocked ? '✓ DESBLOQUEADO' : '🔒 BLOQUEADO'}
                    </div>

                    {/* Porcentaje */}
                    {isUnlocked && (
                      <p className="text-[8px] text-foreground/70 font-medium">
                        {badge.growthPercentage}% alcanzado
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Dialog de explicación */}
        <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
          <DialogContent className="bg-white/70 backdrop-blur-xl border-gray-200/50 rounded-[24px] shadow-2xl max-w-xs data-[state=open]:animate-scale-in">
            {selectedBadge && (
              <>
                <DialogHeader>
                  <div className="flex flex-col items-center text-center mb-2">
                    {/* Icono */}
                    <div className={`
                      w-14 h-14 rounded-full flex items-center justify-center mb-3
                      ${currentLevel >= selectedBadge.level 
                        ? `bg-gradient-to-br ${selectedBadge.color} shadow-lg` 
                        : 'bg-gray-200 shadow-md'
                      }
                    `}>
                      {currentLevel >= selectedBadge.level ? (
                        <span className="text-3xl">{selectedBadge.emoji}</span>
                      ) : (
                        <Lock className="w-7 h-7 text-gray-400" />
                      )}
                    </div>

                    {/* Título */}
                    <DialogTitle className="text-lg font-bold text-foreground mb-1">
                      {selectedBadge.name}
                    </DialogTitle>

                    {/* Nivel y porcentaje */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Nivel {selectedBadge.level}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {selectedBadge.growthPercentage}%
                      </span>
                    </div>

                    {/* Badge de estado */}
                    <div className={`
                      px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-sm mb-3
                      ${currentLevel >= selectedBadge.level 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {currentLevel >= selectedBadge.level ? '✓ DESBLOQUEADO' : '🔒 BLOQUEADO'}
                    </div>
                  </div>
                </DialogHeader>

                {/* Descripción - Solo si está desbloqueado */}
                <DialogDescription asChild>
                  <div className="space-y-3">
                    {currentLevel >= selectedBadge.level ? (
                      <>
                        <div className="bg-white/50 backdrop-blur-md rounded-[16px] p-3 border border-gray-200/30">
                          <h4 className="text-xs font-bold text-foreground mb-1">Descripción</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedBadge.description}
                          </p>
                        </div>

                        <div className="bg-white/50 backdrop-blur-md rounded-[16px] p-3 border border-gray-200/30">
                          <h4 className="text-xs font-bold text-foreground mb-1">Significado</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedBadge.explanation}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[16px] p-3 border border-blue-200/50">
                        <h4 className="text-xs font-bold text-foreground mb-1">Para desbloquear</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Alcanza el {selectedBadge.growthPercentage}% de tus aspiraciones para desbloquear este logro.
                        </p>
                      </div>
                    )}
                  </div>
                </DialogDescription>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
