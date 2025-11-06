import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Target, TrendingUp, Sparkles, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { AddFundsModal } from "@/components/goals/AddFundsModal";
import MoniAIPrediction from "@/components/goals/MoniAIPrediction";

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

interface Activity {
  id: string;
  amount: number;
  created_at: string;
  activity_type: string;
  note?: string;
}

const GoalDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFundsModal, setAddFundsModal] = useState(false);

  useEffect(() => {
    fetchGoalDetails();
  }, [id]);

  const fetchGoalDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch goal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (goalError) throw goalError;
      setGoal(goalData);

      // Fetch activities (goal contributions)
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('goal_activities')
        .select('*')
        .eq('goal_id', id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);
    } catch (error: any) {
      console.error('Error fetching goal details:', error);
      toast.error('Error al cargar los detalles de la meta');
      navigate('/goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoal = async () => {
    if (!goal) return;
    
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id);

      if (error) throw error;

      // Show confetti
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('¡Felicitaciones! Meta completada 🎉');
      navigate('/goals');
    } catch (error: any) {
      console.error('Error completing goal:', error);
      toast.error('Error al completar la meta');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Travel": return "✈️";
      case "Tech": return "💻";
      case "Education": return "🎓";
      case "Emergency Fund": return "🛡️";
      default: return "🎯";
    }
  };

  if (loading || !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" message="Cargando detalles de tu meta..." />
      </div>
    );
  }

  const progress = (goal.current / goal.target) * 100;
  const remaining = goal.target - goal.current;
  const daysRemaining = goal.deadline 
    ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <div className="min-h-screen pb-24 bg-gradient-to-b from-amber-50/30 to-orange-50/20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-purple-50/80 via-cyan-50/60 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Detalles de Meta</h1>
                <p className="text-xs text-gray-600">{goal.title}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-full flex items-center justify-center text-lg">
                  {goal.icon || getCategoryIcon(goal.category)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{goal.title}</h2>
                  {goal.description && (
                    <p className="text-xs text-gray-600">{goal.description}</p>
                  )}
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{goal.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{progress.toFixed(0)}%</div>
                <p className="text-xs text-gray-600">completado</p>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  progress >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                  progress >= 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  progress >= 25 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-600">{formatCurrency(goal.current)} ahorrado</span>
              <span className="font-bold text-gray-900">{formatCurrency(goal.target)} meta</span>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200/50">
              <p className="text-[10px] text-gray-600 mb-0.5">Ahorro Actual</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(goal.current)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200/50">
              <p className="text-[10px] text-gray-600 mb-0.5">Falta Ahorrar</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(remaining)}</p>
            </div>
            {goal.deadline && daysRemaining !== null && (
              <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200/50">
                <p className="text-[10px] text-gray-600 mb-0.5">Días Restantes</p>
                <p className="text-sm font-bold text-gray-900">{daysRemaining} días</p>
              </div>
            )}
          </div>

          {/* AI Prediction */}
          {goal.deadline && (
            <MoniAIPrediction
              target={goal.target}
              deadline={goal.deadline}
              memberCount={1}
              saved={goal.current}
            />
          )}

          {/* Activities History */}
          {activities.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Historial de Contribuciones
              </h3>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.activity_type === 'contribution' ? '💰 Contribución' : '📝 Actividad'}
                      </p>
                      {activity.note && (
                        <p className="text-xs text-gray-600 mt-0.5">{activity.note}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      +{formatCurrency(activity.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {progress >= 100 ? (
              <Button
                onClick={handleCompleteGoal}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg font-semibold"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Completar Meta
              </Button>
            ) : (
              <Button
                onClick={() => setAddFundsModal(true)}
                className="flex-1 h-12 bg-white hover:bg-gray-50 text-gray-900 rounded-xl shadow-sm border border-gray-200/50 font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Fondos
              </Button>
            )}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Add Funds Modal */}
      {goal && (
        <AddFundsModal
          isOpen={addFundsModal}
          onClose={() => setAddFundsModal(false)}
          onSuccess={fetchGoalDetails}
          goal={goal}
        />
      )}
    </>
  );
};

export default GoalDetails;
