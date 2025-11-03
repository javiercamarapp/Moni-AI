import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Target, TrendingUp, MessageCircle, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { AddFundsModal } from "@/components/goals/AddFundsModal";

interface GroupGoal {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  predicted_completion_date?: string;
  required_weekly_saving?: number;
  ai_confidence?: number;
  category?: string;
  icon?: string;
}

interface Member {
  id: string;
  user_id: string;
  xp: number;
}

interface Activity {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
  activity_type: string;
}

const GroupGoalDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [goal, setGoal] = useState<GroupGoal | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFundsModal, setAddFundsModal] = useState(false);

  useEffect(() => {
    fetchGoalDetails();
  }, [id]);

  const fetchGoalDetails = async () => {
    try {
      // Fetch goal
      const { data: goalData, error: goalError } = await supabase
        .from('circle_goals')
        .select('*')
        .eq('id', id)
        .single();

      if (goalError) throw goalError;
      setGoal(goalData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', goalData.circle_id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('goal_activities')
        .select('*')
        .eq('goal_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);
    } catch (error: any) {
      console.error('Error fetching goal details:', error);
      toast.error('Error al cargar los detalles');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
    );
  }

  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;

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
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#c8a57b]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-[#c8a57b]/10 rounded-full flex items-center justify-center text-2xl">
                  {goal.icon || "🎯"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{goal.title}</h2>
                  {goal.description && (
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{progress.toFixed(0)}%</div>
                <p className="text-xs text-gray-600">completado</p>
              </div>
            </div>

            <Progress value={progress} className="h-4 mb-4" />

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{formatCurrency(goal.current_amount)}</span>
              <span className="font-bold text-gray-900">{formatCurrency(goal.target_amount)}</span>
            </div>
          </div>

          {/* AI Recommendation */}
          {(goal.predicted_completion_date || goal.required_weekly_saving) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#c8a57b]/20">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-[#c8a57b]/10 rounded-full flex items-center justify-center animate-pulse">
                  🤖
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Predicción Moni AI</h3>
                  {goal.predicted_completion_date && (
                    <p className="text-sm text-gray-700 mb-2">
                      Cumplirán esta meta el{' '}
                      <strong>
                        {new Date(goal.predicted_completion_date).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </strong>
                    </p>
                  )}
                  {goal.required_weekly_saving && (
                    <p className="text-sm text-gray-600">
                      💰 Cada miembro debe ahorrar {formatCurrency(goal.required_weekly_saving / members.length)}/semana
                    </p>
                  )}
                  {goal.ai_confidence && (
                    <div className="mt-3">
                      <Progress value={goal.ai_confidence * 100} className="h-2 mb-1" />
                      <p className="text-xs text-gray-500">Confianza: {Math.round(goal.ai_confidence * 100)}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#c8a57b]/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c8a57b]" />
              Miembros ({members.length})
            </h3>
            <div className="space-y-3">
              {members.map((member, idx) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-[#f5efea] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-[#c8a57b] to-[#e3c890] text-white">
                        {idx + 1}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Miembro {idx + 1}</p>
                      <p className="text-xs text-gray-600">{member.xp} XP</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(goal.current_amount / members.length)}
                    </p>
                    <p className="text-xs text-gray-600">aportado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          {activities.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#c8a57b]/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#c8a57b]" />
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm text-gray-900">
                        {activity.activity_type === 'contribution' ? '💰 Contribución' : '📝 Actividad'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(activity.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setAddFundsModal(true)}
              className="flex-1 h-12 bg-white border-2 border-[#c8a57b] text-gray-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar aporte
            </Button>
            <Button
              onClick={() => navigate(`/group-goals/${id}/chat`)}
              className="flex-1 h-12 bg-white border-2 border-[#c8a57b] text-gray-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl font-semibold"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat grupal
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Add Funds Modal */}
      {addFundsModal && goal && (
        <AddFundsModal
          isOpen={addFundsModal}
          onClose={() => setAddFundsModal(false)}
          onSuccess={fetchGoalDetails}
          goal={{
            id: goal.id,
            title: goal.title,
            target: goal.target_amount,
            current: goal.current_amount,
          }}
        />
      )}
    </>
  );
};

export default GroupGoalDetails;
