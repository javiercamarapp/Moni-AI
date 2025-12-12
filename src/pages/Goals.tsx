import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Target, Plus, TrendingUp, Sparkles, ChevronLeft, Lightbulb, Users, X } from "lucide-react";
import { headingPage, headingSection } from "@/styles/typography";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [groupGoals, setGroupGoals] = useState<GroupGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addFundsModal, setAddFundsModal] = useState<{
    open: boolean;
    goal: Goal | null;
  }>({
    open: false,
    goal: null
  });
  const [expandedGoal, setExpandedGoal] = useState<Goal | null>(null);
  const [expandedGroupGoal, setExpandedGroupGoal] = useState<GroupGoal | null>(null);
  const autoplayPlugin = useRef(Autoplay({
    delay: 4000,
    stopOnInteraction: true
  }));
  const insightsAutoplayPlugin = useRef(Autoplay({
    delay: 5000,
    stopOnInteraction: false
  }));
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setCreateModalOpen(true);
      // Clean up URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, {
        replace: true
      });
    }
  }, [searchParams]);
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchGoals(), fetchGroupGoals()]);

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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Call the auto-adjust edge function
      await supabase.functions.invoke('auto-adjust-goals', {
        body: {
          userId: user.id
        }
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }
      const {
        data,
        error
      } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
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
        setAiInsights(["💡 Crea tu primera meta para recibir consejos personalizados", "🎯 Define objetivos claros para alcanzar tus sueños", "⚡ El primer paso es el más importante", "🌟 Empieza hoy tu camino al éxito financiero"]);
        return;
      }

      // Use the first goal for insights
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-goal-insights', {
        body: {
          goalId: goals[0].id,
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
      setAiInsights(["💡 Mantén el ritmo, vas por buen camino", "🎯 Cada ahorro te acerca más a tu meta", "⚡ Pequeños pasos, grandes logros", "🌟 Tu esfuerzo vale la pena"]);
    }
  };
  const fetchGroupGoals = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's circles
      const {
        data: circleMembers
      } = await supabase.from('circle_members').select('circle_id').eq('user_id', user.id);
      if (!circleMembers || circleMembers.length === 0) {
        setGroupGoals([]);
        return;
      }
      const circleIds = circleMembers.map(cm => cm.circle_id);

      // Get goals for those circles
      const {
        data: goalsData
      } = await supabase.from('circle_goals').select(`
          *,
          circles:circle_id(name)
        `).in('circle_id', circleIds).order('created_at', {
        ascending: false
      });
      if (!goalsData) {
        setGroupGoals([]);
        return;
      }

      // Get user's progress for each goal
      const goalIds = goalsData.map(g => g.id);
      const {
        data: progressData
      } = await supabase.from('circle_goal_members').select('*').eq('user_id', user.id).in('goal_id', goalIds);

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
      const {
        error
      } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;

      // Show confetti
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          y: 0.6
        }
      });
      toast.success('¡Felicitaciones! Meta completada y eliminada 🎉');
      fetchGoals();
    } catch (error: any) {
      console.error('Error completing goal:', error);
      toast.error('Error al completar la meta');
    }
  };
  const calculateStats = () => {
    if (goals.length === 0) return {
      totalSaved: 0,
      avgCompletion: 0,
      goalsOnTrack: 0
    };
    const totalSaved = goals.reduce((sum, g) => sum + g.current, 0);
    const avgCompletion = goals.reduce((sum, g) => sum + g.current / g.target * 100, 0) / goals.length;
    const goalsOnTrack = goals.filter(g => {
      const progress = g.current / g.target * 100;
      return progress >= 50;
    }).length;
    return {
      totalSaved,
      avgCompletion,
      goalsOnTrack
    };
  };
  const stats = calculateStats();
  return <>
      <div className="page-standard min-h-screen pb-24">
        
        <main className="page-container pt-4 space-y-3">
          {/* Header Row */}
          <header className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 text-[#5D4037]/70">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <h1 className={`${headingPage} mb-1`}>Mis Metas</h1>
                
              </div>
            </div>
            
            {/* New Goal Button */}
            <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-1.5 bg-[#8D6E63] hover:bg-[#795548] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95">
              <Plus size={14} strokeWidth={3} />
              <span>Nueva</span>
            </button>
          </header>

          <div>
          {loading ? <div className="py-12">
              <MoniLoader size="lg" message="Cargando tus metas..." />
            </div> : goals.length === 0 ?
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
              <button onClick={() => setCreateModalOpen(true)} className="h-11 px-6 bg-[#8D6E63] hover:bg-[#795548] text-white rounded-xl shadow-sm transition-all font-bold text-sm active:scale-95">
                <Plus className="h-4 w-4 mr-2 inline" />
                Crear mi primera meta
              </button>
            </div> : <>
              {/* AI Insights Banner */}
              {aiInsights.length > 0 && <Carousel className="w-full mb-3" opts={{
              align: "center",
              loop: true
            }} plugins={[insightsAutoplayPlugin.current]}>
                  <CarouselContent>
                    {aiInsights.map((insight, index) => <CarouselItem key={index}>
                        
                      </CarouselItem>)}
                  </CarouselContent>
                </Carousel>}

              {/* Compact Grid for Small Screens */}
              <div className="grid grid-cols-2 gap-3 lg:hidden">
                {goals.map(goal => {
                const Icon = getGoalIcon(goal.title);
                const progress = goal.current / goal.target * 100;
                return <div key={goal.id} onClick={() => setExpandedGoal(goal)} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all">
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
                        <div className={`h-1.5 rounded-full transition-all ${progress >= 75 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : progress >= 25 ? 'bg-amber-500' : 'bg-gray-400'}`} style={{
                      width: `${Math.min(progress, 100)}%`
                    }} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#5D4037]">{progress.toFixed(0)}%</span>
                        <span className="text-[10px] text-gray-400">{formatCurrency(goal.current)}</span>
                      </div>
                    </div>;
              })}
              </div>

              {/* Full Grid for Large Screens */}
              <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {goals.map(goal => <GoalCard key={goal.id} goal={goal} onAddFunds={() => setAddFundsModal({
                open: true,
                goal
              })} onViewDetails={() => navigate(`/goals/${goal.id}`)} onComplete={() => handleCompleteGoal(goal.id)} />)}
              </div>
            </>}

          {/* Group Goals Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#8D6E63]" />
              <h2 className={headingSection}>Metas Grupales</h2>
            </div>

            {groupGoals.length === 0 ? <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No tienes metas grupales aún</p>
                <button onClick={() => navigate('/groups')} className="text-xs font-bold text-[#8D6E63] hover:underline">
                  Explorar círculos
                </button>
              </div> : <>
                {/* Compact Grid for Small Screens */}
                <div className="grid grid-cols-2 gap-3 lg:hidden">
                  {groupGoals.map(goal => {
                  const progress = goal.current_amount / goal.target_amount * 100;
                  return <div key={goal.id} onClick={() => setExpandedGroupGoal(goal)} className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-[#F5F0EE] flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-[#8D6E63]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-[#5D4037] text-sm truncate">{goal.title}</h3>
                            <p className="text-[10px] text-gray-400 truncate">{goal.circle_name}</p>
                          </div>
                        </div>
                        
                        {/* Mini Progress */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                          <div className={`h-1.5 rounded-full transition-all ${progress >= 75 ? 'bg-purple-500' : progress >= 50 ? 'bg-indigo-500' : progress >= 25 ? 'bg-blue-500' : 'bg-gray-400'}`} style={{
                        width: `${Math.min(progress, 100)}%`
                      }} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#5D4037]">{progress.toFixed(0)}%</span>
                          <span className="text-[10px] text-gray-400">{formatCurrency(goal.current_amount)}</span>
                        </div>
                      </div>;
                })}
                </div>

                {/* Full Grid for Large Screens */}
                <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupGoals.map(goal => {
                  const progress = goal.current_amount / goal.target_amount * 100;
                  const remaining = goal.target_amount - goal.current_amount;
                  return <div key={goal.id} onClick={() => navigate(`/group-goals/${goal.id}`)} className="bg-white rounded-[1.75rem] p-5 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F5F0EE] flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#8D6E63]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#5D4037] text-base">{goal.title}</h3>
                            <p className="text-xs text-gray-400">{goal.circle_name}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                          <div className={`h-2 rounded-full transition-all ${progress >= 75 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : progress >= 50 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' : progress >= 25 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`} style={{
                        width: `${Math.min(progress, 100)}%`
                      }} />
                        </div>

                        <div className="flex justify-between items-center mb-3">
                          <div className="text-xs">
                            <span className="font-bold text-[#5D4037]">{formatCurrency(goal.current_amount)}</span>
                            <span className="text-gray-400"> / {formatCurrency(goal.target_amount)}</span>
                          </div>
                          <span className="text-sm font-bold text-[#5D4037]">{progress.toFixed(0)}%</span>
                        </div>

                        {goal.deadline && <p className="text-[10px] text-gray-400 mb-3">
                            Fecha límite: {new Date(goal.deadline).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                          </p>}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button onClick={e => {
                        e.stopPropagation();
                        navigate(`/group-goals/${goal.id}/contribute`);
                      }} className="flex-1 h-9 bg-[#8D6E63] hover:bg-[#795548] rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95">
                            <Plus size={14} />
                            Agregar
                          </button>
                          <button onClick={e => {
                        e.stopPropagation();
                        navigate(`/group-goals/${goal.id}`);
                      }} className="h-9 px-4 bg-[#F5F0EE] hover:bg-[#EBE5E2] rounded-xl text-[#5D4037] font-bold text-xs transition-all active:scale-95">
                            Detalles
                          </button>
                        </div>
                      </div>;
                })}
                </div>
              </>}
          </div>
          </div>
        </main>
      </div>

      {/* Expanded Goal Modal (Small Screens) */}
      {expandedGoal && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 lg:hidden" onClick={() => setExpandedGoal(null)}>
          <div className="bg-white w-full max-w-sm rounded-[1.75rem] max-h-[80vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200 shadow-xl relative" onClick={e => e.stopPropagation()}>
            {/* Close Button - Positioned inside the card */}
            <button 
              onClick={() => setExpandedGoal(null)} 
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Goal Content - Inline instead of using GoalCard to avoid double container */}
            {(() => {
              const Icon = getGoalIcon(expandedGoal.title);
              const progress = (expandedGoal.current / expandedGoal.target) * 100;
              const remaining = expandedGoal.target - expandedGoal.current;
              
              return (
                <div className="p-5 pt-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pr-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F5F0EE] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#8D6E63]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#5D4037] text-lg">{expandedGoal.title}</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{expandedGoal.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Progreso</span>
                    <span className="text-xl font-bold text-[#5D4037]">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        progress >= 75 ? 'bg-emerald-500' : 
                        progress >= 50 ? 'bg-blue-500' : 
                        progress >= 25 ? 'bg-amber-500' : 'bg-gray-400'
                      }`} 
                      style={{ width: `${Math.min(progress, 100)}%` }} 
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Actual</p>
                      <p className="font-bold text-[#5D4037]">{formatCurrency(expandedGoal.current)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Falta</p>
                      <p className="font-bold text-[#5D4037]">{formatCurrency(remaining)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">Meta</p>
                      <p className="font-bold text-[#5D4037]">{formatCurrency(expandedGoal.target)}</p>
                    </div>
                  </div>

                  {/* AI Prediction */}
                  {expandedGoal.predicted_completion_date && (
                    <div className="bg-[#F5F0EE] rounded-xl p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#8D6E63] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-[#5D4037] font-medium mb-0.5">
                            Podrías lograrlo el {new Date(expandedGoal.predicted_completion_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </p>
                          {expandedGoal.required_weekly_saving && (
                            <p className="text-[10px] text-[#8D6E63]">
                              💰 {formatCurrency(expandedGoal.required_weekly_saving)}/semana
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {progress >= 100 ? (
                      <button
                        onClick={() => {
                          setExpandedGoal(null);
                          handleCompleteGoal(expandedGoal.id);
                        }}
                        className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Sparkles className="h-4 w-4" />
                        Completar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setExpandedGoal(null);
                          setAddFundsModal({ open: true, goal: expandedGoal });
                        }}
                        className="flex-1 h-11 bg-[#8D6E63] hover:bg-[#795548] rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setExpandedGoal(null);
                        navigate(`/goals/${expandedGoal.id}`);
                      }}
                      className="h-11 px-5 bg-[#F5F0EE] hover:bg-[#EBE5E2] rounded-xl text-[#5D4037] font-bold text-sm transition-all active:scale-95"
                    >
                      Detalles
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>}

      {/* Expanded Group Goal Modal (Small Screens) */}
      {expandedGroupGoal && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 lg:hidden" onClick={() => setExpandedGroupGoal(null)}>
          <div className="bg-white w-full max-w-sm rounded-[1.75rem] max-h-[80vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200 shadow-xl relative" onClick={e => e.stopPropagation()}>
            {/* Close Button - Positioned inside the card */}
            <button 
              onClick={() => setExpandedGroupGoal(null)} 
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Group Goal Content */}
            <div className="p-5 pt-6">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4 pr-8">
                <div className="w-10 h-10 rounded-xl bg-[#F5F0EE] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#5D4037] text-lg">{expandedGroupGoal.title}</h3>
                  <p className="text-xs text-gray-400">{expandedGroupGoal.circle_name}</p>
                  {expandedGroupGoal.deadline && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Fecha límite: {new Date(expandedGroupGoal.deadline).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress */}
              {(() => {
                const progress = expandedGroupGoal.current_amount / expandedGroupGoal.target_amount * 100;
                return (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Progreso</span>
                      <span className="text-xl font-bold text-[#5D4037]">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          progress >= 75 ? 'bg-emerald-500' : 
                          progress >= 50 ? 'bg-blue-500' : 
                          progress >= 25 ? 'bg-amber-500' : 'bg-gray-400'
                        }`} 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Actual</p>
                        <p className="font-bold text-[#5D4037]">{formatCurrency(expandedGroupGoal.current_amount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-0.5">Falta</p>
                        <p className="font-bold text-[#5D4037]">{formatCurrency(expandedGroupGoal.target_amount - expandedGroupGoal.current_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Meta</p>
                        <p className="font-bold text-[#5D4037]">{formatCurrency(expandedGroupGoal.target_amount)}</p>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setExpandedGroupGoal(null);
                    navigate(`/group-goals/${expandedGroupGoal.id}/contribute`);
                  }} 
                  className="flex-1 h-11 bg-[#8D6E63] hover:bg-[#795548] rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
                <button 
                  onClick={() => {
                    setExpandedGroupGoal(null);
                    navigate(`/group-goals/${expandedGroupGoal.id}`);
                  }} 
                  className="h-11 px-5 bg-[#F5F0EE] hover:bg-[#EBE5E2] rounded-xl text-[#5D4037] font-bold text-sm transition-all active:scale-95"
                >
                  Detalles
                </button>
              </div>
            </div>
          </div>
        </div>}

      <BottomNav />

      {/* Modals */}
      <CreateGoalModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSuccess={fetchGoals} />

      {addFundsModal.goal && <AddFundsModal isOpen={addFundsModal.open} onClose={() => setAddFundsModal({
      open: false,
      goal: null
    })} onSuccess={fetchGoals} goal={addFundsModal.goal} />}
    </>;
};
export default Goals;