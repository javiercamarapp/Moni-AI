import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Users, Zap, Calendar, Award, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Filter, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [previousRank, setPreviousRank] = useState<number>(0);
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string>("3m");
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [previousXp, setPreviousXp] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [comparisonMonth, setComparisonMonth] = useState<string>("");
  const [comparisonYear, setComparisonYear] = useState<string>("");
  const [competitionGroups, setCompetitionGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);
  const [challengeCategories, setChallengeCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      // Fetch challenge categories
      const { data: categories } = await supabase
        .from('daily_challenges')
        .select('category')
        .not('category', 'is', null);
      
      if (categories) {
        const uniqueCategories = [...new Set(categories.map(c => c.category))].filter(cat => cat && cat.trim() !== '');
        setChallengeCategories(uniqueCategories);
      }

      // Fetch competition groups
      const { data: groups } = await supabase
        .from('competition_groups')
        .select(`
          *,
          competition_group_members(count)
        `);
      
      if (groups) {
        setCompetitionGroups(groups);
      }

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

      if (xpHistoryData && xpHistoryData.length > 0) {
        // Take last N months
        const sortedData = [...xpHistoryData].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
        
        const filteredHistory = sortedData.slice(-monthsToFetch).map(record => ({
          label: `${record.month}/${record.year}`,
          xp: record.total_points,
          retos: record.challenges_completed
        }));
        
        setXpHistory(filteredHistory);
        
        // Calculate XP change
        if (filteredHistory.length >= 2) {
          const lastXp = filteredHistory[filteredHistory.length - 1].xp;
          const prevXp = filteredHistory[filteredHistory.length - 2].xp;
          setPreviousXp(prevXp);
        }
      }

      // Get user's points for current month (or selected comparison month)
      const targetMonth = comparisonMonth ? parseInt(comparisonMonth) : currentMonth;
      const targetYear = comparisonYear ? parseInt(comparisonYear) : currentYear;

      const { data: userRanking } = await supabase
        .from('monthly_rankings')
        .select('total_points, challenges_completed')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .maybeSingle();

      if (userRanking) {
        setUserPoints(userRanking.total_points);
        setTotalChallenges(userRanking.challenges_completed);
      }

      // Determine user IDs based on selected group
      let allUserIds: string[] = [];
      
      if (selectedGroup === "all") {
        // Get friendships
        const { data: friendships } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (friendships) {
          const friendIds = friendships.map(f => f.friend_id);
          allUserIds = [...friendIds, user.id];
        }
      } else {
        // Get members from selected competition group
        const { data: groupMembers } = await supabase
          .from('competition_group_members')
          .select('user_id')
          .eq('group_id', selectedGroup);

        if (groupMembers) {
          allUserIds = groupMembers.map(m => m.user_id);
        }
      }

      if (allUserIds.length > 0) {

        // Get rankings for selected users and month
        let rankingsQuery = supabase
          .from('monthly_rankings')
          .select('user_id, total_points, challenges_completed')
          .in('user_id', allUserIds)
          .eq('month', targetMonth)
          .eq('year', targetYear)
          .order('total_points', { ascending: false })
          .limit(10);

        const { data: friendsRankData } = await rankingsQuery;

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
          
          // Calculate user's rank
          const userRankIndex = enrichedFriendsRank.findIndex(r => r.user_id === user.id);
          const newRank = userRankIndex >= 0 ? userRankIndex + 1 : allUserIds.length + 1;
          
          // Check for rank change notification
          if (previousRank > 0 && newRank !== previousRank) {
            if (newRank < previousRank) {
              toast.success(`¡Subiste al puesto #${newRank} en el ranking de amigos! 🎉`);
            } else {
              toast.info(`Bajaste al puesto #${newRank} en el ranking de amigos`);
            }
          }
          
          setPreviousRank(newRank);
          setFriendsRank(newRank);
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
  }, [periodFilter, categoryFilter, comparisonMonth, comparisonYear, selectedGroup]);

  const createCompetitionGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("El nombre del grupo es requerido");
      return;
    }

    const { data, error } = await supabase
      .from('competition_groups')
      .insert({
        name: newGroupName,
        description: newGroupDescription,
        created_by: user?.id,
        is_private: newGroupPrivate
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear el grupo");
      return;
    }

    // Add creator as member
    await supabase
      .from('competition_group_members')
      .insert({
        group_id: data.id,
        user_id: user?.id
      });

    toast.success("Grupo creado exitosamente");
    setShowCreateGroupModal(false);
    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupPrivate(false);
    
    // Refresh groups
    const { data: groups } = await supabase
      .from('competition_groups')
      .select(`
        *,
        competition_group_members(count)
      `);
    
    if (groups) {
      setCompetitionGroups(groups);
    }
  };

  // Calculate XP percentage change
  const xpChange = useMemo(() => {
    if (previousXp === 0 || userPoints === 0) return 0;
    return ((userPoints - previousXp) / previousXp) * 100;
  }, [userPoints, previousXp]);

  // Calculate days to reach next rank
  const daysToNextRank = useMemo(() => {
    if (friendsRankings.length === 0 || friendsRank === 1) return null;
    
    const currentUser = friendsRankings.find(r => r.user_id === user?.id);
    const nextUser = friendsRankings[friendsRank - 2]; // Previous position
    
    if (!currentUser || !nextUser) return null;
    
    const xpDifference = nextUser.total_points - currentUser.total_points;
    
    // Calculate average daily XP from history
    if (xpHistory.length < 2) return null;
    
    const recentXp = xpHistory.slice(-2);
    const dailyAverage = (recentXp[1].xp - recentXp[0].xp) / 30; // Assuming 30 days per month
    
    if (dailyAverage <= 0) return null;
    
    return Math.ceil(xpDifference / dailyAverage);
  }, [friendsRankings, friendsRank, user, xpHistory]);

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
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
        {/* Advanced Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Filtros Avanzados</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Category Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1">Categoría de Reto</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {challengeCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competition Group Filter */}
            <div>
              <Label className="text-xs text-gray-600 mb-1">Grupo de Competencia</Label>
              <div className="flex gap-2">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue placeholder="Todos los amigos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los amigos</SelectItem>
                    {competitionGroups.filter(group => group.id).map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-9 px-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Grupo de Competencia</DialogTitle>
                      <DialogDescription>
                        Crea un grupo personalizado para competir con amigos específicos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="groupName">Nombre del Grupo</Label>
                        <Input
                          id="groupName"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Ej: Mis mejores amigos"
                        />
                      </div>
                      <div>
                        <Label htmlFor="groupDesc">Descripción</Label>
                        <Input
                          id="groupDesc"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="private"
                          checked={newGroupPrivate}
                          onChange={(e) => setNewGroupPrivate(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="private" className="text-sm">Grupo privado</Label>
                      </div>
                      <Button onClick={createCompetitionGroup} className="w-full">
                        Crear Grupo
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Month Comparison */}
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-1">Comparar Período Específico</Label>
              <div className="flex gap-2">
                <Select value={comparisonMonth} onValueChange={setComparisonMonth}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue placeholder="Mes actual" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1).toLocaleString('es', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={comparisonYear} onValueChange={setComparisonYear}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue placeholder="Año actual" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(comparisonMonth || comparisonYear) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setComparisonMonth("");
                      setComparisonYear("");
                    }}
                    className="h-9 px-3 text-xs"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5 transition-all duration-300">
          <h2 className="text-[8px] font-semibold text-gray-900 mb-1 px-0.5">Período</h2>
          <Tabs value={periodFilter} onValueChange={setPeriodFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-6">
              <TabsTrigger value="1m" className="text-[8px] px-2 transition-all duration-200">1M</TabsTrigger>
              <TabsTrigger value="3m" className="text-[8px] px-2 transition-all duration-200">3M</TabsTrigger>
              <TabsTrigger value="6m" className="text-[8px] px-2 transition-all duration-200">6M</TabsTrigger>
              <TabsTrigger value="1y" className="text-[8px] px-2 transition-all duration-200">1A</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Overview - Compacto */}
        <div className="bg-white rounded-2xl shadow-sm p-3 transition-all duration-300">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-gray-100 rounded-lg p-2 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[9px] text-gray-600">Puntos XP</span>
                {xpChange !== 0 && (
                  xpChange > 0 ? (
                    <ChevronUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-red-600" />
                  )
                )}
              </div>
              <p className="text-base font-bold text-gray-900">{userPoints}</p>
              {xpChange !== 0 && (
                <p className={`text-[8px] ${xpChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {xpChange > 0 ? '+' : ''}{xpChange.toFixed(1)}%
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-2 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy className="h-3 w-3 text-blue-600" />
                <span className="text-[9px] text-gray-600">Retos</span>
              </div>
              <p className="text-base font-bold text-gray-900">{totalChallenges}</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-2 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="h-3 w-3 text-green-600" />
                <span className="text-[9px] text-gray-600">Racha</span>
              </div>
              <p className="text-base font-bold text-gray-900">{dayStreak}</p>
              <p className="text-[8px] text-gray-500">días seguidos</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg p-2 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="h-3 w-3 text-purple-600" />
                <span className="text-[9px] text-gray-600">Ranking</span>
              </div>
              <p className="text-base font-bold text-gray-900">#{friendsRank}</p>
              <p className="text-[8px] text-gray-500">entre amigos</p>
              {daysToNextRank && friendsRank > 1 && (
                <p className="text-[7px] text-purple-600 mt-1">
                  ~{daysToNextRank} días para #{friendsRank - 1}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Friends Ranking */}
        <div className="bg-white rounded-3xl shadow-sm p-6 transition-all duration-300">
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
                
                const maxPoints = Math.max(...friendsRankings.map(r => r.total_points));
                const barWidth = (ranking.total_points / maxPoints) * 100;
                
                return (
                  <div 
                    key={ranking.user_id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl w-8 text-center">
                        {icon || `#${ranking.ranking}`}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isCurrentUser ? 'text-primary' : 'text-gray-900'}`}>
                          {isCurrentUser ? 'Tú' : ranking.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ranking.challenges_completed} retos completados
                        </p>
                        {/* Visual comparison bar */}
                        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isCurrentUser ? 'bg-primary' : 'bg-gray-400'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-3">
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
          <div className="bg-white rounded-2xl shadow-sm p-4 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {xpChange > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : xpChange < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-primary" />
                )}
                Evolución de XP
                {xpChange !== 0 && (
                  <span className={`text-xs ${xpChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({xpChange > 0 ? '+' : ''}{xpChange.toFixed(1)}%)
                  </span>
                )}
              </h2>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                Últimos {periodFilter === "1m" ? "1 mes" : periodFilter === "3m" ? "3 meses" : periodFilter === "6m" ? "6 meses" : "12 meses"}
              </Badge>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={xpHistory}
                  onClick={(e) => {
                    if (e && e.activePayload) {
                      setSelectedDataPoint(e.activePayload[0].payload);
                    }
                  }}
                >
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
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="text-xs font-semibold text-gray-900 mb-1">
                              {payload[0].payload.label}
                            </p>
                            <p className="text-xs text-primary font-bold">
                              {payload[0].payload.xp} XP
                            </p>
                            <p className="text-xs text-gray-600">
                              {payload[0].payload.retos} retos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', r: 4, cursor: 'pointer' }}
                    activeDot={{ r: 6, cursor: 'pointer' }}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {selectedDataPoint && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20 transition-all duration-300">
                <p className="text-xs font-semibold text-gray-900 mb-1">
                  Detalles de {selectedDataPoint.label}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-primary">{selectedDataPoint.xp} XP</p>
                    <p className="text-xs text-gray-600">{selectedDataPoint.retos} retos completados</p>
                  </div>
                  <button
                    onClick={() => setSelectedDataPoint(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Total acumulado de puntos XP por mes · Haz clic en un punto para ver detalles
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialStats;
