import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Plus, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import BottomNav from "@/components/BottomNav";
import { GroupGoalCard } from "@/components/goals/GroupGoalCard";
import { CreateGroupGoalModal } from "@/components/goals/CreateGroupGoalModal";
import { formatCurrency } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface GroupGoal {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  completed_members: number;
  deadline: string | null;
  circle_name: string;
  member_count: number;
  category?: string;
  predicted_completion_date?: string;
  required_weekly_saving?: number;
}

interface Circle {
  id: string;
  name: string;
}

const GroupGoals = () => {
  const navigate = useNavigate();
  const [groupGoals, setGroupGoals] = useState<GroupGoal[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch user's circles
      const { data: circleMembers, error: circlesError } = await supabase
        .from('circle_members')
        .select('circle_id, circles:circle_id(id, name)')
        .eq('user_id', user.id);

      if (circlesError) throw circlesError;

      const userCircles = circleMembers?.map(cm => ({
        id: (cm.circles as any)?.id || '',
        name: (cm.circles as any)?.name || 'Círculo'
      })).filter(c => c.id) || [];
      
      setCircles(userCircles);

      const circleIds = userCircles.map(c => c.id);

      if (circleIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch goals for user's circles with enriched data
      const { data: goalsData, error: goalsError } = await supabase
        .from('circle_goals')
        .select(`
          *,
          circles:circle_id (name, member_count)
        `)
        .in('circle_id', circleIds)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      const enrichedGoals = goalsData?.map(goal => {
        const memberCount = (goal.circles as any)?.member_count || 0;
        const completedMembers = goal.completed_members || 0;
        // Calculate virtual current_amount based on completed members
        const currentAmount = memberCount > 0 ? (completedMembers / memberCount) * goal.target_amount : 0;
        
        return {
          id: goal.id,
          circle_id: goal.circle_id,
          title: goal.title,
          description: goal.description,
          target_amount: goal.target_amount,
          current_amount: currentAmount,
          completed_members: completedMembers,
          deadline: goal.deadline,
          category: goal.category,
          predicted_completion_date: goal.predicted_completion_date,
          required_weekly_saving: goal.required_weekly_saving,
          circle_name: (goal.circles as any)?.name || 'Círculo',
          member_count: memberCount
        };
      }) || [];

      setGroupGoals(enrichedGoals);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar las metas grupales');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (groupGoals.length === 0) return { totalCompleted: 0, avgProgress: 0, activeGoals: 0 };

    // Total members who have completed their individual goals across all goals
    const totalCompleted = groupGoals.reduce((sum, g) => sum + (g.completed_members || 0), 0);
    
    // Average progress based on completion rate (members completed / total members)
    const avgProgress = groupGoals.reduce((sum, g) => {
      const completionRate = g.member_count > 0 ? (g.completed_members / g.member_count) * 100 : 0;
      return sum + completionRate;
    }, 0) / groupGoals.length;
    
    const activeGoals = groupGoals.length;

    return { totalCompleted, avgProgress, activeGoals };
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
                  Metas Grupales
                </h1>
                <p className="text-xs text-gray-600">
                  Ahorra en equipo y alcanza objetivos juntos
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-6 space-y-6" style={{ maxWidth: '1200px' }}>
          {loading ? (
            <div className="py-12">
              <SectionLoader size="lg" />
            </div>
          ) : circles.length === 0 ? (
            // No Circles State
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#c8a57b]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Users className="h-10 w-10 text-[#c8a57b]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aún no tienes círculos
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Únete o crea un círculo primero para poder establecer metas grupales
              </p>
              <Button
                onClick={() => navigate('/groups')}
                className="h-12 px-8 bg-white border-2 border-[#c8a57b] text-gray-900 hover:bg-[#e3c890] hover:border-[#e3c890] transition-all duration-300 rounded-2xl font-semibold"
              >
                Ver círculos
              </Button>
            </div>
          ) : groupGoals.length === 0 ? (
            // No Goals State
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#c8a57b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl animate-pulse">🫶</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Crea tu primera meta grupal
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Establece objetivos compartidos con tu círculo y Moni AI calculará su progreso grupal.
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="h-12 px-8 mb-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border border-gray-200 text-gray-900 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear meta grupal
              </Button>
              <p className="text-xs text-gray-500 mb-3">
                O únete a un círculo existente con un código de invitación.
              </p>
              <Button
                onClick={() => navigate('/groups')}
                variant="outline"
                className="border-[#c8a57b]/30 text-gray-700 hover:bg-[#c8a57b]/5 rounded-2xl"
              >
                🔗 Unirme a un círculo
              </Button>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-1.5 text-center shadow-sm">
                  <p className="text-[8px] text-white/70 mb-0.5 font-medium uppercase tracking-wide">Completadas</p>
                  <p className="text-[11px] font-bold text-white">{stats.totalCompleted}</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-1.5 text-center shadow-sm">
                  <p className="text-[8px] text-white/70 mb-0.5 font-medium uppercase tracking-wide">Progreso</p>
                  <p className="text-[11px] font-bold text-white">{stats.avgProgress.toFixed(0)}%</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-1.5 text-center shadow-sm">
                  <p className="text-[8px] text-white/70 mb-0.5 font-medium uppercase tracking-wide">Activas</p>
                  <p className="text-[11px] font-bold text-white">{stats.activeGoals}</p>
                </div>
              </div>

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
                  {groupGoals.map((goal) => (
                    <CarouselItem key={goal.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <GroupGoalCard
                        goal={goal}
                        onViewDetails={() => navigate(`/group-goals/${goal.id}`)}
                        onAddContribution={() => navigate(`/group-goals/${goal.id}`)}
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

      {/* Create Modal */}
      <CreateGroupGoalModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchData}
        circles={circles}
      />
    </>
  );
};

export default GroupGoals;
