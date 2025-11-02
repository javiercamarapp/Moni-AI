import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, Plus, Trophy, Target, Users, Share2, Send, MessageCircle, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface MemberWithProfile {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string;
  xp: number;
  profiles: Profile | null;
}

type ActiveView = 'members' | 'challenges' | 'chat' | 'community' | 'news';

const CircleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateChallengeDialog, setShowCreateChallengeDialog] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeXP, setChallengeXP] = useState("20");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGainAmount, setXPGainAmount] = useState(0);
  const [progressGlow, setProgressGlow] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<ActiveView>('members');
  const chatRef = useRef<HTMLDivElement>(null);
  const xpSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchCircleData();
    setupRealtimeSubscription();
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchCircleData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      // Fetch circle details
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (circleError) {
        console.error('Error fetching circle:', circleError);
        toast.error('Error al buscar el círculo');
        navigate('/social');
        return;
      }
      
      if (!circleData) {
        toast.error('Este círculo no existe');
        navigate('/social');
        return;
      }
      setCircle(circleData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', id)
        .order('xp', { ascending: false });

      if (membersError) throw membersError;

      // Fetch profiles for members
      let enrichedMembers: MemberWithProfile[] = [];
      if (membersData && membersData.length > 0) {
        const memberIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', memberIds);

        // Enrich members with profile data
        enrichedMembers = membersData.map(member => {
          const profile = profilesData?.find(p => p.id === member.user_id);
          return {
            ...member,
            profiles: profile ? {
              id: profile.id,
              full_name: profile.full_name,
              username: profile.username,
              avatar_url: profile.avatar_url
            } : null
          };
        });
      }

      setMembers(enrichedMembers);

      // Check if current user is a member
      const isMemberCheck = enrichedMembers?.some(m => m.user_id === currentUser.id);
      setIsMember(isMemberCheck || false);

      // Fetch challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('circle_challenges')
        .select('*')
        .eq('circle_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('circle_goals')
        .select('*')
        .eq('circle_id', id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

      // Fetch activity/messages
      if (enrichedMembers && enrichedMembers.length > 0) {
        const memberIds = enrichedMembers.map(m => m.user_id);
        const { data: activityData } = await supabase
          .from('friend_activity')
          .select('*')
          .in('user_id', memberIds)
          .order('created_at', { ascending: false })
          .limit(20);

        if (activityData && activityData.length > 0) {
          // Enrich activity with profiles
          const enrichedActivity = activityData.map(activity => {
            const member = enrichedMembers.find(m => m.user_id === activity.user_id);
            return {
              ...activity,
              profiles: member?.profiles || null
            };
          });
          setMessages(enrichedActivity.reverse());
        }
      }
    } catch (error: any) {
      console.error('Error fetching circle data:', error);
      toast.error('Error al cargar el círculo');
    }
  };

  const setupRealtimeSubscription = () => {
    if (!id) return;

    const channel = supabase
      .channel(`circle-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_activity'
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'circle_goals',
          filter: `circle_id=eq.${id}`
        },
        () => {
          fetchCircleData();
          // Activar animación glow
          setProgressGlow(true);
          setTimeout(() => setProgressGlow(false), 1500);
          
          // Sonido de progreso
          if (xpSoundRef.current) {
            xpSoundRef.current.currentTime = 0;
            xpSoundRef.current.volume = 0.35;
            xpSoundRef.current.play().catch(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_members',
          filter: `circle_id=eq.${id}`
        },
        () => {
          fetchCircleData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_challenges',
          filter: `circle_id=eq.${id}`
        },
        () => {
          fetchCircleData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCompleteChallenge = async (challengeId: string, xpReward: number) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    // Verificar si ya completó este reto
    if (completedChallenges.has(challengeId)) {
      toast.info('Ya completaste este reto');
      return;
    }

    try {
      // Add XP to user in circle
      const memberData = members.find(m => m.user_id === user.id);
      if (memberData) {
        await supabase
          .from('circle_members')
          .update({ xp: (memberData.xp || 0) + xpReward })
          .eq('id', memberData.id);
      }

      // Add global XP
      await supabase.rpc('increment_social_xp', {
        target_user_id: user.id,
        xp_amount: xpReward
      });

      // Create activity log
      const { data: challengeData } = await supabase
        .from('circle_challenges')
        .select('title')
        .eq('id', challengeId)
        .single();

      await supabase
        .from('friend_activity')
        .insert({
          user_id: user.id,
          activity_type: 'challenge_completed',
          description: `completó el reto "${challengeData?.title || 'del círculo'}"`,
          xp_earned: xpReward
        });

      // Marcar como completado localmente
      setCompletedChallenges(prev => new Set([...prev, challengeId]));

      // Show XP animation
      setXPGainAmount(xpReward);
      setShowXPGain(true);
      setProgressGlow(true);

      // Play sound
      if (xpSoundRef.current) {
        xpSoundRef.current.currentTime = 0;
        xpSoundRef.current.volume = 0.35;
        xpSoundRef.current.play().catch(() => {});
      }

      setTimeout(() => {
        setShowXPGain(false);
        setProgressGlow(false);
      }, 2500);

      toast.success(`¡Reto completado! +${xpReward} XP`);
      fetchCircleData();
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast.error('Error al completar el reto');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;

    try {
      const message = newMessage.trim();
      
      // Detectar si el mensaje incluye un aporte de dinero
      const moneyMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (moneyMatch && (message.toLowerCase().includes('aporté') || message.toLowerCase().includes('aporte'))) {
        const amount = parseFloat(moneyMatch[1].replace(/,/g, ''));
        
        // Actualizar la meta del círculo usando la función RPC
        const { error: rpcError } = await supabase.rpc('update_circle_goal', {
          p_circle_id: id,
          p_amount: amount
        });

        if (rpcError) throw rpcError;
        
        const xpEarned = Math.max(1, Math.round(amount / 10));
        
        // Mostrar animación XP
        setXPGainAmount(xpEarned);
        setShowXPGain(true);
        setProgressGlow(true);
        
        setTimeout(() => {
          setShowXPGain(false);
          setProgressGlow(false);
        }, 2500);
        
        toast.success(`¡Aporte de $${amount} registrado! +${xpEarned} XP`);
      }

      // Insertar el mensaje en el feed
      await supabase
        .from('friend_activity')
        .insert({
          user_id: user.id,
          activity_type: 'circle_message',
          description: message,
          xp_earned: 0
        });

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    }
  };

  const handleJoinCircle = async () => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('circle_members')
        .insert({
          circle_id: id,
          user_id: user.id,
          xp: 0
        });

      if (error) throw error;

      // Update member count
      await supabase
        .from('circles')
        .update({ member_count: (circle?.member_count || 0) + 1 })
        .eq('id', id);

      toast.success('¡Te has unido al círculo!');
      fetchCircleData();
    } catch (error: any) {
      console.error('Error joining circle:', error);
      toast.error('Error al unirse al círculo');
    }
  };

  const handleCreateChallenge = async () => {
    if (!user || !id || !challengeTitle.trim()) {
      toast.error('Por favor completa el título del reto');
      return;
    }

    try {
      const { error } = await supabase
        .from('circle_challenges')
        .insert({
          circle_id: id,
          title: challengeTitle,
          description: challengeDescription,
          xp_reward: parseInt(challengeXP) || 20,
          created_by: user.id,
          is_active: true
        });

      if (error) throw error;

      toast.success('Reto creado exitosamente');
      setShowCreateChallengeDialog(false);
      setChallengeTitle("");
      setChallengeDescription("");
      setChallengeXP("20");
      fetchCircleData();
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast.error('Error al crear el reto');
    }
  };

  const handleShareCircle = () => {
    const inviteUrl = `${window.location.origin}/circle/${id}`;
    if (navigator.share) {
      navigator.share({
        title: `Únete al círculo ${circle?.name}`,
        text: `¡Únete a nuestro círculo "${circle?.name}" en Moni AI! 🚀`,
        url: inviteUrl
      });
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/social')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Volver a Social</span>
          </button>
        </div>
      </div>

      <div className="mx-auto px-4 py-2 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Circle Header */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
                💬 {circle.name}
              </h1>
              <p className="text-gray-600 text-sm">
                {circle.member_count} miembros · Categoría: {circle.category}
              </p>
              {circle.description && (
                <p className="text-gray-600 text-xs mt-2">{circle.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isMember ? (
              <Button
                onClick={handleJoinCircle}
                className="flex-1 bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9"
              >
                <Plus className="h-4 w-4 mr-1" />
                Unirme al círculo
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleShareCircle}
                  className="flex-1 bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invitar miembro
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => setActiveView('members')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                activeView === 'members' 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-gray-50 text-gray-600"
              )}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center leading-tight">Miembros</span>
            </button>

            <button
              onClick={() => setActiveView('challenges')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                activeView === 'challenges' 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-gray-50 text-gray-600"
              )}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center leading-tight">Retos activos</span>
            </button>

            <button
              onClick={() => setActiveView('chat')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                activeView === 'chat' 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-gray-50 text-gray-600"
              )}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center leading-tight">Chat grupal</span>
            </button>

            <button
              onClick={() => setActiveView('community')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                activeView === 'community' 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-gray-50 text-gray-600"
              )}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center leading-tight">Chat Comunidad</span>
            </button>

            <button
              onClick={() => setActiveView('news')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                activeView === 'news' 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-gray-50 text-gray-600"
              )}
            >
              <Newspaper className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center leading-tight">Noticias</span>
            </button>
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'members' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
              <Users className="h-4 w-4 text-primary" />
              Miembros del círculo
            </h2>
            {members.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-4">
                No hay miembros en este círculo aún
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                    <span className="text-xs font-bold w-6 text-center text-gray-600">
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src={member.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {(member.profiles?.full_name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">
                        {member.profiles?.full_name || 'Usuario'}
                      </p>
                      {member.profiles?.username && (
                        <p className="text-[10px] text-gray-500">@{member.profiles.username}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary">
                      {member.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'challenges' && (
          <>
            {/* Group Progress */}
            {goals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
                  <Target className="h-4 w-4 text-primary" />
                  Progreso grupal
                </h2>
                {goals.map((goal) => {
                  const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                  return (
                    <div key={goal.id} className="mb-4 last:mb-0">
                      <p className="text-gray-600 text-xs mb-2">
                        Meta: {goal.title}
                      </p>
                      <div className="relative">
                        <Progress 
                          value={Math.min(progress, 100)} 
                          className={cn(
                            "h-3 mb-2 transition-all duration-700",
                            progressGlow && "animate-pulse"
                          )}
                          style={{
                            filter: progressGlow ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.8))' : 'none'
                          }}
                        />
                        {progressGlow && (
                          <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping pointer-events-none" />
                        )}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700">{progress.toFixed(0)}% completado</span>
                        <span className="text-gray-500">
                          ${Number(goal.current_amount).toLocaleString()} / ${Number(goal.target_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Challenges */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
                <Trophy className="h-4 w-4 text-yellow-600" />
                🏆 Retos activos del grupo
              </h2>
              {challenges.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4">
                  No hay retos activos. {isMember && '¡Crea el primero!'}
                </p>
              ) : (
                <div className="space-y-3 mb-3">
                  {challenges.map((challenge) => {
                    const isCompleted = completedChallenges.has(challenge.id);
                    return (
                      <div 
                        key={challenge.id} 
                        className={cn(
                          "p-3 border rounded-xl transition-all",
                          isCompleted 
                            ? "border-emerald-200 bg-emerald-50/50 opacity-75" 
                            : "border-gray-100 bg-white"
                        )}
                      >
                        <div className="flex-1 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-medium block",
                              isCompleted ? "text-emerald-700 line-through" : "text-gray-900"
                            )}>
                              Reto: &quot;{challenge.title}&quot;
                            </span>
                            {isCompleted && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                ✓ Completado
                              </span>
                            )}
                          </div>
                          {challenge.description && (
                            <span className="text-xs text-gray-500 block mt-1">
                              {challenge.description} · +{challenge.xp_reward} XP
                            </span>
                          )}
                        </div>
                        {isMember && !isCompleted && (
                          <Button
                            onClick={() => handleCompleteChallenge(challenge.id, challenge.xp_reward)}
                            size="sm"
                            className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0 rounded-xl font-medium h-8 text-xs"
                          >
                            Marcar como completado
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {isMember && (
                <Button
                  onClick={() => setShowCreateChallengeDialog(true)}
                  className="w-full bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear nuevo reto
                </Button>
              )}
            </div>
          </>
        )}

        {activeView === 'chat' && isMember && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              💬 Chat del grupo
            </h2>
            <div 
              ref={chatRef}
              className="space-y-2 text-sm text-gray-700 max-h-96 overflow-y-auto mb-3 border rounded-xl p-3 bg-gray-50"
            >
              {messages.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  No hay mensajes aún. ¡Sé el primero en escribir!
                </p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="text-xs bg-white rounded-lg p-2">
                    <strong className="text-gray-900">
                      {msg.profiles?.full_name || msg.profiles?.username || 'Usuario'}:
                    </strong>{' '}
                    <span className="text-gray-700">{msg.description}</span>
                    {msg.xp_earned > 0 && (
                      <span className="text-emerald-600 font-semibold ml-1">
                        +{msg.xp_earned} XP
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-xl text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-4"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {activeView === 'community' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
              <Users className="h-4 w-4 text-primary" />
              Chat de la Comunidad
            </h2>
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm mb-2">Próximamente</p>
              <p className="text-gray-500 text-xs">
                Chat abierto para toda la comunidad de Moni
              </p>
            </div>
          </div>
        )}

        {activeView === 'news' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
              <Newspaper className="h-4 w-4 text-primary" />
              Noticias y Recomendaciones
            </h2>
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm mb-2">Próximamente</p>
              <p className="text-gray-500 text-xs">
                Noticias financieras y recomendaciones personalizadas
              </p>
            </div>
          </div>
        )}

        {/* Back Button */}
        <Button
          onClick={() => navigate('/social')}
          variant="outline"
          className="w-full bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Círculos
        </Button>
      </div>

      {/* XP Gain Animation */}
      {showXPGain && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div 
            className="text-emerald-600 text-3xl font-bold drop-shadow-2xl animate-bounce"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(52, 211, 153, 0.9))',
              textShadow: '0 0 20px rgba(52, 211, 153, 0.8)'
            }}
          >
            +{xpGainAmount} XP
          </div>
        </div>
      )}

      {/* Hidden audio element */}
      <audio 
        ref={xpSoundRef}
        preload="auto"
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_3b7f0b1df4.mp3"
      />

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateChallengeDialog} onOpenChange={setShowCreateChallengeDialog}>
        <DialogContent className="max-w-[320px] rounded-3xl border-none shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-center text-lg font-bold">Crear Reto del Círculo</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Define un reto personalizado para que los miembros del círculo puedan completar y ganar XP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Título del reto *</label>
              <Input
                placeholder="Ej: Ahorra $100 esta semana"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                maxLength={100}
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Descripción del reto</label>
              <Input
                placeholder="Explica en qué consiste el reto (opcional)"
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                maxLength={200}
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Recompensa en XP *</label>
              <Input
                type="number"
                placeholder="20"
                value={challengeXP}
                onChange={(e) => setChallengeXP(e.target.value)}
                min="1"
                max="1000"
                className="rounded-xl text-sm"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                💡 Recomendado: 10-50 XP para retos diarios, 50-200 XP para retos semanales
              </p>
            </div>
            <Button 
              onClick={handleCreateChallenge}
              disabled={!challengeTitle.trim() || !challengeXP}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl shadow-md font-medium disabled:opacity-50"
            >
              ✨ Crear reto personalizado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CircleDetails;
