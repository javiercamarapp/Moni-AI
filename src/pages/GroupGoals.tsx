import { useEffect, useState } from "react";
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

interface GroupGoal {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
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

      const enrichedGoals = goalsData?.map(goal => ({
        id: goal.id,
        circle_id: goal.circle_id,
        title: goal.title,
        description: goal.description,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        deadline: goal.deadline,
        category: goal.category,
        predicted_completion_date: goal.predicted_completion_date,
        required_weekly_saving: goal.required_weekly_saving,
        circle_name: (goal.circles as any)?.name || 'Círculo',
        member_count: (goal.circles as any)?.member_count || 0
      })) || [];

      setGroupGoals(enrichedGoals);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar las metas grupales');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (groupGoals.length === 0) return { totalSaved: 0, avgProgress: 0, activeGoals: 0 };

    const totalSaved = groupGoals.reduce((sum, g) => sum + g.current_amount, 0);
    const avgProgress = groupGoals.reduce((sum, g) => sum + (g.current_amount / g.target_amount) * 100, 0) / groupGoals.length;
    const activeGoals = groupGoals.length;

    return { totalSaved, avgProgress, activeGoals };
  };

  const stats = calculateStats();

  return (
    <>
      <div className="min-h-screen pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5efea] to-white backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white rounded-full shadow-sm hover:bg-[#e3c890] transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-[#c8a57b]" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#c8a57b]/20 flex items-center justify-center text-xl animate-pulse">
                  🎯
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Metas Grupales
                  </h1>
                  <p className="text-xs text-gray-600">
                    Ahorra en equipo y alcanza objetivos juntos
                  </p>
                </div>
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
                className="h-12 px-8 mb-3 bg-white border-2 border-[#c8a57b] text-gray-900 hover:bg-[#e3c890] hover:border-[#e3c890] transition-all duration-300 rounded-2xl font-semibold"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-[#c8a57b]/10">
                  <p className="text-xs text-gray-600 mb-1">Total Ahorrado</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalSaved)}</p>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-[#c8a57b]/10">
                  <p className="text-xs text-gray-600 mb-1">Progreso Promedio</p>
                  <p className="text-lg font-bold text-gray-900">{stats.avgProgress.toFixed(0)}%</p>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-[#c8a57b]/10">
                  <p className="text-xs text-gray-600 mb-1">Metas Activas</p>
                  <p className="text-lg font-bold text-gray-900">{stats.activeGoals}</p>
                </div>
              </div>

              {/* AI Recommendation Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#c8a57b]/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-[#c8a57b]/10 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    🤖
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Moni AI recomienda:</h3>
                    <p className="text-xs text-gray-700 mb-3">
                      "Si cada miembro ahorra $230/semana, lograrán sus metas 2 semanas antes del plazo."
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#c8a57b] text-gray-900 hover:bg-[#e3c890] hover:border-[#e3c890] transition-all duration-300"
                    >
                      Ajustar plan automáticamente
                    </Button>
                  </div>
                </div>
              </div>

              {/* Goals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupGoals.map((goal) => (
                  <GroupGoalCard
                    key={goal.id}
                    goal={goal}
                    onViewDetails={() => toast.info("Detalles próximamente")}
                    onAddContribution={() => toast.info("Contribución próximamente")}
                  />
                ))}
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
