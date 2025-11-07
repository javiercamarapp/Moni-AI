import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Target, TrendingUp, Sparkles, Plus, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { AddFundsModal } from "@/components/goals/AddFundsModal";
import MoniAIPrediction from "@/components/goals/MoniAIPrediction";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const [insightModal, setInsightModal] = useState<'current' | 'remaining' | 'days' | null>(null);

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
            <button 
              onClick={() => setInsightModal('current')}
              className="bg-emerald-50/80 backdrop-blur-sm rounded-lg p-2.5 cursor-pointer transition-all hover:bg-emerald-100/80 border border-emerald-200/50"
            >
              <p className="text-[10px] text-emerald-700 uppercase tracking-wide mb-0.5 font-medium">Ahorro Actual</p>
              <p className="font-semibold text-emerald-900 text-sm">{formatCurrency(goal.current)}</p>
            </button>
            <button 
              onClick={() => setInsightModal('remaining')}
              className="bg-amber-50/80 backdrop-blur-sm rounded-lg p-2.5 cursor-pointer transition-all hover:bg-amber-100/80 border border-amber-200/50"
            >
              <p className="text-[10px] text-amber-700 uppercase tracking-wide mb-0.5 font-medium">Falta</p>
              <p className="font-semibold text-amber-900 text-sm">{formatCurrency(remaining)}</p>
            </button>
            {goal.deadline && daysRemaining !== null && (
              <button 
                onClick={() => setInsightModal('days')}
                className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-2.5 cursor-pointer transition-all hover:bg-blue-100/80 border border-blue-200/50"
              >
                <p className="text-[10px] text-blue-700 uppercase tracking-wide mb-0.5 font-medium">Días Restantes</p>
                <p className="font-semibold text-blue-900 text-sm">{daysRemaining} días</p>
              </button>
            )}
          </div>

          {/* AI Prediction */}
          <MoniAIPrediction goalId={id!} />

          {/* Progress Chart */}
          {activities.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-600" />
                Progreso en el Tiempo
              </h3>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart
                  data={(() => {
                    // Crear datos acumulativos para la gráfica
                    const sortedActivities = [...activities].sort((a, b) => 
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                    let accumulated = 0;
                    return sortedActivities.map((activity) => {
                      accumulated += activity.amount;
                      return {
                        date: new Date(activity.created_at).toLocaleDateString('es-MX', { 
                          day: 'numeric', 
                          month: 'short' 
                        }),
                        amount: accumulated,
                      };
                    });
                  })()}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Activities History */}
          {activities.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
              <div className="p-4 pb-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  Historial de Contribuciones
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">
                        {activity.activity_type === 'contribution' ? '💰 Contribución' : '📝 Actividad'}
                      </p>
                      {activity.note && (
                        <p className="text-[10px] text-gray-600 mt-0.5">{activity.note}</p>
                      )}
                      <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-wide">
                        {new Date(activity.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
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
          <div className="flex gap-2">
            {progress >= 100 ? (
              <button
                onClick={handleCompleteGoal}
                className="flex-1 h-9 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 border-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Completar Meta
              </button>
            ) : (
              <button
                onClick={() => setAddFundsModal(true)}
                className="flex-1 h-9 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/80 text-gray-900 font-medium text-xs transition-all flex items-center justify-center gap-1.5 border-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Contribuir
              </button>
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

      {/* Insight Modal */}
      {insightModal && goal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-b from-purple-50/30 to-indigo-50/20 p-4 rounded-t-2xl border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {insightModal === 'current' && '💰 Ahorro Actual'}
                    {insightModal === 'remaining' && '🎯 Falta Ahorrar'}
                    {insightModal === 'days' && '⏰ Días Restantes'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">{goal.title}</p>
                </div>
                <button
                  onClick={() => setInsightModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {insightModal === 'current' && (
                <>
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                    <p className="text-xl font-bold text-emerald-900 mb-1">{formatCurrency(goal.current)}</p>
                    <p className="text-xs text-emerald-700">Has ahorrado el <span className="font-bold">{progress.toFixed(1)}%</span> de tu meta</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">¡Excelente progreso!</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {progress >= 75 
                            ? "Estás muy cerca de alcanzar tu meta."
                            : progress >= 50
                            ? "Vas por la mitad del camino."
                            : progress >= 25
                            ? "Has dado los primeros pasos."
                            : "Cada gran meta comienza aquí."}
                        </p>
                      </div>
                    </div>
                    
                    {activities.length > 0 && (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Última contribución</p>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {formatCurrency(activities[0].amount)} hace {Math.floor((Date.now() - new Date(activities[0].created_at).getTime()) / (1000 * 60 * 60 * 24))} días
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {insightModal === 'remaining' && (
                <>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-xl font-bold text-amber-900 mb-1">{formatCurrency(remaining)}</p>
                    <p className="text-xs text-amber-700">Te falta ahorrar para completar tu meta</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Target className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Sugerencia de ahorro</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {goal.required_weekly_saving 
                            ? `Ahorra ${formatCurrency(goal.required_weekly_saving)} por semana.`
                            : goal.deadline
                            ? `Necesitas ${formatCurrency(remaining / Math.max(daysRemaining || 1, 1) * 7)} por semana.`
                            : "Establece una fecha límite."}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Consejo Moni AI</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {remaining > goal.target * 0.5
                            ? "Aportes pequeños pero frecuentes."
                            : "¡Ya casi llegas! Mantén el ritmo."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {insightModal === 'days' && daysRemaining !== null && (
                <>
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <p className="text-xl font-bold text-blue-900 mb-1">{daysRemaining} días</p>
                    <p className="text-xs text-blue-700">
                      {daysRemaining > 365 ? `${Math.floor(daysRemaining / 365)} años y ${Math.floor((daysRemaining % 365) / 30)} meses` : 
                       daysRemaining > 30 ? `${Math.floor(daysRemaining / 30)} meses` : 
                       `${daysRemaining} días`} para tu meta
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Fecha objetivo</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {goal.deadline && new Date(goal.deadline).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-3 w-3 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Estado del progreso</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {daysRemaining < 30 && progress < 75
                            ? "⚠️ Acelera tus aportes."
                            : daysRemaining < 90 && progress < 50
                            ? "Considera aportar más frecuente."
                            : "Vas bien encaminado."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={() => setInsightModal(null)}
                className="w-full h-10 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:shadow-sm transition-all duration-300 rounded-xl font-medium text-sm"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoalDetails;
