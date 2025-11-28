import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Users, Zap, Calendar, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import heroAuth from '@/assets/moni-ai-logo.png';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SocialStats = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [friendsRankings, setFriendsRankings] = useState<any[]>([]);
  const [generalRankings, setGeneralRankings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [totalChallenges, setTotalChallenges] = useState<number>(0);
  const [dayStreak, setDayStreak] = useState<number>(0);
  const [friendsRank, setFriendsRank] = useState<number>(0);
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string>("3m");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get XP history based on period filter
      let monthsToFetch = 3;
      if (periodFilter === "1m") monthsToFetch = 1;
      if (periodFilter === "6m") monthsToFetch = 6;
      if (periodFilter === "1y") monthsToFetch = 12;

      const { data: xpHistoryData } = await supabase
        .from('monthly_rankings')
        .select('month, year, total_points, challenges_completed')
        .eq('user_id', user.id)
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (xpHistoryData) {
        // Filter by period
        const now = new Date();
        const filteredHistory = xpHistoryData.filter(record => {
          const recordDate = new Date(record.year, record.month - 1);
          const monthsDiff = (now.getFullYear() - recordDate.getFullYear()) * 12 + 
                            (now.getMonth() - recordDate.getMonth());
          return monthsDiff <= monthsToFetch;
        }).map(record => ({
          label: `${record.month}/${record.year}`,
          xp: record.total_points,
          retos: record.challenges_completed
        }));
        
        setXpHistory(filteredHistory);
      }

      // Get user's points for current month
      const { data: userRanking } = await supabase
        .from('monthly_rankings')
        .select('total_points, challenges_completed')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (userRanking) {
        setUserPoints(userRanking.total_points);
        setTotalChallenges(userRanking.challenges_completed);
      }

      // Get friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendships) {

        // Get friend IDs for friends ranking
        const friendIds = friendships.map(f => f.friend_id);
        const allUserIds = [...friendIds, user.id];

        // Get rankings for friends
        const { data: friendsRankData } = await supabase
          .from('monthly_rankings')
          .select(`
            user_id,
            total_points,
            challenges_completed
          `)
          .in('user_id', allUserIds)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .order('total_points', { ascending: false })
          .limit(10);

        if (friendsRankData) {
          // Fetch profiles for friends
          const { data: friendProfiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', friendsRankData.map(r => r.user_id));

          const enrichedFriendsRank = friendsRankData.map((rank, index) => {
            const profile = friendProfiles?.find(p => p.id === rank.user_id);
            return {
              ...rank,
              ranking: index + 1,
              username: profile?.username || 'usuario',
              full_name: profile?.full_name || 'Usuario',
              avatar_url: profile?.avatar_url
            };
          });
          setFriendsRankings(enrichedFriendsRank);
          
          // Calculate user's rank among friends
          const userRankIndex = enrichedFriendsRank.findIndex(r => r.user_id === user.id);
          setFriendsRank(userRankIndex >= 0 ? userRankIndex + 1 : friendships.length + 1);
        }
      }

      // Get general rankings (top 10)
      const { data: generalRankData } = await supabase
        .from('monthly_rankings')
        .select(`
          user_id,
          total_points,
          challenges_completed
        `)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .order('total_points', { ascending: false })
        .limit(10);

      if (generalRankData) {
        // Fetch profiles for general rankings
        const { data: generalProfiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', generalRankData.map(r => r.user_id));

        const enrichedGeneralRank = generalRankData.map((rank, index) => {
          const profile = generalProfiles?.find(p => p.id === rank.user_id);
          return {
            ...rank,
            ranking: index + 1,
            username: profile?.username || 'usuario',
            full_name: profile?.full_name || 'Usuario',
            avatar_url: profile?.avatar_url
          };
        });
        setGeneralRankings(enrichedGeneralRank);
      }

      // Calculate day streak based on consecutive completed daily challenges
      const { data: challengeHistory } = await supabase
        .from('user_daily_challenges')
        .select('challenge_date, completed')
        .eq('user_id', user.id)
        .order('challenge_date', { ascending: false })
        .limit(30);

      if (challengeHistory && challengeHistory.length > 0) {
        let streak = 0;
        const today = new Date();
        
        // Contar días consecutivos desde hoy hacia atrás
        for (let i = 0; i < challengeHistory.length; i++) {
          const challengeDate = new Date(challengeHistory[i].challenge_date);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          // Verificar si es el día esperado y si está completado
          if (
            challengeDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0] &&
            challengeHistory[i].completed
          ) {
            streak++;
          } else {
            break; // Romper la racha
          }
        }
        
        setDayStreak(streak);
      }
    };

    fetchData();
  }, [periodFilter]);

  return (
    <div className="page-standard min-h-screen pb-24 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5f0ee]/80 to-transparent backdrop-blur-sm">
        <div className="page-container py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Estadísticas
              </h1>
              <p className="text-xs text-gray-600">
                Tu progreso y rankings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-2 space-y-4">
        {/* Period Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5">
          <h2 className="text-[8px] font-semibold text-gray-900 mb-1 px-0.5">Período</h2>
          <Tabs value={periodFilter} onValueChange={setPeriodFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-6">
              <TabsTrigger value="1m" className="text-[8px] px-2">1M</TabsTrigger>
              <TabsTrigger value="3m" className="text-[8px] px-2">3M</TabsTrigger>
              <TabsTrigger value="6m" className="text-[8px] px-2">6M</TabsTrigger>
              <TabsTrigger value="1y" className="text-[8px] px-2">1A</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Overview - Compacto */}
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-gray-100 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[9px] text-gray-600">Puntos XP</span>
              </div>
              <p className="text-base font-bold text-gray-900">{userPoints}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy className="h-3 w-3 text-blue-600" />
                <span className="text-[9px] text-gray-600">Retos</span>
              </div>
              <p className="text-base font-bold text-gray-900">{totalChallenges}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="h-3 w-3 text-green-600" />
                <span className="text-[9px] text-gray-600">Racha</span>
              </div>
              <p className="text-base font-bold text-gray-900">{dayStreak}</p>
              <p className="text-[8px] text-gray-500">días seguidos</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="h-3 w-3 text-purple-600" />
                <span className="text-[9px] text-gray-600">Ranking</span>
              </div>
              <p className="text-base font-bold text-gray-900">#{friendsRank}</p>
              <p className="text-[8px] text-gray-500">entre amigos</p>
            </div>
          </div>
        </div>

        {/* Friends Ranking */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Ranking entre Amigos
            </h2>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              Este mes
            </Badge>
          </div>
          
          <p className="text-xs text-gray-600 mb-4">
            Compara tu progreso con tus amigos este mes
          </p>

          {friendsRankings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Aún no hay ranking de amigos
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Agrega amigos para competir
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friendsRankings.map((ranking) => {
                const isCurrentUser = ranking.user_id === user?.id;
                const icon = ranking.ranking === 1 ? '🥇' :
                            ranking.ranking === 2 ? '🥈' :
                            ranking.ranking === 3 ? '🥉' : '';
                
                return (
                  <div 
                    key={ranking.user_id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">
                        {icon || `#${ranking.ranking}`}
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${isCurrentUser ? 'text-primary' : 'text-gray-900'}`}>
                          {isCurrentUser ? 'Tú' : ranking.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ranking.challenges_completed} retos completados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {ranking.total_points}
                      </p>
                      <p className="text-xs text-gray-500">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* General Ranking */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Medal className="h-5 w-5 text-blue-600" />
              Ranking General
            </h2>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              Top 10
            </Badge>
          </div>
          
          <p className="text-xs text-gray-600 mb-4">
            Los mejores usuarios de Moni AI este mes
          </p>

          {generalRankings.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Aún no hay ranking general
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {generalRankings.map((ranking) => {
                const isCurrentUser = ranking.user_id === user?.id;
                const icon = ranking.ranking === 1 ? '🥇' :
                            ranking.ranking === 2 ? '🥈' :
                            ranking.ranking === 3 ? '🥉' : '';
                
                return (
                  <div 
                    key={ranking.user_id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-2 border-blue-500/20' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">
                        {icon || `#${ranking.ranking}`}
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                          {isCurrentUser ? 'Tú' : ranking.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ranking.challenges_completed} retos completados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {ranking.total_points}
                      </p>
                      <p className="text-xs text-gray-500">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* XP Evolution Chart */}
        {xpHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolución de XP
              </h2>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                Últimos {periodFilter === "1m" ? "1 mes" : periodFilter === "3m" ? "3 meses" : periodFilter === "6m" ? "6 meses" : "12 meses"}
              </Badge>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={xpHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Total acumulado de puntos XP por mes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialStats;
