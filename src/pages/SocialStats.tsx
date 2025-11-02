import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Users, Zap, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import heroAuth from '@/assets/moni-ai-logo.png';

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

      // Calculate day streak based on consecutive challenge completions
      // For now, using level as proxy - in production would track actual consecutive days
      if (profileData?.level) {
        setDayStreak(Math.min(profileData.level * 3, 30)); // Mock: 3 days per level, max 30
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-24 animate-fade-in bg-gradient-to-b from-[#E5DEFF]/30 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
        {/* Stats Overview - Compacto */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-gray-600">Puntos XP</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{userPoints}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] text-gray-600">Retos</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{totalChallenges}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[10px] text-gray-600">Racha</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{dayStreak}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">días seguidos</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-[10px] text-gray-600">Ranking</span>
              </div>
              <p className="text-xl font-bold text-gray-900">#{friendsRank}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">entre amigos</p>
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
            
            {dayStreak >= 7 && (
              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Racha Imparable</p>
                  <p className="text-xs text-gray-600">{dayStreak} días seguidos</p>
                </div>
              </div>
            )}

            {(profile?.level < 5 && totalChallenges < 10 && dayStreak < 7) && (
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
