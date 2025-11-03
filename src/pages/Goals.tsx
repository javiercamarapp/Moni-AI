import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Plus, TrendingUp, Sparkles, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalModal } from "@/components/goals/CreateGoalModal";
import { AddFundsModal } from "@/components/goals/AddFundsModal";
import { formatCurrency } from "@/lib/utils";

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

const Goals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addFundsModal, setAddFundsModal] = useState<{ open: boolean; goal: Goal | null }>({
    open: false,
    goal: null
  });

  useEffect(() => {
    fetchGoals();
  }, []);

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
    } finally {
      setLoading(false);
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
              <SectionLoader size="lg" />
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
                className="h-12 px-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md transition-all border-0 text-gray-900 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear mi primera meta
              </Button>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
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

                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-cyan-100 rounded-full p-3">
                      <Target className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Progreso promedio</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.avgCompletion.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-cyan-50 rounded-2xl shadow-md p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white rounded-full p-3">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-700">AI Insight</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {stats.goalsOnTrack} de {goals.length} metas en buen ritmo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onAddFunds={() => setAddFundsModal({ open: true, goal })}
                    onViewDetails={() => toast.info("Detalles próximamente")}
                  />
                ))}
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
