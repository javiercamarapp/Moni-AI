import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import BottomNav from "@/components/BottomNav";

interface GroupGoal {
  id: string;
  circle_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  circle_name: string;
  member_count: number;
}

const GroupGoals = () => {
  const navigate = useNavigate();
  const [groupGoals, setGroupGoals] = useState<GroupGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCircles, setUserCircles] = useState<any[]>([]);

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
        .select('circle_id')
        .eq('user_id', user.id);

      if (circlesError) throw circlesError;

      const circleIds = circleMembers?.map(cm => cm.circle_id) || [];
      setUserCircles(circleIds);

      if (circleIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch goals for user's circles with circle info
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
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        deadline: goal.deadline,
        circle_name: goal.circles?.name || 'Círculo',
        member_count: goal.circles?.member_count || 0
      })) || [];

      setGroupGoals(enrichedGoals);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar las metas grupales');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha límite';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <>
      <div className="min-h-screen pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
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
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>
          {loading ? (
            <div className="py-12">
              <SectionLoader size="lg" />
            </div>
          ) : userCircles.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center">
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No estás en ningún círculo
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Únete a un círculo para comenzar a crear metas grupales
              </p>
              <Button
                onClick={() => navigate('/groups')}
                className="h-10 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                Ver Círculos
              </Button>
            </div>
          ) : groupGoals.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center">
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Sin metas grupales
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Aún no hay metas en tus círculos. ¡Sé el primero en crear una!
              </p>
              <Button
                onClick={() => navigate('/groups')}
                className="h-10 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                Ir a Mis Círculos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Goals list */}
              {groupGoals.map((goal) => {
                const progress = calculateProgress(goal.current_amount, goal.target_amount);
                
                return (
                  <div
                    key={goal.id}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow"
                  >
                    {/* Circle info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-full p-2">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">{goal.circle_name}</p>
                        <p className="text-[10px] text-gray-500">{goal.member_count} miembros</p>
                      </div>
                    </div>

                    {/* Goal info */}
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {goal.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{formatCurrency(goal.current_amount)}</span>
                        <span className="font-medium">{formatCurrency(goal.target_amount)}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <Progress value={progress} className="h-2 mb-3" />

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>{progress.toFixed(0)}% completado</span>
                      </div>
                      {goal.deadline && (
                        <p className="text-[10px] text-gray-500">
                          {formatDate(goal.deadline)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add new goal button */}
              <Button
                onClick={() => navigate('/groups')}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ver Todos los Círculos
              </Button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default GroupGoals;
