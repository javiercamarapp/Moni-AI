import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Trophy, Medal, Users, Target, Zap, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";

const SocialStats = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [friendsRankings, setFriendsRankings] = useState<any[]>([]);
  const [generalRankings, setGeneralRankings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [totalChallenges, setTotalChallenges] = useState<number>(0);
  const [monthStreak, setMonthStreak] = useState<number>(0);
  const [totalFriends, setTotalFriends] = useState<number>(0);

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
        setTotalFriends(friendships.length);

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

      // Calculate streak (simplified - just using level as mock data)
      if (profileData?.level) {
        setMonthStreak(Math.floor(profileData.level / 2));
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-24 animate-fade-in bg-gradient-to-b from-[#E5DEFF]/30 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Estadísticas
              </h1>
              <p className="text-xs text-gray-500">
                Tu progreso y rankings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Stats Overview */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tu resumen este mes
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs text-gray-600">Puntos XP</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{userPoints}</p>
              <p className="text-xs text-gray-500 mt-1">Acumulados</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600">Retos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalChallenges}</p>
              <p className="text-xs text-gray-500 mt-1">Completados</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600">Racha</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{monthStreak}</p>
              <p className="text-xs text-gray-500 mt-1">Meses activo</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-gray-600">Amigos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalFriends}</p>
              <p className="text-xs text-gray-500 mt-1">Conectados</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 font-medium">Progreso mensual</span>
              <span className="text-primary font-semibold">{userPoints} / 1,000 XP</span>
            </div>
            <Progress 
              value={Math.min((userPoints / 1000) * 100, 100)} 
              className="h-2"
              indicatorClassName="bg-gradient-to-r from-primary to-primary/80"
            />
            <p className="text-[10px] text-gray-500">
              {userPoints >= 1000 
                ? '¡Meta mensual alcanzada! 🎉' 
                : `Faltan ${1000 - userPoints} XP para tu meta mensual`
              }
            </p>
          </div>
        </div>

        {/* Friends Ranking */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Ranking entre Amigos
            </h2>
            <Badge variant="secondary" className="text-xs">
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
            <Badge variant="secondary" className="text-xs">
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

        {/* Achievement Highlights */}
        <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-purple-600" />
            Logros destacados
          </h2>
          
          <div className="space-y-3">
            {profile?.level && profile.level >= 5 && (
              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Nivel Avanzado</p>
                  <p className="text-xs text-gray-600">Has alcanzado el nivel {profile.level}</p>
                </div>
              </div>
            )}
            
            {totalChallenges >= 10 && (
              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Retador Incansable</p>
                  <p className="text-xs text-gray-600">{totalChallenges} retos completados</p>
                </div>
              </div>
            )}
            
            {totalFriends >= 5 && (
              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                <span className="text-2xl">🤝</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Comunidad Activa</p>
                  <p className="text-xs text-gray-600">{totalFriends} amigos conectados</p>
                </div>
              </div>
            )}

            {(profile?.level < 5 && totalChallenges < 10 && totalFriends < 5) && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  Completa más retos para desbloquear logros
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialStats;
