import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNetWorth } from "@/hooks/useNetWorth";
import { motion } from "framer-motion";

export default function Logros() {
  const navigate = useNavigate();
  const [totalAspiration, setTotalAspiration] = useState(0);
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

  const currentLevel = totalAspiration > 0 ? Math.floor((currentNetWorth / totalAspiration) * 10000) : 0;
  const currentProgress = totalAspiration > 0 ? (currentNetWorth / totalAspiration) * 100 : 0;

  // Emoji component
  const EmojiIcon = ({ emoji }: { emoji: string }) => {
    return <span className="text-4xl">{emoji}</span>;
  };

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
      level: 3000, 
      name: "Libro Abierto", 
      emoji: "📒", 
      color: "from-purple-400 to-purple-600", 
      description: "Portafolio en crecimiento",
      explanation: "30% alcanzado. Compartes conocimiento y transparencia.",
      growthPercentage: 30.0
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
      level: 4500, 
      name: "Clavija Fija", 
      emoji: "📌", 
      color: "from-orange-400 to-orange-600", 
      description: "Optimización de activos",
      explanation: "Anclas proyectos, haces que permanezcan.",
      growthPercentage: 45.0
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
      level: 6000, 
      name: "Maletín Profesional", 
      emoji: "💼", 
      color: "from-orange-400 to-orange-600", 
      description: "Planificación avanzada",
      explanation: "60% completado. Tu desempeño se ve y se valora como estándar.",
      growthPercentage: 60.0
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
      level: 8000, 
      name: "Cometa Resplandeciente", 
      emoji: "🌠", 
      color: "from-cyan-400 to-cyan-600", 
      description: "Plan a largo plazo",
      explanation: "80% alcanzado. Tu paso deja huella visible para todos.",
      growthPercentage: 80.0
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
      level: 9500, 
      name: "Espacio Infinito", 
      emoji: "🌌", 
      color: "from-yellow-400 to-yellow-600", 
      description: "Élite financiera",
      explanation: "95% completado. No tienes límites visibles, tu proyección es libre.",
      growthPercentage: 95.0
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="mb-4 bg-white/80 backdrop-blur-md rounded-[20px] shadow-lg hover:bg-white text-foreground h-10 w-10 hover:scale-105 transition-all border border-gray-200/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Card className="bg-white/60 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200/50 p-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-3 shadow-lg">
                <span className="text-3xl">🏆</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Tus Logros</h1>
              <p className="text-sm text-muted-foreground">
                Progreso actual: <span className="font-semibold text-foreground">{currentProgress.toFixed(1)}%</span> ({currentLevel} / 10,000)
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
                  className={`
                    p-2 rounded-[16px] transition-all duration-300 overflow-hidden relative
                    ${isUnlocked 
                      ? 'bg-white/70 backdrop-blur-xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-105 cursor-pointer' 
                      : 'bg-white/40 backdrop-blur-md shadow-md border border-gray-300/30 opacity-70'
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
      </div>
    </div>
  );
}
