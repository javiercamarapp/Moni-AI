import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Lock, Trophy, TrendingUp, Target, Gem } from "lucide-react";
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

  // Definir los nodos del camino financiero
  const journeyNodes: JourneyNode[] = [
    {
      id: 1,
      title: "Primeros Pasos",
      description: "Comienza tu viaje financiero",
      requiredProgress: 0,
      isUnlocked: true,
      isCurrent: currentProgress < 10,
      isCompleted: currentProgress >= 10
    },
    {
      id: 2,
      title: "Construyendo Base",
      description: "10% de tu meta alcanzado",
      requiredProgress: 10,
      isUnlocked: currentProgress >= 10,
      isCurrent: currentProgress >= 10 && currentProgress < 25,
      isCompleted: currentProgress >= 25
    },
    {
      id: 3,
      title: "Ganando Impulso",
      description: "25% de tu meta alcanzado",
      requiredProgress: 25,
      isUnlocked: currentProgress >= 25,
      isCurrent: currentProgress >= 25 && currentProgress < 40,
      isCompleted: currentProgress >= 40
    },
    {
      id: 4,
      title: "Medio Camino",
      description: "40% de tu meta alcanzado",
      requiredProgress: 40,
      isUnlocked: currentProgress >= 40,
      isCurrent: currentProgress >= 40 && currentProgress < 60,
      isCompleted: currentProgress >= 60
    },
    {
      id: 5,
      title: "Avanzando Fuerte",
      description: "60% de tu meta alcanzado",
      requiredProgress: 60,
      isUnlocked: currentProgress >= 60,
      isCurrent: currentProgress >= 60 && currentProgress < 75,
      isCompleted: currentProgress >= 75
    },
    {
      id: 6,
      title: "Casi Allí",
      description: "75% de tu meta alcanzado",
      requiredProgress: 75,
      isUnlocked: currentProgress >= 75,
      isCurrent: currentProgress >= 75 && currentProgress < 90,
      isCompleted: currentProgress >= 90
    },
    {
      id: 7,
      title: "Meta Alcanzada",
      description: "90%+ de tu meta alcanzado",
      requiredProgress: 90,
      isUnlocked: currentProgress >= 90,
      isCurrent: currentProgress >= 90 && currentProgress < 100,
      isCompleted: currentProgress >= 100
    },
    {
      id: 8,
      title: "Libertad Financiera",
      description: "¡Has superado tus aspiraciones!",
      requiredProgress: 100,
      isUnlocked: currentProgress >= 100,
      isCurrent: currentProgress >= 100,
      isCompleted: false
    }
  ];

  const currentLevel = journeyNodes.findIndex(node => node.isCurrent) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/aspirations-analysis")}
            className="hover:bg-white/10 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1.5 rounded-full">
              <Gem className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">{Math.round(currentProgress)}</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-full">
              <Trophy className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-bold text-blue-400">Nivel {currentLevel}</span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">
            Tu Camino Financiero
          </p>
          <h1 className="text-2xl font-bold">
            Hacia la Libertad Financiera
          </h1>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso Total</span>
              <span className="font-bold">{currentProgress.toFixed(1)}%</span>
            </div>
            <Progress value={currentProgress} className="h-3 bg-white/30" />
          </div>
        </Card>

        {/* Journey Path */}
        <div className="relative">
          {/* Vertical line connecting nodes */}
          <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-slate-700 -translate-x-1/2 z-0" />

          {/* Journey Nodes */}
          <div className="space-y-12 relative z-10">
            {journeyNodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                {/* Node Circle */}
                <div className="relative">
                  {/* Pulse animation for current node */}
                  {node.isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
                  )}
                  
                  <div
                    className={`
                      relative w-24 h-24 rounded-full flex items-center justify-center
                      transition-all duration-300 z-10
                      ${node.isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50'
                        : node.isCurrent
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-green-500/60 scale-110'
                        : node.isUnlocked
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/40'
                        : 'bg-slate-700 border-2 border-slate-600'
                      }
                    `}
                  >
                    {node.isCompleted ? (
                      <Star className="h-10 w-10 text-white fill-white" />
                    ) : node.isCurrent ? (
                      <div className="relative">
                        <Star className="h-10 w-10 text-white" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                        </div>
                      </div>
                    ) : node.isUnlocked ? (
                      <Target className="h-10 w-10 text-white" />
                    ) : (
                      <Lock className="h-8 w-8 text-slate-500" />
                    )}
                  </div>

                  {/* Progress ring for current node */}
                  {node.isCurrent && (
                    <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
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
                    mt-4 p-4 w-full max-w-xs text-center transition-all duration-300
                    ${node.isCurrent 
                      ? 'bg-gradient-to-br from-slate-800 to-slate-700 border-2 border-green-500 shadow-lg shadow-green-500/20' 
                      : node.isUnlocked
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-slate-800/50 border-slate-700/50 opacity-60'
                    }
                  `}
                >
                  <h3 className={`
                    font-bold mb-1
                    ${node.isCurrent ? 'text-green-400' : node.isUnlocked ? 'text-white' : 'text-slate-500'}
                  `}>
                    {node.title}
                  </h3>
                  <p className={`
                    text-sm
                    ${node.isUnlocked ? 'text-slate-300' : 'text-slate-600'}
                  `}>
                    {node.description}
                  </p>
                  
                  {node.isCurrent && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-semibold">Nivel Actual</span>
                      </div>
                    </div>
                  )}

                  {node.isCompleted && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-400">
                      <Star className="h-3 w-3 fill-current" />
                      <span>Completado</span>
                    </div>
                  )}
                </Card>

                {/* Connector line to next node (except for last node) */}
                {index < journeyNodes.length - 1 && (
                  <div className="h-8 w-1 bg-slate-700 mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Summary */}
        <Card className="mt-12 p-6 bg-slate-800 border-slate-700">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Tu Progreso</h3>
            <p className="text-slate-300 text-sm mb-4">
              Estás en el nivel {currentLevel} de 8. ¡Sigue así!
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <p className="text-slate-400 text-xs">Net Worth Actual</p>
                <p className="text-white font-bold mt-1">
                  ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <p className="text-slate-400 text-xs">Meta Aspiracional</p>
                <p className="text-blue-400 font-bold mt-1">
                  ${totalAspiration.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          className="w-full mt-6 h-12 border-slate-700 hover:bg-slate-800 text-white"
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
