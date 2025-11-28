import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Target, TrendingUp, MessageCircle, Plus, Sparkles, Send, X, DollarSign } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [loading, setLoading] = useState(true);
  const [addFundsModal, setAddFundsModal] = useState(false);
  const [notifyGroup, setNotifyGroup] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<'individual' | 'completed' | 'days' | 'members' | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [contributionLoading, setContributionLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [userAccounts, setUserAccounts] = useState<Array<{id: string, name: string, value: number}>>([]);

  useEffect(() => {
    fetchGoalDetails();
    fetchUserAccounts();
  }, [id]);

  const fetchUserAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accounts, error } = await supabase
        .from('assets')
        .select('id, name, value, category')
        .eq('user_id', user.id)
        .eq('category', 'Activos líquidos')
        .order('value', { ascending: false });

      if (error) throw error;
      setUserAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

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

      // Fetch actual contributions from circle_goal_members
      const { data: contributionsData, error: contribError } = await supabase
        .from('circle_goal_members')
        .select('user_id, current_amount, completed')
        .eq('goal_id', id);

      if (contribError) throw contribError;

      // Calculate individual contributions and status
      const perPersonTarget = goalData.target_amount / (membersData?.length || 1);
      const enrichedMembers = (membersData || []).map(member => {
        // Get real contribution from circle_goal_members
        const memberContribution = contributionsData?.find(c => c.user_id === member.user_id);
        const contributed = memberContribution?.current_amount || 0;
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
      <div className="page-standard min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" message="Cargando meta grupal..." />
      </div>
    );
  }

  // Progress based on total contributions vs target
  const totalContributed = members.reduce((sum, m) => sum + m.contributed, 0);
  const progress = goal.target_amount > 0 ? (totalContributed / goal.target_amount) * 100 : 0;
  // Each person has the same individual target
  const perPersonTarget = goal.target_amount / members.length;
  const daysRemaining = goal.deadline 
    ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <div className="page-standard min-h-screen pb-24 bg-gradient-to-b from-amber-50/30 to-orange-50/20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-purple-50/80 via-cyan-50/60 to-transparent backdrop-blur-sm">
          <div className="page-container py-3">
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

        <div className="page-container py-6 space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100 hover:shadow-md transition-all duration-300 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">
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

            <Progress value={progress} className="h-2 mb-2" indicatorClassName="bg-green-500" />

            <div className="flex justify-between text-xs">
              <span className="text-gray-600">{formatCurrency(totalContributed)} contribuido</span>
              <span className="font-bold text-gray-900">{formatCurrency(goal.target_amount)} meta</span>
            </div>
          </div>

          {/* Resumen de Meta */}
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => {
                setSelectedDetail('individual');
                setShowDetailsModal(true);
              }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-2 shadow-sm border border-amber-200 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in cursor-pointer"
            >
              <p className="text-[10px] text-amber-700 mb-0.5">Meta Individual</p>
              <p className="text-sm font-bold text-amber-900">{formatCurrency(perPersonTarget)}</p>
            </button>
            <button 
              onClick={() => {
                setSelectedDetail('completed');
                setShowDetailsModal(true);
              }}
              className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2 shadow-sm border border-emerald-200 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in cursor-pointer"
            >
              <p className="text-[10px] text-emerald-700 mb-0.5">Completaron</p>
              <p className="text-sm font-bold text-emerald-600">{goal.completed_members} de {members.length}</p>
            </button>
            {goal.deadline && (
              <button 
                onClick={() => {
                  setSelectedDetail('days');
                  setShowDetailsModal(true);
                }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2 shadow-sm border border-blue-200 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in cursor-pointer"
              >
                <p className="text-[10px] text-blue-700 mb-0.5">Días Restantes</p>
                <p className="text-sm font-bold text-blue-900">{daysRemaining}</p>
              </button>
            )}
            <button 
              onClick={() => {
                setSelectedDetail('members');
                setShowDetailsModal(true);
              }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 shadow-sm border border-purple-200 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in cursor-pointer"
            >
              <p className="text-[10px] text-purple-700 mb-0.5">Miembros</p>
              <p className="text-sm font-bold text-purple-900">{members.length}</p>
            </button>
          </div>

          {/* AI Recommendation */}
          <MoniAIPrediction goalId={id!} isGroupGoal={true} />

          {/* Members Progress - Leaderboard Style */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
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
                            <AvatarFallback className="bg-gray-100 text-gray-900">
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
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
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

          {/* Chat Grupal Button */}
          <Button
            onClick={() => navigate(`/group-goals/${id}/chat`)}
            className="w-full h-12 bg-white border border-gray-200 text-gray-900 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl font-semibold"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Abrir chat grupal ({chatMessages.length} mensajes)
          </Button>

          {/* Details Modal */}
          {showDetailsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowDetailsModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className={`p-6 rounded-t-2xl ${
                  selectedDetail === 'individual' ? 'bg-gradient-to-br from-amber-50 to-orange-50' :
                  selectedDetail === 'completed' ? 'bg-gradient-to-br from-emerald-50 to-green-50' :
                  selectedDetail === 'days' ? 'bg-gradient-to-br from-blue-50 to-cyan-50' :
                  'bg-gradient-to-br from-purple-50 to-pink-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedDetail === 'individual' && '🎯 Meta Individual'}
                      {selectedDetail === 'completed' && '✅ Miembros que Completaron'}
                      {selectedDetail === 'days' && '📅 Tiempo Restante'}
                      {selectedDetail === 'members' && '👥 Lista de Miembros'}
                    </h2>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="p-2 hover:bg-white/50 rounded-full transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {selectedDetail === 'individual' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">
                        Cada miembro del grupo debe alcanzar <span className="font-bold text-amber-600">{formatCurrency(goal.target_amount)}</span> para completar su parte.
                      </p>
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <p className="text-xs text-amber-900 mb-2">💡 <strong>Objetivo del grupo:</strong></p>
                        <p className="text-xs text-amber-800">
                          Todos juntos buscan reunir <strong>{formatCurrency(goal.target_amount * members.length)}</strong> en total.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDetail === 'completed' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-bold text-emerald-600">{goal.completed_members}</span> de <span className="font-bold">{members.length}</span> miembros han completado su meta individual.
                      </p>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <p className="text-xs text-emerald-900 mb-2">🎉 <strong>Progreso grupal:</strong></p>
                        <p className="text-xs text-emerald-800">
                          El {((goal.completed_members / members.length) * 100).toFixed(0)}% del grupo ya alcanzó su objetivo.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDetail === 'days' && goal.deadline && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">
                        Quedan <span className="font-bold text-blue-600">{daysRemaining} días</span> para alcanzar la meta grupal.
                      </p>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-xs text-blue-900 mb-2">📅 <strong>Fecha límite:</strong></p>
                        <p className="text-xs text-blue-800">
                          {new Date(goal.deadline).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {daysRemaining < 30 && (
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                          <p className="text-xs text-yellow-900">
                            ⚠️ Menos de un mes restante. ¡Es momento de acelerar!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDetail === 'members' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 mb-4">
                        El grupo está compuesto por <span className="font-bold text-purple-600">{members.length} miembros</span> activos.
                      </p>
                      <div className="space-y-2">
                        {members.map((member, idx) => {
                          const memberProgress = (member.contributed / perPersonTarget) * 100;
                          return (
                            <div key={member.id} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Miembro {idx + 1}</p>
                                    <p className="text-xs text-gray-600">{getStatusText(member.status)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-purple-900">{memberProgress.toFixed(0)}%</p>
                                  <p className="text-xs text-gray-600">{formatCurrency(member.contributed)}</p>
                                </div>
                              </div>
                              <div className="w-full bg-purple-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${getStatusColor(member.status)}`}
                                  style={{ width: `${Math.min(memberProgress, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full h-12 bg-white border border-gray-200 text-gray-900 rounded-xl font-medium shadow-sm cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <Button
            onClick={() => setAddFundsModal(true)}
            className="w-full h-14 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:shadow-md transition-all duration-300 rounded-xl font-semibold text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Contribuir
          </Button>
        </div>
      </div>

      <BottomNav />

      {/* Add Funds Modal - Adapted for Group Goals */}
      {addFundsModal && goal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-b from-amber-50/30 to-orange-50/20 p-4 rounded-t-2xl border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Contribuir a la meta</h2>
                  <p className="text-xs text-gray-600 mt-0.5">{goal.title}</p>
                </div>
                <button
                  onClick={() => {
                    setAddFundsModal(false);
                    setContributionAmount("");
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setContributionLoading(true);

                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) throw new Error("Not authenticated");

                  const amountNum = parseFloat(contributionAmount);
                  if (isNaN(amountNum) || amountNum <= 0) {
                    toast.error("Ingresa un monto válido");
                    return;
                  }

          // Only deduct from account if one is selected and it's not "none"
          if (selectedAccount && selectedAccount !== "none") {
                    // Get selected account details
                    const account = userAccounts.find(acc => acc.id === selectedAccount);
                    if (!account) {
                      toast.error("Cuenta no encontrada");
                      return;
                    }

                    if (account.value < amountNum) {
                      toast.error("Saldo insuficiente en la cuenta seleccionada");
                      return;
                    }

                    // Deduct from account
                    const { error: accountError } = await supabase
                      .from('assets')
                      .update({ value: account.value - amountNum })
                      .eq('id', selectedAccount);

                    if (accountError) throw accountError;
                  }

                  // Update or create member record with contribution
                  const { data: memberData, error: fetchError } = await supabase
                    .from('circle_goal_members')
                    .select('id, current_amount')
                    .eq('goal_id', goal.id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                  if (fetchError) throw fetchError;

                  const newAmount = (memberData?.current_amount || 0) + amountNum;
                  const targetPerPerson = goal.target_amount / members.length;
                  const isCompleted = newAmount >= targetPerPerson;

                  if (memberData) {
                    // Update existing member record
                    const { error: updateError } = await supabase
                      .from('circle_goal_members')
                      .update({ 
                        current_amount: newAmount,
                        completed: isCompleted,
                        completed_at: isCompleted ? new Date().toISOString() : null,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', memberData.id);

                    if (updateError) throw updateError;
                  } else {
                    // Create new member record
                    const { error: insertError } = await supabase
                      .from('circle_goal_members')
                      .insert({
                        goal_id: goal.id,
                        user_id: user.id,
                        current_amount: amountNum,
                        completed: isCompleted,
                        completed_at: isCompleted ? new Date().toISOString() : null
                      });

                    if (insertError) throw insertError;
                  }

                  // Update completed_members count in circle_goals
                  const { data: completedCount } = await supabase
                    .from('circle_goal_members')
                    .select('id', { count: 'exact' })
                    .eq('goal_id', goal.id)
                    .eq('completed', true);

                  await supabase
                    .from('circle_goals')
                    .update({ completed_members: completedCount?.length || 0 })
                    .eq('id', goal.id);

                  // Log activity
                  await supabase
                    .from('goal_activities')
                    .insert({
                      goal_id: goal.id,
                      user_id: user.id,
                      activity_type: 'contribution',
                      amount: amountNum,
                      message: (selectedAccount && selectedAccount !== "none")
                        ? `Aportó ${formatCurrency(amountNum)} desde ${userAccounts.find(acc => acc.id === selectedAccount)?.name}`
                        : `Aportó ${formatCurrency(amountNum)}`
                    });

                  // Schedule reminder if enabled
                  if (notifyGroup) {
                    // Create notification setting for 15-day reminders
                    await supabase
                      .from('notification_history')
                      .insert({
                        user_id: user.id,
                        notification_type: 'goal_reminder',
                        message: `Recordatorio: Realizar aporte a la meta "${goal.title}"`,
                        metadata: {
                          goal_id: goal.id,
                          reminder_type: 'biweekly',
                          next_reminder: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
                        }
                      });
                  }

                  toast.success(
                    (selectedAccount && selectedAccount !== "none")
                      ? `¡Aporte de ${formatCurrency(amountNum)} registrado desde ${userAccounts.find(acc => acc.id === selectedAccount)?.name}! 🎉`
                      : `¡Aporte de ${formatCurrency(amountNum)} registrado! 🎉`
                  );
                  setAddFundsModal(false);
                  setContributionAmount("");
                  setSelectedAccount("");
                  fetchGoalDetails();
                  fetchUserAccounts();
                } catch (error: any) {
                  console.error('Error adding contribution:', error);
                  toast.error('Error al registrar la contribución');
                } finally {
                  setContributionLoading(false);
                }
              }} 
              className="p-4 space-y-3"
            >
                {/* Progress Info */}
                <div className="bg-white border border-gray-200 rounded-xl p-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Tu meta personal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(perPersonTarget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Aporte sugerido quincenal</span>
                  <span className="font-bold text-gray-900">
                    {goal.required_weekly_saving 
                      ? formatCurrency((goal.required_weekly_saving / members.length) * 2)
                      : formatCurrency(1250)
                    }
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <Label htmlFor="contribution-amount" className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3.5 w-3.5 text-gray-700" />
                  Cantidad a aportar
                </Label>
                <Input
                  id="contribution-amount"
                  type="text"
                  value={isFocused ? contributionAmount : (contributionAmount ? parseFloat(contributionAmount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setContributionAmount(value);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                    placeholder="1,000.00"
                    required
                    className="h-12 rounded-xl text-base bg-white border-gray-200 font-semibold text-gray-900"
                />
              </div>

              {/* Quick Amounts */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Montos rápidos</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "10%", value: perPersonTarget * 0.1 },
                    { label: "25%", value: perPersonTarget * 0.25 },
                    { label: "50%", value: perPersonTarget * 0.5 },
                    { label: "Total", value: perPersonTarget }
                  ].map((suggested) => (
                    <button
                      key={suggested.label}
                      type="button"
                      onClick={() => setContributionAmount(suggested.value.toFixed(2))}
                      className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <p className="text-xs font-medium text-gray-900">{suggested.label}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        ${suggested.value.toFixed(0)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

                {/* Account Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="account-select" className="flex items-center gap-2 text-xs text-gray-700">
                    💳 Cuenta de origen
                  </Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="h-10 rounded-xl bg-white border-gray-200 text-sm">
                      <SelectValue placeholder="Selecciona cuenta de origen" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 z-50">
                      <SelectItem value="none">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">Sin cuenta de origen</span>
                        </div>
                      </SelectItem>
                      {userAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{account.name}</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {formatCurrency(account.value)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userAccounts.length === 0 && (
                  <p className="text-xs text-gray-500">
                    ℹ️ No tienes cuentas líquidas registradas.
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto"
                    checked={notifyGroup}
                    onCheckedChange={(checked) => setNotifyGroup(!!checked)}
                  />
                  <label htmlFor="auto" className="text-xs text-gray-700">
                    Notificar cada 15 días para realizar aportaciones
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="notify" defaultChecked />
                  <label htmlFor="notify" className="text-xs text-gray-700">
                    Mostrar mi aporte al grupo ✅
                  </label>
                </div>
              </div>

                {/* AI Insight */}
                {contributionAmount && parseFloat(contributionAmount) > 0 && (
                  <div className="bg-white rounded-xl p-2.5 border border-gray-200">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-gray-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 mb-0.5">Tu progreso</p>
                      <p className="text-[11px] text-gray-700">
                        Con este aporte llegarás al <span className="font-semibold text-gray-900">
                          {((parseFloat(contributionAmount) / perPersonTarget) * 100).toFixed(1)}%
                        </span> de tu meta personal
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => {
                    setAddFundsModal(false);
                    setContributionAmount("");
                  }}
                  variant="outline"
                  className="flex-1 h-10 bg-gray-50 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-0 text-gray-600 font-medium text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={contributionLoading}
                  className="flex-1 h-10 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-white transition-all text-gray-900 font-semibold text-sm"
                >
                  {contributionLoading ? "Procesando..." : "Confirmar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupGoalDetails;
