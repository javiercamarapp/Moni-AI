import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSavingsSimulation, RiskLevel, TimePeriod } from "@/hooks/useSavingsSimulation";
import { SimulationGraph } from "@/components/simulation/SimulationGraph";
import { RiskSelector } from "@/components/simulation/RiskSelector";
import { TimeRangeSelector } from "@/components/simulation/TimeRangeSelector";
import { KPICards } from "@/components/simulation/KPICards";
import { AISuggestionCard } from "@/components/simulation/AISuggestionCard";
import { ProgressVelocity } from "@/components/simulation/ProgressVelocity";
import { AdvancedSimulationModal } from "@/components/simulation/AdvancedSimulationModal";
import { ScenarioComparison } from "@/components/simulation/ScenarioComparison";
import { toast } from "sonner";
import { motion } from "framer-motion";

const SavingSimulation = () => {
  const navigate = useNavigate();
  const [dailySavings, setDailySavings] = useState(100);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1A');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [extraContributions, setExtraContributions] = useState<{ month: number; amount: number }[]>([]);
  const [events, setEvents] = useState<{ month: number; amount: number; description: string }[]>([]);

  const simulation = useSavingsSimulation({
    dailySavings,
    riskLevel,
    timePeriod,
    extraContributions,
    events,
  });

  const handleAdvancedApply = (params: any) => {
    setDailySavings(params.dailySavings);
    setRiskLevel(params.riskLevel);
    setExtraContributions(params.extraContributions);
    setEvents(params.events);
    toast.success("Simulación personalizada aplicada");
  };

  const handleShare = () => {
    toast.success("Compartiendo simulación...");
    // Aquí iría la lógica para compartir
  };

  const scenarios = [
    {
      name: 'Conservador',
      data: useSavingsSimulation({ dailySavings, riskLevel: 'conservative', timePeriod }).data,
      color: '#10b981',
    },
    {
      name: 'Moderado',
      data: simulation.data,
      color: '#3b82f6',
    },
    {
      name: 'Arriesgado',
      data: useSavingsSimulation({ dailySavings, riskLevel: 'aggressive', timePeriod }).data,
      color: '#f59e0b',
    },
  ];

  return (
    <>
      <div className="min-h-screen pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  Simulación de ahorro por día
                </h1>
                <p className="text-xs text-gray-600">
                  Proyecta tu ahorro diario con inteligencia artificial
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowAdvanced(true)}
                  className="rounded-full bg-white/80 hover:bg-white"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleShare}
                  className="rounded-full bg-white/80 hover:bg-white"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <KPICards
              totalSaved={simulation.totalSaved}
              totalInvested={simulation.totalInvested}
              totalReturns={simulation.totalReturns}
              bestMonth={simulation.bestMonth}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <RiskSelector selected={riskLevel} onChange={setRiskLevel} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TimeRangeSelector selected={timePeriod} onChange={setTimePeriod} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SimulationGraph data={simulation.data} riskLevel={riskLevel} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ProgressVelocity
              dailySavings={dailySavings}
              projectedYearly={simulation.totalInvested}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <AISuggestionCard
              currentDailySavings={dailySavings}
              suggestedDailySavings={dailySavings + 18}
              estimatedDate="Jun 2026"
              successProbability={82}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? 'Ocultar' : 'Mostrar'} comparación de escenarios
            </Button>
          </motion.div>

          {showComparison && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <ScenarioComparison scenarios={scenarios} />
            </motion.div>
          )}
        </div>
      </div>

      <AdvancedSimulationModal
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        onApply={handleAdvancedApply}
      />

      <BottomNav />
    </>
  );
};

export default SavingSimulation;
