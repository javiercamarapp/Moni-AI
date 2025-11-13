import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Award, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface UserStats {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  score_moni: number;
  total_xp: number;
  level: number;
  total_goals: number;
  completed_goals: number;
  active_savings: number;
  badges_count: number;
}

const FriendComparison = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [friendStats, setFriendStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchComparisonData();
    }
  }, [id]);

  const fetchComparisonData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Verify friendship
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

      // Fetch both profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, score_moni, total_xp, level')
        .in('id', [user.id, id]);

      if (!profiles) throw new Error('No se pudieron cargar los perfiles');

      const myProfile = profiles.find(p => p.id === user.id);
      const friendProfile = profiles.find(p => p.id === id);

      // Fetch goals stats
      const { data: myGoals } = await supabase
        .from('goals')
        .select('id, target, current')
        .eq('user_id', user.id);

      const { data: friendGoals } = await supabase
        .from('goals')
        .select('id, target, current')
        .eq('user_id', id)
        .eq('is_public', true);

      // Fetch badges count
      const { count: myBadgesCount } = await supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: friendBadgesCount } = await supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      // Calculate stats
      const myCompletedGoals = myGoals?.filter(g => g.current >= g.target).length || 0;
      const myActiveSavings = myGoals?.reduce((sum, g) => sum + Number(g.current), 0) || 0;

      const friendCompletedGoals = friendGoals?.filter(g => g.current >= g.target).length || 0;
      const friendActiveSavings = friendGoals?.reduce((sum, g) => sum + Number(g.current), 0) || 0;

      setMyStats({
        id: myProfile?.id || '',
        username: myProfile?.username || '',
        full_name: myProfile?.full_name || '',
        avatar_url: myProfile?.avatar_url || '',
        score_moni: myProfile?.score_moni || 50,
        total_xp: myProfile?.total_xp || 0,
        level: myProfile?.level || 1,
        total_goals: myGoals?.length || 0,
        completed_goals: myCompletedGoals,
        active_savings: myActiveSavings,
        badges_count: myBadgesCount || 0
      });

      setFriendStats({
        id: friendProfile?.id || '',
        username: friendProfile?.username || '',
        full_name: friendProfile?.full_name || '',
        avatar_url: friendProfile?.avatar_url || '',
        score_moni: friendProfile?.score_moni || 50,
        total_xp: friendProfile?.total_xp || 0,
        level: friendProfile?.level || 1,
        total_goals: friendGoals?.length || 0,
        completed_goals: friendCompletedGoals,
        active_savings: friendActiveSavings,
        badges_count: friendBadgesCount || 0
      });

    } catch (error: any) {
      console.error('Error fetching comparison data:', error);
      toast.error('Error al cargar la comparación');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
    );
  }

  if (!myStats || !friendStats) {
    return null;
  }

  const comparisonData = [
    {
      metric: 'Score',
      Tú: myStats.score_moni,
      Amigo: friendStats.score_moni
    },
    {
      metric: 'Nivel',
      Tú: myStats.level,
      Amigo: friendStats.level
    },
    {
      metric: 'Metas',
      Tú: myStats.total_goals,
      Amigo: friendStats.total_goals
    },
    {
      metric: 'Completadas',
      Tú: myStats.completed_goals,
      Amigo: friendStats.completed_goals
    },
    {
      metric: 'Insignias',
      Tú: myStats.badges_count,
      Amigo: friendStats.badges_count
    }
  ];

  const radarData = [
    {
      subject: 'Score Moni',
      Tú: myStats.score_moni,
      Amigo: friendStats.score_moni,
      fullMark: 100
    },
    {
      subject: 'Nivel',
      Tú: myStats.level * 10,
      Amigo: friendStats.level * 10,
      fullMark: 100
    },
    {
      subject: 'Metas Activas',
      Tú: Math.min((myStats.total_goals / 10) * 100, 100),
      Amigo: Math.min((friendStats.total_goals / 10) * 100, 100),
      fullMark: 100
    },
    {
      subject: 'Completadas',
      Tú: Math.min((myStats.completed_goals / 10) * 100, 100),
      Amigo: Math.min((friendStats.completed_goals / 10) * 100, 100),
      fullMark: 100
    },
    {
      subject: 'Insignias',
      Tú: Math.min((myStats.badges_count / 20) * 100, 100),
      Amigo: Math.min((friendStats.badges_count / 20) * 100, 100),
      fullMark: 100
    }
  ];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-[#E5DEFF] to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/95 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Comparación de Progreso
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* User Avatars */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <Avatar className="h-16 w-16 mx-auto border-4 border-primary/20 shadow-lg mb-2">
              <AvatarImage src={myStats.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials(myStats.full_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-bold text-gray-900">{myStats.full_name}</p>
            <p className="text-xs text-primary">@{myStats.username}</p>
          </div>

          <div className="px-4">
            <div className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-full p-3 shadow-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>

          <div className="text-center flex-1">
            <Avatar className="h-16 w-16 mx-auto border-4 border-purple-500/20 shadow-lg mb-2">
              <AvatarImage src={friendStats.avatar_url} />
              <AvatarFallback className="bg-purple-500/10 text-purple-600 text-lg font-bold">
                {getInitials(friendStats.full_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-bold text-gray-900">{friendStats.full_name}</p>
            <p className="text-xs text-purple-600">@{friendStats.username}</p>
          </div>
        </div>

        {/* Quick Stats Comparison */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs text-gray-600 mb-1">Score Moni</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-primary">{myStats.score_moni}</span>
                <span className="text-xs text-gray-400">vs</span>
                <span className="text-lg font-bold text-purple-600">{friendStats.score_moni}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Target className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs text-gray-600 mb-1">Metas</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-primary">{myStats.total_goals}</span>
                <span className="text-xs text-gray-400">vs</span>
                <span className="text-lg font-bold text-purple-600">{friendStats.total_goals}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Award className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs text-gray-600 mb-1">Insignias</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-primary">{myStats.badges_count}</span>
                <span className="text-xs text-gray-400">vs</span>
                <span className="text-lg font-bold text-purple-600">{friendStats.badges_count}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart Comparison */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">Comparación Detallada</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tú" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Amigo" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">Perfil de Habilidades</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" style={{ fontSize: '11px' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} style={{ fontSize: '10px' }} />
                <Radar name="Tú" dataKey="Tú" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                <Radar name="Amigo" dataKey="Amigo" stroke="#9333ea" fill="#9333ea" fillOpacity={0.5} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Savings Comparison */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">Ahorros Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{myStats.full_name}</span>
                  <span className="text-sm font-bold text-primary">
                    ${myStats.active_savings.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70"
                    style={{ 
                      width: `${Math.min((myStats.active_savings / Math.max(myStats.active_savings, friendStats.active_savings)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{friendStats.full_name}</span>
                  <span className="text-sm font-bold text-purple-600">
                    ${friendStats.active_savings.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                    style={{ 
                      width: `${Math.min((friendStats.active_savings / Math.max(myStats.active_savings, friendStats.active_savings)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FriendComparison;
