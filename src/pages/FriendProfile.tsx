import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, Target, Award, TrendingUp, Calendar, Star, Heart, ThumbsUp, Flame, Sparkles, Send, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";

interface FriendProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  score_moni: number;
  total_xp: number;
  level: number;
}

interface FriendGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  category: string;
  icon: string;
  color: string;
  deadline: string | null;
  reactions: { reaction_type: string; count: number }[];
  userReaction: string | null;
  comments: GoalComment[];
}

interface GoalComment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
}

interface FriendBadge {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  earned_at: string;
}

interface FriendActivity {
  id: string;
  activity_type: string;
  description: string;
  xp_earned: number;
  created_at: string;
}

const FriendProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [goals, setGoals] = useState<FriendGoal[]>([]);
  const [badges, setBadges] = useState<FriendBadge[]>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(0);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const reactionEmojis = ['👍', '🎉', '💪', '🔥', '❤️', '👏'];

  useEffect(() => {
    if (id) {
      fetchFriendProfile();
      setupRealtimeSubscription();
    }
  }, [id]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('goal-interactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_reactions'
        },
        () => {
          fetchFriendProfile();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_comments'
        },
        () => {
          fetchFriendProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchFriendProfile = async () => {
    try {
      // Verify friendship
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: friendship } = await supabase
        .from('friendships')
        .select('status')
        .eq('user_id', user.id)
        .eq('friend_id', id)
        .eq('status', 'accepted')
        .single();

      if (!friendship) {
        toast.error('No eres amigo de este usuario');
        navigate('/friends-list');
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, score_moni, total_xp, level')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Calculate ranking
      const { data: allScores } = await supabase
        .from('user_scores')
        .select('user_id, score_moni')
        .order('score_moni', { ascending: false });

      const userRanking = allScores?.findIndex(s => s.user_id === id) ?? -1;
      setRanking(userRanking + 1);

      // Fetch public goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, title, target, current, category, icon, color, deadline')
        .eq('user_id', id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (goalsData && goalsData.length > 0) {
        // Fetch reactions for all goals
        const goalIds = goalsData.map(g => g.id);
        const { data: reactionsData } = await supabase
          .from('goal_reactions')
          .select('goal_id, reaction_type, user_id')
          .in('goal_id', goalIds);

        // Fetch comments for all goals
        const { data: commentsData } = await supabase
          .from('goal_comments')
          .select('id, goal_id, user_id, comment, created_at')
          .in('goal_id', goalIds)
          .order('created_at', { ascending: false });

        // Get unique user IDs from comments
        const commentUserIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
        const { data: commentUsers } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', commentUserIds);

        // Format goals with reactions and comments
        const formattedGoals: FriendGoal[] = goalsData.map(goal => {
          // Group reactions by type
          const goalReactions = reactionsData?.filter(r => r.goal_id === goal.id) || [];
          const reactionCounts: { [key: string]: number } = {};
          goalReactions.forEach(r => {
            reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          });
          const reactions = Object.entries(reactionCounts).map(([type, count]) => ({
            reaction_type: type,
            count
          }));

          // Check if current user reacted
          const userReaction = goalReactions.find(r => r.user_id === user.id)?.reaction_type || null;

          // Format comments
          const goalComments = commentsData?.filter(c => c.goal_id === goal.id).map(c => {
            const commentUser = commentUsers?.find(u => u.id === c.user_id);
            return {
              id: c.id,
              user_id: c.user_id,
              comment: c.comment,
              created_at: c.created_at,
              user_name: commentUser?.full_name || 'Usuario',
              user_avatar: commentUser?.avatar_url || ''
            };
          }) || [];

          return {
            ...goal,
            reactions,
            userReaction,
            comments: goalComments
          };
        });

        setGoals(formattedGoals);
      } else {
        setGoals([]);
      }

      setCurrentUserId(user.id);

      // Fetch badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badges (
            name,
            icon,
            rarity
          )
        `)
        .eq('user_id', id)
        .order('earned_at', { ascending: false })
        .limit(6);

      const formattedBadges = badgesData?.map(b => ({
        id: b.id,
        name: (b.badges as any)?.name || '',
        icon: (b.badges as any)?.icon || '🏆',
        rarity: (b.badges as any)?.rarity || 'common',
        earned_at: b.earned_at
      })) || [];

      setBadges(formattedBadges);

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('friend_activity')
        .select('id, activity_type, description, xp_earned, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      setActivities(activityData || []);

    } catch (error: any) {
      console.error('Error fetching friend profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const handleReaction = async (goalId: string, reactionType: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      if (goal.userReaction === reactionType) {
        // Remove reaction
        await supabase
          .from('goal_reactions')
          .delete()
          .eq('goal_id', goalId)
          .eq('user_id', currentUserId)
          .eq('reaction_type', reactionType);
        
        toast.success('Reacción eliminada');
      } else {
        // Add or change reaction
        if (goal.userReaction) {
          // Remove old reaction first
          await supabase
            .from('goal_reactions')
            .delete()
            .eq('goal_id', goalId)
            .eq('user_id', currentUserId);
        }

        // Insert new reaction
        await supabase
          .from('goal_reactions')
          .insert({
            goal_id: goalId,
            user_id: currentUserId,
            reaction_type: reactionType
          });

        toast.success('Reacción agregada');
      }
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      toast.error('Error al procesar reacción');
    }
  };

  const handleAddComment = async (goalId: string) => {
    try {
      const comment = newComment[goalId]?.trim();
      if (!comment) return;

      await supabase
        .from('goal_comments')
        .insert({
          goal_id: goalId,
          user_id: currentUserId,
          comment
        });

      setNewComment(prev => ({ ...prev, [goalId]: '' }));
      toast.success('Comentario agregado');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase
        .from('goal_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId);

      toast.success('Comentario eliminado');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('Error al eliminar comentario');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="page-standard min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5f0ee]/95 to-transparent backdrop-blur-sm">
        <div className="page-container py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Perfil de Amigo
            </h1>
          </div>
          <Button
            onClick={() => navigate(`/friend/${id}/compare`)}
            size="sm"
            variant="ghost"
            className="bg-white hover:bg-white/90 shadow-md rounded-2xl font-medium"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="page-container py-4 space-y-4">
        {/* Profile Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                <p className="text-sm text-primary">@{profile.username}</p>
              </div>

              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-lg font-bold text-gray-900">#{ranking}</span>
                  </div>
                  <p className="text-xs text-gray-600">Ranking</p>
                </div>

                <div className="text-center">
                  <p className={`text-lg font-bold ${getScoreColor(profile.score_moni)}`}>
                    {profile.score_moni}/100
                  </p>
                  <p className="text-xs text-gray-600">Score Moni</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center mb-1">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-gray-900">Nv.{profile.level}</span>
                  </div>
                  <p className="text-xs text-gray-600">{profile.total_xp} XP</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Goals */}
        {goals.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Metas Públicas
              </CardTitle>
              <CardDescription className="text-xs">
                {goals.length} {goals.length === 1 ? 'meta activa' : 'metas activas'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.map((goal) => {
                const progress = (goal.current / goal.target) * 100;
                return (
                  <div key={goal.id} className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-3 border border-primary/10">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">{goal.icon || '🎯'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{goal.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {goal.category || 'Personal'}
                          </Badge>
                          {goal.deadline && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(goal.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">
                          ${goal.current.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          de ${goal.target.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2 mb-2" />
                    <p className="text-xs text-gray-600 mb-3 text-right">{Math.round(progress)}%</p>

                    {/* Reactions */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {reactionEmojis.map(emoji => {
                        const reactionData = goal.reactions.find(r => r.reaction_type === emoji);
                        const isActive = goal.userReaction === emoji;
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(goal.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                              isActive 
                                ? 'bg-primary text-white shadow-md' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            {reactionData && reactionData.count > 0 && (
                              <span className="font-semibold">{reactionData.count}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Comments */}
                    {goal.comments.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {goal.comments.map(comment => (
                          <div key={comment.id} className="bg-white rounded-lg p-2 border border-gray-100">
                            <div className="flex items-start gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={comment.user_avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(comment.user_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900">{comment.user_name}</p>
                                <p className="text-xs text-gray-700 mt-1">{comment.comment}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(comment.created_at)}</p>
                              </div>
                              {comment.user_id === currentUserId && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="flex items-center gap-2">
                      <Textarea
                        value={newComment[goal.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [goal.id]: e.target.value }))}
                        placeholder="Agregar comentario..."
                        className="flex-1 min-h-[60px] text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(goal.id)}
                        disabled={!newComment[goal.id]?.trim()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Insignias
              </CardTitle>
              <CardDescription className="text-xs">
                {badges.length} {badges.length === 1 ? 'insignia desbloqueada' : 'insignias desbloqueadas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <div key={badge.id} className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full ${getRarityColor(badge.rarity)} flex items-center justify-center text-2xl shadow-lg`}>
                      {badge.icon}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 mt-2 line-clamp-1">{badge.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(badge.earned_at)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {activities.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="bg-primary/10 rounded-full p-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary font-semibold">+{activity.xp_earned} XP</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {goals.length === 0 && badges.length === 0 && activities.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sin actividad pública
              </h3>
              <p className="text-sm text-gray-600">
                {profile.full_name} aún no ha compartido metas o logros públicos
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FriendProfile;
