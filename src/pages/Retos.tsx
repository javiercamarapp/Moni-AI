import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Camera, Users, TrendingUp, Zap, Calendar, Trophy, Target, ChevronRight, Medal, Sparkles, MessageCircle, Plus, Share2, Gift } from "lucide-react";
import { toast } from "sonner";
import MoniLevelUp from "@/components/social/MoniLevelUp";
import UserBadges from "@/components/social/UserBadges";
import XPProgressCard from "@/components/social/XPProgressCard";
import { LevelProgressCard } from "@/components/gamification/LevelProgressCard";
import { BadgesGallery } from "@/components/gamification/BadgesGallery";
import { MonthlyRanking } from "@/components/gamification/MonthlyRanking";
import { PersonalizedChallenges } from "@/components/gamification/PersonalizedChallenges";
import { FriendCelebrations } from "@/components/social/FriendCelebrations";
import { useScoreMoni } from "@/hooks/useFinancialData";
import { SocialProfileCard } from "@/components/social/SocialProfileCard";
import { SocialActions } from "@/components/social/SocialActions";
import { ChallengesCarousel } from "@/components/social/ChallengesCarousel";
import { BadgesSection } from "@/components/social/BadgesSection";
import { ChallengeDetailsModal } from "@/components/social/ChallengeDetailsModal";

interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  target: number;
  unit: string;
  currentProgress?: number;
  isActive: boolean;
  period: 'weekly' | 'monthly';
  theme?: 'espresso' | 'latte' | 'sand' | 'clay' | 'sage';
  type?: 'budget' | 'saving' | 'ratio' | 'streak' | 'debt' | 'investment';
  aiReason?: string;
  tips?: string[];
}

const DEMO_WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: '1',
    type: 'budget' as const,
    title: 'Café en Casa',
    description: 'Prepara tu café en casa 3 veces esta semana.',
    xpReward: 850,
    icon: 'Wallet',
    target: 500,
    unit: 'MXN',
    currentProgress: 320,
    isActive: false,
    period: 'weekly' as const,
    theme: 'latte' as const,
    aiReason: 'Tus gastos en cafeterías suman $1,200/mes. Reducirlo tendrá gran impacto.',
    tips: ['Compra café de grano de buena calidad.', 'Invierte en un termo bonito.']
  },
  {
    id: 'saving',
    type: 'saving' as const,
    title: 'Stash Express',
    description: 'Guarda $1,000 extra en tu fondo de emergencia.',
    xpReward: 1200,
    icon: 'PiggyBank',
    target: 1000,
    unit: 'MXN',
    currentProgress: 0,
    isActive: false,
    period: 'weekly' as const,
    theme: 'sage' as const,
    aiReason: 'Tu fondo de emergencia está un poco bajo este mes.',
    tips: ['Transfiere lo que te sobre del finde.', 'Vende algo que no uses.']
  },
  {
    id: '3',
    type: 'ratio' as const,
    title: 'Ahorro Turbo',
    description: 'Ahorra el 20% de todo ingreso extra hoy.',
    xpReward: 1000,
    icon: 'TrendingUp',
    target: 20,
    unit: '%',
    currentProgress: 15,
    isActive: false,
    period: 'weekly' as const,
    theme: 'clay' as const,
    aiReason: 'Tu tasa de ahorro está al 18%. Llega al 20% para subir de nivel.',
    tips: ['Transfiere el monto apenas lo recibas.', 'Usa apartados automáticos.']
  },
  {
    id: '4',
    type: 'streak' as const,
    title: 'Sin Uber Eats',
    description: 'Cocina en casa. Cero delivery por 5 días.',
    xpReward: 600,
    icon: 'Utensils',
    target: 5,
    unit: 'días',
    currentProgress: 4,
    isActive: false,
    period: 'weekly' as const,
    theme: 'sand' as const,
    aiReason: 'Gastaste $3,200 en delivery el mes pasado.',
    tips: ['Haz Meal Prep el domingo.', 'Borra la app temporalmente.']
  },
  {
    id: '5',
    type: 'budget' as const,
    title: 'Fin de Semana',
    description: 'Presupuesto estricto de ocio para el finde.',
    xpReward: 1200,
    icon: 'ShoppingBag',
    target: 2000,
    unit: 'MXN',
    currentProgress: 0,
    isActive: false,
    period: 'weekly' as const,
    theme: 'espresso' as const,
    aiReason: 'El ocio representa el 40% de tus gastos variables.',
    tips: ['Busca actividades gratuitas.', 'Lleva efectivo, deja la tarjeta.']
  }
];

const DEMO_MONTHLY_CHALLENGES: Challenge[] = [
  {
    id: 'invest1',
    type: 'investment' as const,
    title: 'Inversor Novato',
    description: 'Realiza tu primera aportación a un ETF o Fondo.',
    xpReward: 3000,
    icon: 'Landmark',
    target: 1,
    unit: 'acción',
    currentProgress: 0,
    isActive: false,
    period: 'monthly' as const,
    theme: 'espresso' as const,
    aiReason: 'Tienes exceso de liquidez perdiendo valor por inflación.',
    tips: ['Busca ETFs de bajo costo como VOO o IVVPESO.', 'Empieza con poco.']
  },
  {
    id: 'debt1',
    type: 'debt' as const,
    title: 'Bola de Nieve',
    description: 'Paga $2,000 extra a tu deuda más pequeña.',
    xpReward: 2500,
    icon: 'CreditCard',
    target: 2000,
    unit: 'MXN',
    currentProgress: 500,
    isActive: false,
    period: 'monthly' as const,
    theme: 'latte' as const,
    aiReason: 'Eliminar esa tarjeta pequeña liberará $1,500 de flujo mensual.',
    tips: ['Usa el método bola de nieve.', 'Aplica pagos directo a capital.']
  },
  {
    id: 'm1',
    type: 'ratio' as const,
    title: 'Ahorro Agresivo',
    description: 'Ahorra el 30% de tus ingresos este mes.',
    xpReward: 2500,
    icon: 'TrendingUp',
    target: 30,
    unit: '%',
    currentProgress: 12,
    isActive: false,
    period: 'monthly' as const,
    theme: 'sage' as const,
    aiReason: 'Tus ingresos fueron altos este mes, aprovecha.',
    tips: ['Revisa tus gastos fijos.', 'Cancela suscripciones no usadas.']
  }
];

const Social = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [monthlyRanking, setMonthlyRanking] = useState<number>(0);
  const [friendsRankings, setFriendsRankings] = useState<any[]>([]);
  const [generalRankings, setGeneralRankings] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [friendActivity, setFriendActivity] = useState<any[]>([]);

  // New state for selected challenge
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  // Usar el mismo hook que el Dashboard para obtener el Score Moni
  const { data: scoreMoni = 40 } = useScoreMoni();
  const [socialToast, setSocialToast] = useState<{ show: boolean; userName: string; type: string; xp: number; challenge?: string }>({ show: false, userName: '', type: '', xp: 0 });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socialToastSoundRef = useRef<HTMLAudioElement>(null);

  // Nuevos estados para gamificación
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [personalizedChallenges, setPersonalizedChallenges] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Fetch profile data including username and avatar
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
          // Set initial XP from profile
          setTotalXP(profileData.total_xp || 0);
          // Show username dialog if user doesn't have a username
          if (!profileData.username) {
            setShowUsernameDialog(true);
          }
        } else {
          // Create profile if it doesn't exist
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({ id: user.id, level: 1, xp: 0 })
            .select()
            .single();
          if (newProfile) setProfile(newProfile);
        }

        // Fetch initial data
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Check if we have active friendships
        const { data: friendships } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        // Parallel data fetching
        fetchRankingsData(user.id, currentMonth, currentYear, friendships);
        fetchChallengesData(user.id);
        fetchFriendActivity(user.id, friendships);

        // Setup realtime subscription for rankings
        const rankingsChannel = supabase
          .channel('realtime-rankings')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'monthly_rankings'
            },
            () => {
              fetchRankingsData(user.id, currentMonth, currentYear, friendships);
            }
          )
          .subscribe();

        // Setup realtime subscription for friend activity
        const activityChannel = supabase
          .channel('realtime-activity')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'user_activities'
            },
            (payload: any) => {
              // If activity is from a friend, show toast and update list
              const isFriend = friendships?.some((f: any) => f.friend_id === payload.new.user_id);
              if (isFriend) {
                // Fetch user name
                fetchFriendName(payload.new.user_id).then(name => {
                  setSocialToast({
                    show: true,
                    userName: name,
                    type: payload.new.activity_type,
                    xp: payload.new.xp_earned || 0
                  });
                  if (socialToastSoundRef.current) {
                    socialToastSoundRef.current.play().catch(e => console.log('Audio play failed', e));
                  }
                  // Refresh activity list
                  fetchFriendActivity(user.id, friendships);
                });
              }
            }
          )
          .subscribe();

        // Subscribe to reactions table 
        const reactionsChannel = supabase
          .channel('realtime-reactions')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'activity_reactions',
              filter: `friend_id=eq.${user.id}`
            },
            async (payload: any) => {
              // Someone reacted to my activity
              if (payload.new) {
                const { data: fromUser } = await supabase
                  .from('profiles')
                  .select('username, full_name')
                  .eq('id', payload.new.user_id)
                  .single();

                if (fromUser) {
                  showNotification(
                    fromUser.username || fromUser.full_name || 'Un amigo',
                    'reaction',
                    1
                  );
                }
              }
            }
          )
          .subscribe();

        // Setup realtime subscription for profile updates (XP and Score Moni)
        const profileChannel = supabase
          .channel('realtime-profile-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
            },
            (payload: any) => {
              if (payload.new) {
                const newXP = payload.new.total_xp || 0;
                const newLevel = Math.floor(newXP / 100) + 1;

                // Detectar subida de nivel
                if (newLevel > previousLevel) {
                  setShowLevelUp(true);
                  setPreviousLevel(newLevel);
                }

                setTotalXP(newXP);
                // El Score Moni se actualiza automáticamente vía hook useScoreMoni()
                setProfile(payload.new);
              }
            }
          )
          .subscribe();

        // Return cleanup function
        return () => {
          supabase.removeChannel(rankingsChannel);
          supabase.removeChannel(activityChannel);
          supabase.removeChannel(reactionsChannel);
          supabase.removeChannel(profileChannel);
        };
      }
    };

    let cleanup: (() => void) | undefined;

    fetchUserData().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const fetchRankingsData = async (userId: string, month: number, year: number, friendships: any) => {
    // Get user's points for current month
    const { data: userRanking } = await supabase
      .from('monthly_rankings')
      .select('total_points, challenges_completed')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (userRanking) {
      setUserPoints(userRanking.total_points);
    }

    // Get friend IDs for friends ranking
    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map((f: any) => f.friend_id);
      const allUserIds = [...friendIds, userId];

      // Get rankings for friends
      const { data: friendsRankData } = await supabase
        .from('monthly_rankings')
        .select(`
          user_id,
          total_points,
          challenges_completed
        `)
        .in('user_id', allUserIds)
        .eq('month', month)
        .eq('year', year)
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
      .eq('month', month)
      .eq('year', year)
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
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Foto de perfil actualizada');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchFriendName = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', userId)
      .single();
    return data?.username || data?.full_name || 'Un amigo';
  };

  const fetchFriendActivity = async (userId: string, friendships: any) => {
    if (!friendships || friendships.length === 0) return;

    const friendIds = friendships.map((f: any) => f.friend_id);

    // Get last 20 activities from friends using friend_activity table
    const { data: activities } = await supabase
      .from('friend_activity')
      .select(`
        id,
        user_id,
        activity_type,
        xp_earned,
        created_at,
        description
      `)
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (activities) {
      // Fetch profiles for the activities
      const userIds = [...new Set(activities.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      // Fetch reactions for these activities
      const activityIds = activities.map(a => a.id);
      const { data: reactions } = await supabase
        .from('friend_activity_reactions')
        .select('*')
        .in('activity_id', activityIds);

      const enrichedActivities = activities.map(activity => {
        const profile = profiles?.find(p => p.id === activity.user_id);
        const activityReactions = reactions?.filter(r => r.activity_id === activity.id) || [];
        const userReacted = activityReactions.some(r => r.from_user_id === userId);

        return {
          ...activity,
          details: activity.description,
          profiles: profile,
          reactions_count: activityReactions.length,
          user_reacted: userReacted
        };
      });

      setFriendActivity(enrichedActivities);
    }
  };

  const fetchChallengesData = async (userId: string) => {
    // 1. Fetch user's badges
    const { data: userBadgesData } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges:badge_id (*)
      `)
      .eq('user_id', userId);

    if (userBadgesData) {
      const formattedBadges = userBadgesData.map((ub: any) => ({
        id: ub.badge_id,
        name: ub.badges?.name || 'Insignia',
        description: ub.badges?.description || '',
        icon: ub.badges?.icon || '🏆',
        unlocked: true,
        date_earned: ub.earned_at
      }));
      setUserBadges(formattedBadges);
    }

    // 2. Fetch active challenges
    const { data: activeChallenges } = await supabase
      .from('user_challenge_progress')
      .select(`
        *,
        daily_challenges (*)
      `)
      .eq('user_id', userId)
      .eq('completed', false);

    if (activeChallenges) {
      const formattedChallenges = activeChallenges.map((c: any) => ({
        ...c.daily_challenges,
        progress_id: c.id,
        status: 'active',
        completed: c.completed
      }));
      setPersonalizedChallenges(formattedChallenges);
    }
  };

  const handleUpdateUsername = async () => {
    if (!user || !username.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, username: username.trim() });
      setShowUsernameDialog(false);
      toast.success("Nombre de usuario actualizado");
    } catch (error: any) {
      toast.error("Error al actualizar usuario");
    }
  };

  const showNotification = (userName: string, type: string, xp: number) => {
    setSocialToast({ show: true, userName, type, xp });
    if (socialToastSoundRef.current) {
      socialToastSoundRef.current.play().catch(e => console.log('Audio play failed', e));
    }

    setTimeout(() => {
      setSocialToast({ show: false, userName: '', type: '', xp: 0 });
    }, 3000);
  };

  const handleAcceptChallenge = (id: string) => {
    console.log('Accept challenge:', id);
    toast.success('¡Reto aceptado!');
    // Ideally update backend here
  };

  // Helper to get challenges for carousel
  const getWeeklyChallenges = () => {
    const active = personalizedChallenges
      .filter(c => c.period === 'weekly')
      .slice(0, 6)
      .map(c => ({
        id: c.id,
        title: c.titulo || 'Reto',
        description: c.descripcion || '',
        xpReward: c.xp_reward || 0,
        icon: 'Target',
        target: 100,
        unit: 'puntos',
        currentProgress: c.completed ? 100 : 0,
        isActive: c.status === 'active',
        period: 'weekly' as const,
        theme: 'sand' as const
      }));

    if (active.length > 0) return active;

    // If no active challenges, show demo ones
    return DEMO_WEEKLY_CHALLENGES;
  };

  const getMonthlyChallenges = () => {
    const active = personalizedChallenges
      .filter(c => c.period === 'monthly')
      .slice(0, 4)
      .map(c => ({
        id: c.id,
        title: c.titulo || 'Reto',
        description: c.descripcion || '',
        xpReward: c.xp_reward || 0,
        icon: 'Target',
        target: 100,
        unit: 'puntos',
        currentProgress: c.completed ? 100 : 0,
        isActive: c.status === 'active',
        period: 'monthly' as const,
        theme: 'sand' as const
      }));

    if (active.length > 0) return active;

    // If no active challenges, show demo ones
    return DEMO_MONTHLY_CHALLENGES;
  };

  return (
    <>
      <div className="page-standard min-h-screen pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5f0ee]/80 to-transparent backdrop-blur-sm">
          <div className="page-container py-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#292524] tracking-tight">
                Retos financieros
              </h1>
              <p className="text-xs font-bold uppercase tracking-wide text-[#78716C]">
                Encuentra tus amigos y disfruta de tus finanzas
              </p>
            </div>
          </div>
        </div>

        <div className="page-container py-2 space-y-4">
          {/* New Social Profile Card */}
          <SocialProfileCard
            user={{
              name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario",
              username: profile?.username,
              avatarUrl: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
              level: Math.floor(totalXP / 100) + 1,
              currentXP: totalXP % 100,
              xpForNextLevel: 100,
              rank: monthlyRanking
            }}
            badges={userBadges.map(badge => ({
              id: badge.id,
              name: badge.name,
              icon: badge.icon || '🏆',
              unlocked: badge.unlocked
            }))}
            onAvatarUpdate={() => {
              // Refresh profile data after avatar update
              const fetchProfile = async () => {
                if (user) {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();
                  if (profileData) setProfile(profileData);
                }
              };
              fetchProfile();
            }}
          />

          {/* Social Actions */}
          <SocialActions
            onNavigate={(id) => {
              // Keep navigation simple - no external routes for now
              console.log('Navigate to:', id);
            }}
            activeChallengesCount={personalizedChallenges.filter(c => c.status === 'active').length}
            friendsCount={0}
          />

          {/* Weekly Challenges Carousel */}
          <ChallengesCarousel
            period="weekly"
            challenges={getWeeklyChallenges()}
            onAcceptChallenge={handleAcceptChallenge}
            onViewDetails={(challenge) => setSelectedChallenge(challenge)}
          />

          {/* Monthly Challenges Carousel */}
          <ChallengesCarousel
            period="monthly"
            challenges={getMonthlyChallenges()}
            onAcceptChallenge={handleAcceptChallenge}
            onViewDetails={(challenge) => setSelectedChallenge(challenge)}
          />

          {/* New Badges Section */}
          <BadgesSection
            badges={userBadges.map(b => ({
              ...b,
              requiredXP: b.requiredXP || 100,
              theme: b.theme || 'bronze' as const
            }))}
            userTotalXP={totalXP}
          />

          {/* Friend Activity Feed */}
          <div className="mb-24">
            <h3 className="text-[#A1887F] font-bold text-[10px] uppercase tracking-wider mb-4 px-1">
              Actividad Reciente
            </h3>
            {friendActivity.length > 0 ? (
              <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-stone-100">
                {friendActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3 py-3 border-b border-stone-50 last:border-0 pl-2">
                    <Avatar className="w-8 h-8 border border-stone-100">
                      <AvatarImage src={activity.profiles?.avatar_url} />
                      <AvatarFallback>{activity.profiles?.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-[#5D4037]">
                        <span className="font-bold">{activity.profiles?.username || 'Usuario'}</span>{' '}
                        {activity.details}
                      </p>
                      <p className="text-[10px] text-[#A8A29E] font-medium mt-0.5">
                        +{activity.xp_earned} XP • Hace 2h
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/50 border border-stone-100 rounded-[2rem] p-8 text-center">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300">
                  <Users size={20} />
                </div>
                <p className="text-sm font-bold text-[#A8A29E]">Sin actividad reciente</p>
                <p className="text-xs text-[#D7CCC8] mt-1">Tus amigos aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating XP Toast */}
        {socialToast.show && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#292524] text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 whitespace-nowrap">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-lg shadow-inner">
              {socialToast.type === 'challenge' ? '🏆' : '🔥'}
            </div>
            <div>
              <p className="text-xs font-bold">
                {socialToast.userName}
              </p>
              <p className="text-[10px] text-stone-400">
                +{socialToast.xp} XP ganados
              </p>
            </div>
          </div>
        )}

        {/* Modals */}
        <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¡Bienvenido a Social!</DialogTitle>
              <DialogDescription>
                Elige un nombre de usuario único para que tus amigos te encuentren.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="@usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button onClick={handleUpdateUsername} className="w-full">
                Empezar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedChallenge && (
        <ChallengeDetailsModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onAccept={() => handleAcceptChallenge(selectedChallenge.id)}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAvatarUpload}
      />

      {/* Hidden Audio Elements for Effects */}
      <audio ref={socialToastSoundRef} src="/sounds/notification.mp3" />

      <BottomNav />
    </>
  );
};

export default Social;
