import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Rocket, Star, Edit, ArrowLeft, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNetWorth } from "@/hooks/useNetWorth";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface JourneyNode {
  id: number;
  level: number;
  progress: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  position: { x: string; y: string };
}

export default function FinancialJourney() {
  const navigate = useNavigate();
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
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

  const currentProgress = totalAspiration > 0 ? (currentNetWorth / totalAspiration) * 100 : 0;
  const currentLevel = totalAspiration > 0 ? Math.floor((currentNetWorth / totalAspiration) * 10000) : 0;

  // Generar nodos del journey
  const generateNodes = (): JourneyNode[] => {
    const nodes: JourneyNode[] = [];
    const milestones = [
      { level: 0, x: "50%", y: "15%" },
      { level: 250, x: "25%", y: "30%" },
      { level: 500, x: "65%", y: "45%" },
      { level: 1000, x: "35%", y: "60%" },
      { level: 2000, x: "70%", y: "75%" },
      { level: 5000, x: "40%", y: "90%" },
      { level: 10000, x: "55%", y: "105%" },
    ];

    milestones.forEach((milestone, index) => {
      const progress = (milestone.level / 10000) * 100;
      nodes.push({
        id: index,
        level: milestone.level,
        progress: progress,
        isUnlocked: currentLevel >= milestone.level,
        isCurrent: currentLevel >= milestone.level && (index === milestones.length - 1 || currentLevel < milestones[index + 1].level),
        isCompleted: index < milestones.length - 1 && currentLevel >= milestones[index + 1].level,
        position: { x: milestone.x, y: milestone.y }
      });
    });

    return nodes;
  };

  const nodes = generateNodes();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a2332] to-[#0f1729] relative overflow-hidden">
      {/* Header Card */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Back button y botones superiores */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white/10 backdrop-blur-md rounded-full p-2 text-white hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/aspirations-analysis')}
                className="bg-white rounded-full px-4 py-2 text-sm font-semibold text-gray-900 flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg"
              >
                <Target className="h-4 w-4" />
                Análisis
              </button>
              <button
                onClick={() => navigate('/edit-aspirations')}
                className="bg-white rounded-full p-2 text-gray-900 hover:bg-white/90 transition-all shadow-lg"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main info card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-3xl p-6 text-white shadow-2xl">
            <h1 className="text-sm font-bold text-green-400 mb-3 tracking-wider">
              TU CAMINO FINANCIERO
            </h1>
            
            <div className="space-y-1 mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-white/60">Actual:</span>
                <span className="text-2xl font-bold">
                  ${currentNetWorth.toLocaleString('es-MX')}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-white/60">Meta:</span>
                <span className="text-lg text-white/80">
                  ${totalAspiration.toLocaleString('es-MX')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Progreso Total</span>
                <span className="font-semibold">{currentProgress.toFixed(1)}%</span>
              </div>
              <Progress value={currentProgress} className="h-2 bg-white/10" />
            </div>
          </Card>
        </div>
      </div>

      {/* Journey Path */}
      <div className="container mx-auto max-w-2xl relative" style={{ minHeight: '120vh', paddingTop: '280px' }}>
        {/* SVG Path */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ minHeight: '100%' }}
        >
          <defs>
            {/* Gradiente para el path activo */}
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
            
            {/* Filtro de glow */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Path de fondo (inactive) */}
          <motion.path
            d={`
              M 50% 15%
              Q 15% 22%, 25% 30%
              Q 35% 38%, 65% 45%
              Q 95% 52%, 35% 60%
              Q -15% 68%, 70% 75%
              Q 100% 82%, 40% 90%
              Q 10% 98%, 55% 105%
            `}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
            strokeDasharray="8 4"
          />

          {/* Path activo con gradiente y glow */}
          <motion.path
            d={`
              M 50% 15%
              Q 15% 22%, 25% 30%
              Q 35% 38%, 65% 45%
              Q 95% 52%, 35% 60%
              Q -15% 68%, 70% 75%
              Q 100% 82%, 40% 90%
            `}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.min(currentProgress / 100, 0.6) }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </svg>

        {/* Nodos */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: node.id * 0.1 }}
            className="absolute"
            style={{ 
              left: node.position.x, 
              top: node.position.y,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Node circle */}
            <div className={`
              relative w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300
              ${node.isUnlocked 
                ? 'bg-gradient-to-br from-green-400 to-cyan-400 shadow-lg shadow-green-500/50' 
                : 'bg-white/10 backdrop-blur-sm border-2 border-white/20'
              }
              ${node.isCurrent ? 'ring-4 ring-white/30 scale-110' : ''}
              hover:scale-125
            `}>
              {/* Icon */}
              {!node.isUnlocked && <Lock className="h-6 w-6 text-white/40" />}
              {node.isCurrent && <Rocket className="h-8 w-8 text-white" />}
              {node.isCompleted && <Star className="h-6 w-6 text-white" />}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {(hoveredNode === node.id || node.isCurrent) && node.isUnlocked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-10 whitespace-nowrap"
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 shadow-xl">
                    <div className="text-green-400 text-sm font-bold mb-1">
                      Nivel {node.level}
                    </div>
                    <div className="text-white text-lg font-semibold">
                      ${((totalAspiration * node.level) / 10000).toLocaleString('es-MX')}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
