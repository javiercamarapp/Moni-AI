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
      <div className="min-h-screen pb-24 bg-gradient-to-b from-purple-50/50 to-white animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-md border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-900" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                    Metas Grupales
                  </h1>
                  <p className="text-xs text-gray-600">
                    Ahorra en equipo y alcanza objetivos juntos
                  </p>
                </div>
              </div>
              {circles.length > 0 && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="h-10 px-5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-xl shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva
                </Button>
              )}
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
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No estás en ningún círculo
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Únete a un círculo para comenzar a crear metas grupales y ahorrar en equipo
              </p>
              <Button
                onClick={() => navigate('/groups')}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-xl shadow-lg"
              >
                Ver Círculos
              </Button>
            </div>
          ) : groupGoals.length === 0 ? (
            // No Goals State
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Target className="h-12 w-12 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Crea tu primera meta grupal
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Establece objetivos compartidos con tu círculo y ahorren juntos para alcanzarlos
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-xl shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear meta grupal
              </Button>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-100 rounded-full p-3">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total ahorrado</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSaved)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6 border border-cyan-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-cyan-100 rounded-full p-3">
                      <Target className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Progreso promedio</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.avgProgress.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-cyan-50 rounded-2xl shadow-md p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white rounded-full p-3">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-700">Metas activas</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {stats.activeGoals} metas en progreso
                      </p>
                    </div>
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
