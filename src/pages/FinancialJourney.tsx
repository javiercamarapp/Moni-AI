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

  // Generar nodos del journey con sine wave pattern
  const generateNodes = (): JourneyNode[] => {
    const nodes: JourneyNode[] = [];
    const steps = 12; // Number of milestones
    
    for (let i = 0; i <= steps; i++) {
      const level = Math.round((i / steps) * 10000);
      const progress = (level / 10000) * 100;
      
      // Sine wave pattern for x position
      const x = 50 + Math.sin(i * 1.5) * 35;
      const y = i * 120 + 80; // 120px vertical spacing
      
      nodes.push({
        id: i,
        level: level,
        progress: progress,
        isUnlocked: currentLevel >= level,
        isCurrent: currentLevel >= level && (i === steps || currentLevel < Math.round(((i + 1) / steps) * 10000)),
        isCompleted: i < steps && currentLevel >= Math.round(((i + 1) / steps) * 10000),
        position: { x: `${x}%`, y: `${y}px` }
      });
    }

    return nodes;
  };

  const nodes = generateNodes();
  
  // Find current node for highlighting
  const currentNode = nodes.find(n => n.isCurrent);
  
  // Calculate path length based on current progress
  const currentNodeIndex = currentNode ? currentNode.id : 0;
  const pathProgress = currentNodeIndex / nodes.length;

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
      <div className="container mx-auto max-w-2xl relative pb-32" style={{ minHeight: `${(nodes.length * 120) + 300}px`, paddingTop: '280px' }}>
        {/* SVG Path */}
        <svg 
          className="absolute inset-0 w-full pointer-events-none"
          style={{ height: '100%' }}
        >
          <defs>
            {/* Gradiente para el path activo */}
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
            </linearGradient>
            
            {/* Filtro de glow */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Generate path dynamically based on nodes */}
          {(() => {
            let pathD = '';
            nodes.forEach((node, i) => {
              if (i === 0) {
                pathD = `M ${node.position.x} ${node.position.y}`;
              } else {
                const prevNode = nodes[i - 1];
                // Smooth curve between points
                const midX = (parseFloat(node.position.x) + parseFloat(prevNode.position.x)) / 2;
                const midY = (parseFloat(node.position.y.replace('px', '')) + parseFloat(prevNode.position.y.replace('px', ''))) / 2;
                pathD += ` Q ${midX}% ${midY}px, ${node.position.x} ${node.position.y}`;
              }
            });

            // Inactive path (full length, dashed)
            const inactivePath = (
              <motion.path
                d={pathD}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
            );

            // Active path (progress-based)
            const activePath = (
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: pathProgress }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            );

            return (
              <>
                {inactivePath}
                {activePath}
              </>
            );
          })()}
        </svg>

        {/* Nodos */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: node.id * 0.05 }}
            className="absolute"
            style={{ 
              left: node.position.x, 
              top: node.position.y,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Node circle - Smaller size */}
            <div className={`
              relative w-12 h-12 rounded-full flex items-center justify-center
              transition-all duration-300
              ${node.isUnlocked 
                ? 'bg-gradient-to-br from-green-400 to-cyan-400 shadow-lg shadow-green-500/50 border-2 border-white/20' 
                : 'bg-white/5 backdrop-blur-sm border-2 border-white/10'
              }
              ${node.isCurrent ? 'ring-4 ring-white/40 scale-125' : ''}
              hover:scale-110
            `}>
              {/* Icon - Smaller size */}
              {!node.isUnlocked && <Lock className="h-4 w-4 text-white/30" />}
              {node.isCurrent && <Rocket className="h-6 w-6 text-white" />}
              {node.isCompleted && <Star className="h-4 w-4 text-white" />}
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
