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

  // Definir los nodos del camino financiero (hitos importantes)
  const journeyNodes: JourneyNode[] = [
    {
      id: 1,
      title: "Inicio del Camino",
      description: "Nivel 0 - Primeros pasos",
      requiredProgress: 0,
      isUnlocked: true,
      isCurrent: currentProgress < 10,
      isCompleted: currentProgress >= 10
    },
    {
      id: 2,
      title: "Nivel 250",
      description: "10% de la meta alcanzado",
      requiredProgress: 10,
      isUnlocked: currentProgress >= 10,
      isCurrent: currentProgress >= 10 && currentProgress < 20,
      isCompleted: currentProgress >= 20
    },
    {
      id: 3,
      title: "Nivel 500",
      description: "20% de la meta alcanzado",
      requiredProgress: 20,
      isUnlocked: currentProgress >= 20,
      isCurrent: currentProgress >= 20 && currentProgress < 30,
      isCompleted: currentProgress >= 30
    },
    {
      id: 4,
      title: "Nivel 750",
      description: "30% de la meta alcanzado",
      requiredProgress: 30,
      isUnlocked: currentProgress >= 30,
      isCurrent: currentProgress >= 30 && currentProgress < 40,
      isCompleted: currentProgress >= 40
    },
    {
      id: 5,
      title: "Nivel 1000",
      description: "40% de la meta alcanzado",
      requiredProgress: 40,
      isUnlocked: currentProgress >= 40,
      isCurrent: currentProgress >= 40 && currentProgress < 50,
      isCompleted: currentProgress >= 50
    },
    {
      id: 6,
      title: "Nivel 1250",
      description: "50% - Medio camino",
      requiredProgress: 50,
      isUnlocked: currentProgress >= 50,
      isCurrent: currentProgress >= 50 && currentProgress < 60,
      isCompleted: currentProgress >= 60
    },
    {
      id: 7,
      title: "Nivel 1500",
      description: "60% de la meta alcanzado",
      requiredProgress: 60,
      isUnlocked: currentProgress >= 60,
      isCurrent: currentProgress >= 60 && currentProgress < 70,
      isCompleted: currentProgress >= 70
    },
    {
      id: 8,
      title: "Nivel 1750",
      description: "70% de la meta alcanzado",
      requiredProgress: 70,
      isUnlocked: currentProgress >= 70,
      isCurrent: currentProgress >= 70 && currentProgress < 80,
      isCompleted: currentProgress >= 80
    },
    {
      id: 9,
      title: "Nivel 2000",
      description: "80% de la meta alcanzado",
      requiredProgress: 80,
      isUnlocked: currentProgress >= 80,
      isCurrent: currentProgress >= 80 && currentProgress < 90,
      isCompleted: currentProgress >= 90
    },
    {
      id: 10,
      title: "Nivel 2250",
      description: "90% - Casi en la meta",
      requiredProgress: 90,
      isUnlocked: currentProgress >= 90,
      isCurrent: currentProgress >= 90 && currentProgress < 100,
      isCompleted: currentProgress >= 100
    },
    {
      id: 11,
      title: "Nivel 2500",
      description: "¡Libertad Financiera!",
      requiredProgress: 100,
      isUnlocked: currentProgress >= 100,
      isCurrent: currentProgress >= 100,
      isCompleted: false
    }
  ];

  return (
    <div className="min-h-screen animated-wave-bg pb-4">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
            <div className="text-center bg-white/90 p-3 rounded-xl border border-blue-100 shadow-md">
              <p className="text-xs text-foreground/60 font-semibold mb-1">NIVELES</p>
              <p className="text-xl font-bold text-foreground">{targetLevel}</p>
            </div>
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border-2 border-green-400 shadow-lg">
              <p className="text-xs text-green-700 font-semibold mb-1">NIVEL ACTUAL</p>
              <p className="text-xl font-bold text-green-600">{currentLevel}</p>
              <p className="text-[10px] text-green-600/70">NET WORTH</p>
            </div>
            <div className="text-center bg-white/90 p-3 rounded-xl border border-purple-100 shadow-md">
              <p className="text-xs text-foreground/60 font-semibold mb-1">NIVEL ESPERADO</p>
              <p className="text-xl font-bold text-blue-600">{targetLevel}</p>
            </div>
          </div>
        </div>

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
          <div className="space-y-12 relative z-10">
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
                      relative w-12 h-12 rounded-full flex items-center justify-center
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
                      <Star className="h-5 w-5 text-white fill-white" />
                    ) : node.isCurrent ? (
                      <div className="relative">
                        <Star className="h-5 w-5 text-white" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        </div>
                      </div>
                    ) : node.isUnlocked ? (
                      <Target className="h-5 w-5 text-white" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  {/* Progress ring for current node */}
                  {node.isCurrent && (
                    <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 100 100">
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
                    mt-4 p-4 w-full max-w-xs text-center transition-all duration-300 rounded-[20px] shadow-xl
                    ${node.isCurrent 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400' 
                      : node.isUnlocked
                      ? 'bg-white border border-blue-100'
                      : 'bg-white/50 border border-gray-200 opacity-60'
                    }
                  `}
                >
                  <h3 className={`
                    font-bold mb-1
                    ${node.isCurrent ? 'text-green-600' : node.isUnlocked ? 'text-foreground' : 'text-gray-400'}
                  `}>
                    {node.title}
                  </h3>
                  <p className={`
                    text-sm
                    ${node.isUnlocked ? 'text-foreground/70' : 'text-gray-400'}
                  `}>
                    {node.description}
                  </p>
                  
                  {node.isCurrent && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center justify-center gap-2 text-xs text-green-600">
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
                </Card>

                {/* Connector line to next node (except for last node) */}
                {index < journeyNodes.length - 1 && (
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 mt-4" />
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
