import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Plus, TrendingUp, Sparkles, ChevronLeft, Lightbulb, Users, X } from "lucide-react";
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
import { getGoalIcon } from "@/lib/goalIcons";

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
  const [expandedGoal, setExpandedGoal] = useState<Goal | null>(null);
  
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
      // Only generate insights if there are goals
      if (goals.length === 0) {
        setAiInsights([
          "💡 Crea tu primera meta para recibir consejos personalizados",
          "🎯 Define objetivos claros para alcanzar tus sueños",
          "⚡ El primer paso es el más importante",
          "🌟 Empieza hoy tu camino al éxito financiero"
        ]);
        return;
      }

      // Use the first goal for insights
      const { data, error } = await supabase.functions.invoke('generate-goal-insights', {
        body: { goalId: goals[0].id, isGroupGoal: false }
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
      <div className="page-standard min-h-screen pb-24">
        
        <main className="page-container pt-6 space-y-4">
          {/* Header Row */}
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 text-[#5D4037]/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-[#5D4037] leading-none mb-1">Mis Metas</h1>
                <p className="text-xs text-gray-500">Alcanza tus objetivos con AI</p>
              </div>
            </div>
            
            {/* New Goal Button */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#8D6E63] hover:bg-[#795548] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Nueva</span>
            </button>
          </header>

          <div className="space-y-4">
          {loading ? (
            <div className="py-12">
              <MoniLoader size="lg" message="Cargando tus metas..." />
            </div>
          ) : goals.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <div className="bg-[#F5F0EE] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
                <Target className="h-10 w-10 text-[#8D6E63]" />
              </div>
              <h3 className="text-lg font-bold text-[#5D4037] mb-2">
                Crea tu primera meta
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Define objetivos y deja que Moni AI te ayude a alcanzarlos
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="h-11 px-6 bg-[#8D6E63] hover:bg-[#795548] text-white rounded-xl shadow-sm transition-all font-bold text-sm active:scale-95"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                Crear mi primera meta
              </button>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100/50">
                  <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Ahorrado</p>
                  <p className="text-sm font-bold text-[#5D4037]">{formatCurrency(stats.totalSaved)}</p>
                </div>
                
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100/50">
                  <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Progreso</p>
                  <p className="text-sm font-bold text-[#5D4037]">{stats.avgCompletion.toFixed(0)}%</p>
                </div>
                
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100/50">
                  <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Activas</p>
                  <p className="text-sm font-bold text-[#5D4037]">{goals.length}</p>
                </div>
              </div>

              {/* AI Insights Banner */}
              {aiInsights.length > 0 && (
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
                        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100/50">
                          <div className="flex items-center gap-2 justify-center">
                            <Sparkles className="w-4 h-4 text-[#8D6E63]" />
                            <p className="text-xs text-gray-600 font-medium text-center">
                              {insight}
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              )}

              {/* Compact Grid for Small Screens */}
              <div className="grid grid-cols-2 gap-3 lg:hidden">
                {goals.map((goal) => {
                  const Icon = getGoalIcon(goal.title);
                  const progress = (goal.current / goal.target) * 100;
                  return (
                    <div
                      key={goal.id}
                      onClick={() => setExpandedGoal(goal)}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F5F0EE] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[#8D6E63]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-[#5D4037] text-sm truncate">{goal.title}</h3>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{goal.category}</p>
                        </div>
                      </div>
                      
                      {/* Mini Progress */}
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            progress >= 75 ? 'bg-emerald-500' :
                            progress >= 50 ? 'bg-blue-500' :
                            progress >= 25 ? 'bg-amber-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#5D4037]">{progress.toFixed(0)}%</span>
                        <span className="text-[10px] text-gray-400">{formatCurrency(goal.current)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Grid for Large Screens */}
              <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onAddFunds={() => setAddFundsModal({ open: true, goal })}
                    onViewDetails={() => navigate(`/goals/${goal.id}`)}
                    onComplete={() => handleCompleteGoal(goal.id)}
                  />
                ))}
              </div>
            </>
          )}
          </div>
        </main>
      </div>

      {/* Expanded Goal Modal (Small Screens) */}
      {expandedGoal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 lg:hidden"
          onClick={() => setExpandedGoal(null)}
        >
          <div 
            className="bg-[#f5f0ee] w-full max-w-sm rounded-[2rem] p-5 max-h-[80vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setExpandedGoal(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            {/* Full Goal Card */}
            <GoalCard
              goal={expandedGoal}
              onAddFunds={() => {
                setExpandedGoal(null);
                setAddFundsModal({ open: true, goal: expandedGoal });
              }}
              onViewDetails={() => {
                setExpandedGoal(null);
                navigate(`/goals/${expandedGoal.id}`);
              }}
              onComplete={() => {
                setExpandedGoal(null);
                handleCompleteGoal(expandedGoal.id);
              }}
            />
          </div>
        </div>
      )}

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
