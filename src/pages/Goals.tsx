import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Plus, TrendingUp, Sparkles, ArrowLeft, Lightbulb, Users } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalModal } from "@/components/goals/CreateGoalModal";
import { AddFundsModal } from "@/components/goals/AddFundsModal";
import { formatCurrency } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Goal {
  id: string;
  title: string;
  description?: string;
  target: number;
  current: number;
  deadline?: string;
  category: string;
  icon?: string;
  predicted_completion_date?: string;
  required_weekly_saving?: number;
  ai_confidence?: number;
}

interface GroupGoal {
  id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category?: string;
  circle_name: string;
  user_progress: number;
  predicted_completion_date?: string;
  required_weekly_saving?: number;
}

const Goals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [groupGoals, setGroupGoals] = useState<GroupGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addFundsModal, setAddFundsModal] = useState<{ open: boolean; goal: Goal | null }>({
    open: false,
    goal: null
  });
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const insightsAutoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchGoals(),
          fetchGroupGoals()
        ]);
        
        // Trigger auto-adjustment after initial load
        triggerAutoAdjustment();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (goals.length > 0) {
      generateInsights();
    }
  }, [goals]);

  const triggerAutoAdjustment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the auto-adjust edge function
      await supabase.functions.invoke('auto-adjust-goals', {
        body: { userId: user.id }
      });
      
      // Refresh goals after adjustment
      setTimeout(() => {
        fetchGoals();
        fetchGroupGoals();
      }, 2000);
    } catch (error) {
      console.error('Error triggering auto-adjustment:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      toast.error('Error al cargar las metas');
    }
  };

  const generateInsights = async () => {
    try {
      // Skip if no goals available
      if (!goals || goals.length === 0) {
        return;
      }

      // Use the first active goal for insights
      const activeGoal = goals.find(g => g.current < g.target) || goals[0];
      
      if (!activeGoal) {
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-goal-insights', {
        body: { 
          goalId: activeGoal.id,
          isGroupGoal: false 
        }
      });

      if (error) throw error;
      if (data?.insights) {
        setAiInsights(data.insights);
      }
    } catch (error: any) {
      console.error('Error generating insights:', error);
      // Set default insights if API fails
      setAiInsights([
        "💡 Mantén el ritmo, vas por buen camino",
        "🎯 Cada ahorro te acerca más a tu meta",
        "⚡ Pequeños pasos, grandes logros",
        "🌟 Tu esfuerzo vale la pena"
      ]);
    }
  };

  const fetchGroupGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's circles
      const { data: circleMembers } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id);

      if (!circleMembers || circleMembers.length === 0) {
        setGroupGoals([]);
        return;
      }

      const circleIds = circleMembers.map(cm => cm.circle_id);

      // Get goals for those circles
      const { data: goalsData } = await supabase
        .from('circle_goals')
        .select(`
          *,
          circles:circle_id(name)
        `)
        .in('circle_id', circleIds)
        .order('created_at', { ascending: false });

      if (!goalsData) {
        setGroupGoals([]);
        return;
      }

      // Get user's progress for each goal
      const goalIds = goalsData.map(g => g.id);
      const { data: progressData } = await supabase
        .from('circle_goal_members')
        .select('*')
        .eq('user_id', user.id)
        .in('goal_id', goalIds);

      // Map goals with user progress
      const enrichedGoals = goalsData.map(goal => {
        const userProgress = progressData?.find(p => p.goal_id === goal.id);
        return {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          target_amount: goal.target_amount,
          current_amount: userProgress?.current_amount || 0,
          deadline: goal.deadline,
          category: goal.category,
          circle_name: (goal.circles as any)?.name || 'Círculo',
          user_progress: userProgress?.current_amount || 0,
          predicted_completion_date: goal.predicted_completion_date,
          required_weekly_saving: goal.required_weekly_saving
        };
      });

      setGroupGoals(enrichedGoals);
    } catch (error: any) {
      console.error('Error fetching group goals:', error);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      // Show confetti
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('¡Felicitaciones! Meta completada y eliminada 🎉');
      fetchGoals();
    } catch (error: any) {
      console.error('Error completing goal:', error);
      toast.error('Error al completar la meta');
    }
  };

  const calculateStats = () => {
    if (goals.length === 0) return { totalSaved: 0, avgCompletion: 0, goalsOnTrack: 0 };

    const totalSaved = goals.reduce((sum, g) => sum + g.current, 0);
    const avgCompletion = goals.reduce((sum, g) => sum + (g.current / g.target) * 100, 0) / goals.length;
    const goalsOnTrack = goals.filter(g => {
      const progress = (g.current / g.target) * 100;
      return progress >= 50;
    }).length;

    return { totalSaved, avgCompletion, goalsOnTrack };
  };

  const stats = calculateStats();

  return (
    <>
      <div className="min-h-screen pb-24 bg-gradient-to-b from-amber-50/30 to-orange-50/20 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-purple-50/80 via-cyan-50/60 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Mis Metas
                </h1>
                <p className="text-xs text-gray-600">
                  Alcanza tus objetivos con predicciones AI
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-6 space-y-6" style={{ maxWidth: '1200px' }}>
          {loading ? (
            <div className="py-12">
              <MoniLoader size="lg" message="Cargando tus metas..." />
            </div>
          ) : goals.length === 0 ? (
            // Empty State
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Target className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Crea tu primera meta
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Define objetivos financieros y deja que Moni AI te ayude a alcanzarlos con predicciones inteligentes
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="h-12 px-8 bg-gray-900 text-white rounded-xl shadow-sm hover:bg-gray-800 transition-all border-0 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear mi primera meta
              </Button>
            </div>
          ) : (
            <>
              {/* Stats Summary - Same as Group Goals */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-1.5 text-center shadow-sm">
                  <p className="text-[8px] text-white/70 mb-0.5 font-medium uppercase tracking-wide">Ahorrado</p>
                  <p className="text-[11px] font-bold text-white">{formatCurrency(stats.totalSaved)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-1.5 text-center shadow-sm">
                  <p className="text-[8px] text-white/70 mb-0.5 font-medium uppercase tracking-wide">Progreso</p>
                  <p className="text-[11px] font-bold text-white">{stats.avgCompletion.toFixed(0)}%</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-1.5 text-center shadow-sm">
                  <p className="text-[8px] text-white/70 mb-0.5 font-medium uppercase tracking-wide">Activas</p>
                  <p className="text-[11px] font-bold text-white">{goals.length}</p>
                </div>
              </div>

              {/* AI Insights Carousel - Compact */}
              {aiInsights.length > 0 && (
                <div className="mb-6">
                  <Carousel 
                    className="w-full"
                    opts={{
                      align: "center",
                      loop: true,
                    }}
                    plugins={[insightsAutoplayPlugin.current]}
                  >
                    <CarouselContent>
                      {aiInsights.map((insight, index) => (
                        <CarouselItem key={index}>
                          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="text-xs">🤖</span>
                              <p className="text-xs text-gray-700 font-medium text-center">
                                {insight}
                              </p>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}


              {/* Goals Carousel */}
              <Carousel 
                className="w-full"
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[autoplayPlugin.current]}
              >
                <CarouselContent className="-ml-4">
                  {goals.map((goal) => (
                    <CarouselItem key={goal.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <GoalCard
                        goal={goal}
                        onAddFunds={() => setAddFundsModal({ open: true, goal })}
                        onViewDetails={() => navigate(`/goals/${goal.id}`)}
                        onComplete={() => handleCompleteGoal(goal.id)}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Create Goal Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="h-11 px-8 bg-white hover:bg-white/90 text-gray-900 rounded-xl font-semibold shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all border-0"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear nueva meta
                </Button>
              </div>

            </>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Modals */}
      <CreateGoalModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchGoals}
      />

      {addFundsModal.goal && (
        <AddFundsModal
          isOpen={addFundsModal.open}
          onClose={() => setAddFundsModal({ open: false, goal: null })}
          onSuccess={fetchGoals}
          goal={addFundsModal.goal}
        />
      )}
    </>
  );
};

export default Goals;
