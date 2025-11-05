import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Target, TrendingUp, MessageCircle, Plus, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";
import { formatCurrency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { AddFundsModal } from "@/components/goals/AddFundsModal";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import MoniAIPrediction from "@/components/goals/MoniAIPrediction";

interface GroupGoal {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  target_amount: number;
  completed_members: number;
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
  contributed: number;
  status: 'adelantado' | 'al_dia' | 'atrasado' | 'muy_atrasado';
}

interface Activity {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
  activity_type: string;
  message?: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_system: boolean;
}

const GroupGoalDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [goal, setGoal] = useState<GroupGoal | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [addFundsModal, setAddFundsModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [notifyGroup, setNotifyGroup] = useState(true);

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

      // Fetch members with their contributions
      const { data: membersData, error: membersError } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', goalData.circle_id);

      if (membersError) throw membersError;

      // Calculate individual contributions and status
      const perPersonTarget = goalData.target_amount / (membersData?.length || 1);
      const enrichedMembers = (membersData || []).map(member => {
        // For demo, use XP as proxy for contribution
        const contributed = member.xp * 100; 
        const progressPercent = (contributed / perPersonTarget) * 100;
        
        let status: 'adelantado' | 'al_dia' | 'atrasado' | 'muy_atrasado';
        if (progressPercent >= 110) status = 'adelantado';
        else if (progressPercent >= 90) status = 'al_dia';
        else if (progressPercent >= 70) status = 'atrasado';
        else status = 'muy_atrasado';

        return {
          ...member,
          contributed,
          status
        };
      });

      setMembers(enrichedMembers);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('goal_activities')
        .select('*')
        .eq('goal_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

      // Fetch chat messages (using goal_comments table)
      const { data: chatData, error: chatError } = await supabase
        .from('goal_comments')
        .select('*')
        .eq('goal_id', id)
        .order('created_at', { ascending: true });

      if (!chatError && chatData) {
        setChatMessages(chatData.map(c => ({
          id: c.id,
          user_id: c.user_id,
          message: c.comment,
          created_at: c.created_at,
          is_system: false
        })));
      }
    } catch (error: any) {
      console.error('Error fetching goal details:', error);
      toast.error('Error al cargar los detalles');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('goal_comments')
        .insert({
          goal_id: id!,
          user_id: user.id,
          comment: newMessage
        });

      if (error) throw error;

      setNewMessage("");
      fetchGoalDetails();
      toast.success("Mensaje enviado");
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'adelantado': return 'bg-green-500';
      case 'al_dia': return 'bg-blue-500';
      case 'atrasado': return 'bg-yellow-500';
      case 'muy_atrasado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'adelantado': return '🟢 Adelantado';
      case 'al_dia': return '🔵 Al día';
      case 'atrasado': return '🟡 Atrasado';
      case 'muy_atrasado': return '🔴 Muy atrasado';
      default: return '⚪ Sin datos';
    }
  };

  if (loading || !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" message="Cargando meta grupal..." />
      </div>
    );
  }

  // Progress based on members who completed
  const progress = members.length > 0 ? (goal.completed_members / members.length) * 100 : 0;
  // Each person has the same individual target
  const perPersonTarget = goal.target_amount;
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
          <div className="bg-white rounded-xl shadow-lg p-3 border border-[#c8a57b]/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-[#c8a57b]/10 rounded-full flex items-center justify-center text-lg">
                  {goal.icon || "🎯"}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{goal.title}</h2>
                  {goal.description && (
                    <p className="text-xs text-gray-600">{goal.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{progress.toFixed(0)}%</div>
                <p className="text-xs text-gray-600">completado</p>
              </div>
            </div>

            <Progress value={progress} className="h-2 mb-2" />

            <div className="flex justify-between text-xs">
              <span className="text-gray-600">{goal.completed_members} completaron</span>
              <span className="font-bold text-gray-900">{members.length} miembros</span>
            </div>
          </div>

          {/* Resumen de Meta */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-2 shadow-sm border border-amber-200 text-center">
              <p className="text-[10px] text-amber-700 mb-0.5">Meta Individual</p>
              <p className="text-sm font-bold text-amber-900">{formatCurrency(goal.target_amount)}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2 shadow-sm border border-emerald-200 text-center">
              <p className="text-[10px] text-emerald-700 mb-0.5">Completaron</p>
              <p className="text-sm font-bold text-emerald-600">{goal.completed_members} de {members.length}</p>
            </div>
            {goal.deadline && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2 shadow-sm border border-blue-200 text-center">
                <p className="text-[10px] text-blue-700 mb-0.5">Días Restantes</p>
                <p className="text-sm font-bold text-blue-900">{daysRemaining}</p>
              </div>
            )}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 shadow-sm border border-purple-200 text-center">
              <p className="text-[10px] text-purple-700 mb-0.5">Miembros</p>
              <p className="text-sm font-bold text-purple-900">{members.length}</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <MoniAIPrediction
            target={goal.target_amount}
            deadline={goal.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
            memberCount={1}
            saved={0}
          />

          {/* Members Progress - Leaderboard Style */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#c8a57b]/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c8a57b]" />
              Progreso Individual
            </h3>
            <div className="space-y-4">
              {members
                .sort((a, b) => b.contributed - a.contributed)
                .map((member, idx) => {
                  const memberProgress = (member.contributed / perPersonTarget) * 100;
                  return (
                    <div key={member.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-[#c8a57b] to-[#e3c890] text-white">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Miembro {idx + 1}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${getStatusColor(member.status)}`}
                                  style={{ width: `${Math.min(memberProgress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-900 min-w-[40px]">
                                {memberProgress.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-600 mb-1">{getStatusText(member.status)}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(member.contributed)}
                          </p>
                          <p className="text-xs text-gray-500">
                            de {formatCurrency(perPersonTarget)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

          {/* Chat Grupal */}
          {showChat ? (
            <div className="bg-white rounded-2xl shadow-lg border border-[#c8a57b]/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-[#c8a57b]" />
                  Chat Grupal
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                  className="text-gray-600"
                >
                  Cerrar
                </Button>
              </div>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay mensajes aún. ¡Sé el primero en escribir!
                  </p>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl ${
                        msg.is_system ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      {msg.is_system && (
                        <p className="text-xs text-blue-600 mb-1">🤖 Moni AI</p>
                      )}
                      <p className="text-sm text-gray-900">{msg.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.created_at).toLocaleString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-[#c8a57b] to-[#e3c890] text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowChat(true)}
              className="w-full h-12 bg-white border-2 border-[#c8a57b] text-gray-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl font-semibold"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Abrir chat grupal ({chatMessages.length} mensajes)
            </Button>
          )}

          {/* Actions */}
          <Button
            onClick={() => setAddFundsModal(true)}
            className="w-full h-14 bg-gradient-to-r from-[#c8a57b] to-[#e3c890] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl font-semibold text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Contribuir 💸
          </Button>
        </div>
      </div>

      <BottomNav />

      {/* Add Funds Modal - Adapted for Group Goals */}
      {addFundsModal && goal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-[#c8a57b] to-[#e3c890] p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Contribuir a la meta</h2>
                  <p className="text-sm text-white/80 mt-1">{goal.title}</p>
                </div>
                <button
                  onClick={() => setAddFundsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tu meta personal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(perPersonTarget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Aporte sugerido quincenal</span>
                  <span className="font-bold text-[#c8a57b]">
                    {goal.required_weekly_saving 
                      ? formatCurrency((goal.required_weekly_saving / members.length) * 2)
                      : formatCurrency(1250)
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto"
                    checked={notifyGroup}
                    onCheckedChange={(checked) => setNotifyGroup(!!checked)}
                  />
                  <label htmlFor="auto" className="text-sm text-gray-700">
                    Aportar automáticamente cada 15 días
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="notify" defaultChecked />
                  <label htmlFor="notify" className="text-sm text-gray-700">
                    Mostrar mi aporte al grupo ✅
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
                <p className="text-xs font-medium text-gray-900 mb-1">💡 Tip Moni AI</p>
                <p className="text-xs text-gray-700">
                  Si aportas constantemente, ayudarás al grupo a cumplir la meta {daysRemaining && daysRemaining > 30 ? 'antes de tiempo' : 'a tiempo'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setAddFundsModal(false)}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    toast.success("¡Aporte registrado! 🎉 El grupo ahora lleva " + (progress + 5).toFixed(0) + "% del objetivo.");
                    setAddFundsModal(false);
                    fetchGoalDetails();
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-[#c8a57b] to-[#e3c890] hover:from-[#b8956b] hover:to-[#d3b880] text-white rounded-xl font-medium"
                >
                  Confirmar aporte
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupGoalDetails;
