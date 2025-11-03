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

const Social = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [scoreMoni, setScoreMoni] = useState<number>(40);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [monthlyRanking, setMonthlyRanking] = useState<number>(0);
  const [friendsRankings, setFriendsRankings] = useState<any[]>([]);
  const [generalRankings, setGeneralRankings] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [monthlyChallenges, setMonthlyChallenges] = useState<any[]>([]);
  const [recommendedChallenge, setRecommendedChallenge] = useState<any>(null);
  const [friendActivity, setFriendActivity] = useState<any[]>([]);
  const [showAchievementUnlocked, setShowAchievementUnlocked] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<any>(null);
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGainAmount, setXPGainAmount] = useState(0);
  const [socialToast, setSocialToast] = useState<{ show: boolean; userName: string; type: string; xp: number; challenge?: string }>({ show: false, userName: '', type: '', xp: 0 });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const achievementSoundRef = useRef<HTMLAudioElement>(null);
  const xpSoundRef = useRef<HTMLAudioElement>(null);
  const socialToastSoundRef = useRef<HTMLAudioElement>(null);

  const achievementsList = [
    { id: 1, name: "Ahorrista Nivel 1", xp: 100, icon: "💰", desc: "Primeros 100 XP" },
    { id: 2, name: "Finanzas al Día", xp: 300, icon: "📊", desc: "Alcanza 300 XP" },
    { id: 3, name: "Estratega", xp: 600, icon: "🧠", desc: "Suma 600 XP" },
    { id: 4, name: "Maestro del Dinero", xp: 1000, icon: "👑", desc: "Alcanza 1000 XP totales" }
  ];

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
          // Set initial XP and Score from profile
          setTotalXP(profileData.total_xp || 0);
          if (profileData.score_moni) {
            setScoreMoni(profileData.score_moni);
          }
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
        
        // Fetch score from user_scores table
        const { data: scoreData } = await supabase
          .from('user_scores')
          .select('score_moni')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (scoreData) {
          setScoreMoni(scoreData.score_moni);
        }

        // Calculate monthly ranking among friends
        const { data: friendships } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (friendships && friendships.length > 0) {
          const friendIds = friendships.map(f => f.friend_id);
          const allUserIds = [...friendIds, user.id];

          const { data: allScores } = await supabase
            .from('user_scores')
            .select('user_id, score_moni')
            .in('user_id', allUserIds)
            .order('score_moni', { ascending: false });

          if (allScores) {
            const ranking = allScores.findIndex(s => s.user_id === user.id) + 1;
            setMonthlyRanking(ranking);
          }
        } else {
          setMonthlyRanking(1);
        }

        // Fetch monthly rankings
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
        }

        // Get friend IDs for friends ranking
        if (friendships && friendships.length > 0) {
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

        // Fetch monthly challenges
        const { data: challengesData } = await supabase
          .from('monthly_challenges')
          .select('*')
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .order('points', { ascending: false });

        if (challengesData) {
          setMonthlyChallenges(challengesData);
          // Set recommended challenge (first one)
          if (challengesData.length > 0) {
            setRecommendedChallenge(challengesData[0]);
          }
        }

        // Fetch friend activity
        if (friendships && friendships.length > 0) {
          const friendIds = friendships.map(f => f.friend_id);
          const { data: activityData } = await supabase
            .from('friend_activity')
            .select(`
              *,
              profiles:user_id (full_name, username)
            `)
            .in('user_id', friendIds)
            .order('created_at', { ascending: false })
            .limit(10);

          if (activityData) {
            setFriendActivity(activityData);
          }
        }

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
              // Reload rankings when any change occurs
              fetchRankingsData(user.id, currentMonth, currentYear, friendships);
            }
          )
          .subscribe();

        // Setup realtime subscription for friend activity
        const activityChannel = supabase
          .channel('realtime-friend-activity')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'friend_activity'
            },
            () => {
              // Reload friend activity when new activity is added
              fetchUserData();
            }
          )
          .subscribe();

        // Setup realtime subscription for reactions
        const reactionsChannel = supabase
          .channel('realtime-reactions')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'friend_activity_reactions'
            },
            async (payload: any) => {
              // Show toast notification if the reaction is for current user
              if (payload.new.to_user_id === user.id) {
                // Get the user who reacted
                const { data: fromUser } = await supabase
                  .from('profiles')
                  .select('username, full_name')
                  .eq('id', payload.new.from_user_id)
                  .single();

                if (fromUser) {
                  showSocialToast(
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
                setScoreMoni(payload.new.score_moni || 40);
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

  const handleUsernameSubmit = async () => {
    if (!user || !username.trim()) {
      toast.error('Por favor ingresa un nombre de usuario');
      return;
    }

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
      toast.error('El usuario debe tener 3-20 caracteres (solo letras, números y _)');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Este nombre de usuario ya existe');
        } else {
          throw error;
        }
        return;
      }

      setProfile({ ...profile, username: username.toLowerCase() });
      setShowUsernameDialog(false);
      toast.success('Usuario creado exitosamente');
    } catch (error: any) {
      console.error('Error creating username:', error);
      toast.error('Error al crear usuario');
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bueno";
    if (score >= 40) return "Regular";
    return "Necesita Mejora";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const calculateXPProgress = () => {
    const level = profile?.level || 1;
    const currentXP = profile?.xp || 0;
    const xpForNextLevel = level * 100;
    const progress = (currentXP / xpForNextLevel) * 100;
    return { currentXP, xpForNextLevel, progress: Math.min(progress, 100) };
  };

  const xpData = calculateXPProgress();

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_challenge_progress')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          completed: false
        });

      if (error) throw error;
      toast.success('¡Te has unido al reto!');
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      toast.error('Error al unirse al reto');
    }
  };

  const handleCompleteChallenge = async (challengeId: string, points: number) => {
    if (!user) {
      toast.error('Debes iniciar sesión para completar retos');
      return;
    }

    try {
      // Mark challenge as completed
      const { error: progressError } = await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challengeId,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,challenge_id'
        });

      if (progressError) throw progressError;

      // Update monthly ranking
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get current ranking or create new one
      const { data: existingRanking } = await supabase
        .from('monthly_rankings')
        .select('total_points, challenges_completed')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      const newPoints = (existingRanking?.total_points || 0) + points;
      const newChallengesCount = (existingRanking?.challenges_completed || 0) + 1;

      const { error: rankingError } = await supabase
        .from('monthly_rankings')
        .upsert({
          user_id: user.id,
          month: currentMonth,
          year: currentYear,
          total_points: newPoints,
          challenges_completed: newChallengesCount
        }, {
          onConflict: 'user_id,month,year'
        });

      if (rankingError) throw rankingError;

      // Update local state
      setUserPoints(newPoints);

      // Show XP gain animation with sound
      setXPGainAmount(points);
      setShowXPGain(true);
      
      // Play XP sound
      if (xpSoundRef.current) {
        xpSoundRef.current.currentTime = 0;
        xpSoundRef.current.volume = 0.35;
        xpSoundRef.current.play().catch(() => {});
      }
      
      setTimeout(() => setShowXPGain(false), 2500);

      // Check for newly unlocked achievements
      await checkAndUnlockAchievements(newPoints);

      // Create friend activity
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await supabase
        .from('friend_activity')
        .insert({
          user_id: user.id,
          activity_type: 'challenge_completed',
          description: `completó un reto y ganó ${points} XP`,
          xp_earned: points
        });

      toast.success(`¡Reto completado! +${points} XP 🎉`);
    } catch (error: any) {
      console.error('Error completing challenge:', error);
      toast.error('Error al completar el reto');
    }
  };

  const checkAndUnlockAchievements = async (currentXP: number) => {
    if (!user) return;

    for (const achievement of achievementsList) {
      if (currentXP >= achievement.xp) {
        // Check if already unlocked
        const { data: existing } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id)
          .eq('achievement_id', achievement.id)
          .maybeSingle();

        if (!existing) {
          // Unlock new achievement
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
              achievement_name: achievement.name,
              unlocked: true,
              unlocked_at: new Date().toISOString()
            });

          if (!error) {
            // Play achievement sound
            if (achievementSoundRef.current) {
              achievementSoundRef.current.currentTime = 0;
              achievementSoundRef.current.volume = 0.35;
              achievementSoundRef.current.play().catch(() => {
                // Ignore autoplay errors
              });
            }

            // Show achievement unlocked animation
            setUnlockedAchievement(achievement);
            setShowAchievementUnlocked(true);
            setTimeout(() => setShowAchievementUnlocked(false), 3000);

            // Create friend activity
            await supabase
              .from('friend_activity')
              .insert({
                user_id: user.id,
                activity_type: 'achievement_unlocked',
                description: `desbloqueó el logro "${achievement.name}"`,
                xp_earned: 0
              });
          }
        }
      }
    }
  };

  const handleShareInvite = () => {
    const inviteUrl = window.location.origin + '/auth';
    if (navigator.share) {
      navigator.share({
        title: 'Únete a Moni AI',
        text: '¡Únete a Moni AI y mejora tus finanzas! 🚀',
        url: inviteUrl
      });
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const handleReaction = async (activityId: string, activityAuthorId: string, reactionType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Debes iniciar sesión para reaccionar');
      return;
    }

    try {
      // Insert reaction
      const { error: reactionError } = await supabase
        .from('friend_activity_reactions')
        .insert({
          activity_id: activityId,
          from_user_id: user.id,
          to_user_id: activityAuthorId,
          emoji: reactionType
        });

      if (reactionError) {
        if (reactionError.code === '23505') {
          toast.info('Ya reaccionaste con este emoji');
          return;
        }
        throw reactionError;
      }

      // Increment social XP for the activity author
      const { error: xpError } = await supabase.rpc('increment_social_xp', {
        target_user_id: activityAuthorId,
        xp_amount: 1
      });

      if (xpError) {
        console.error('Error incrementing XP:', xpError);
      }

      // Play social XP sound
      if (socialToastSoundRef.current) {
        socialToastSoundRef.current.currentTime = 0;
        socialToastSoundRef.current.volume = 0.25;
        socialToastSoundRef.current.play().catch(() => {});
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }

      toast.success(`Reacción enviada ${reactionType}`);
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      toast.error('Error al enviar reacción');
    }
  };

  const fetchFriendActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get friendships
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => f.friend_id);
      const { data: activityData } = await supabase
        .from('friend_activity')
        .select(`
          *,
          profiles:user_id (full_name, username)
        `)
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityData) {
        setFriendActivity(activityData);
      }
    }
  };

  const showSocialToast = (userName: string, type: string, xp: number, challenge?: string) => {
    setSocialToast({ show: true, userName, type, xp, challenge });
    
    if (socialToastSoundRef.current) {
      socialToastSoundRef.current.currentTime = 0;
      socialToastSoundRef.current.volume = 0.25;
      socialToastSoundRef.current.play().catch(() => {});
    }

    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    setTimeout(() => {
      setSocialToast({ show: false, userName: '', type: '', xp: 0 });
    }, 3000);
  };

  return (
    <>
      <div className="min-h-screen pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Social
              </h1>
              <p className="text-xs text-gray-600">
                Encuentra tus amigos y disfruta de tus finanzas
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-2 space-y-4" style={{ maxWidth: '600px' }}>
          {/* User Profile Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-3">
            <div className="flex items-center gap-2">
              {/* Avatar with Upload Button */}
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user?.email ? getInitials(user.email) : "US"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-0.5 -right-0.5 bg-primary text-white rounded-full p-1 shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Camera className="h-2.5 w-2.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-900">
                  {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario"}
                </h2>
                
                {/* Username or Create Username Button */}
                {profile?.username ? (
                  <p className="text-[10px] text-primary font-medium mt-0.5">
                    @{profile.username}
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsernameDialog(true)}
                    className="h-4 px-1.5 text-[9px] text-primary hover:text-primary/80 -ml-1.5 mt-0.5"
                  >
                    Crear usuario
                  </Button>
                )}
                
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-gray-500">Score Moni:</span>
                  <span className={`text-[10px] font-semibold ${getScoreColor(scoreMoni)}`}>
                    {scoreMoni}/100
                  </span>
                  <span className={`text-[8px] px-1 py-0.5 rounded-full bg-primary/10 ${getScoreColor(scoreMoni)}`}>
                    {getScoreLabel(scoreMoni)}
                  </span>
                </div>
              </div>
            </div>


            {/* Level Badge & Monthly Ranking */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5">
                    <Zap className="h-2.5 w-2.5 text-primary" />
                    <span className="text-[10px] font-bold">Nivel {profile?.level || 1}</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 border-yellow-600/30 bg-yellow-50">
                    <Trophy className="h-2.5 w-2.5 text-yellow-600" />
                    <span className="text-[10px] font-bold text-yellow-700">#{monthlyRanking} entre amigos</span>
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {xpData.currentXP} / {xpData.xpForNextLevel} XP
                </span>
              </div>
              
              {/* XP Progress Bar */}
              <Progress value={xpData.progress} className="h-1.5" />
            </div>
          </div>

          {/* Action Buttons Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => navigate('/friends-list')}
                className="flex flex-col items-center gap-1.5 group w-16"
              >
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium text-center">Amigos</span>
              </button>

              <button 
                onClick={() => navigate('/groups')}
                className="flex flex-col items-center gap-1.5 group w-16"
              >
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[8px] text-gray-600 font-medium text-center leading-tight">Círculos Moni</span>
              </button>

              <button 
                onClick={() => navigate('/social-stats')}
                className="flex flex-col items-center gap-1.5 group w-16"
              >
                <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium text-center">Stats</span>
              </button>

              <button 
                onClick={() => navigate('/group-goals')}
                className="flex flex-col items-center gap-1.5 group w-16"
              >
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">Metas grupales</span>
              </button>
            </div>
          </div>

          {/* XP Progress Card */}
          <XPProgressCard 
            totalXP={totalXP} 
            scoreMoni={scoreMoni}
            className="animate-fade-in"
          />

          {/* User Badges */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <UserBadges totalXP={totalXP} />
          </div>

          {/* Challenges Section */}
          <div className="bg-[#f5efea] rounded-3xl shadow-sm p-5 -mx-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Suggested Challenges */}
              <div className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.06)] p-4 hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.03]">
                <h3 className="font-semibold text-black flex items-center gap-2 text-sm mb-1">
                  <Sparkles className="h-4 w-4 text-black" />
                  🔮 Retos Sugeridos por Moni AI
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Desafíos creados según tus hábitos financieros
                </p>
                
                {/* Carousel of suggested challenges */}
                <div className="space-y-3 overflow-x-auto pb-2 scrollbar-hide">
                  {monthlyChallenges.length > 0 ? (
                    monthlyChallenges.slice(0, 3).map((challenge) => (
                      <div key={challenge.id} className="min-w-full bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-semibold text-black">{challenge.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{challenge.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>7 días</span>
                          </div>
                          <span className="text-xs font-semibold text-black">+{challenge.points} XP</span>
                        </div>
                        <Button
                          onClick={() => handleCompleteChallenge(challenge.id, challenge.points)}
                          className="w-full mt-3 bg-black text-white hover:bg-gray-800 rounded-lg h-8 text-xs font-medium"
                        >
                          Aceptar reto
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">No hay retos sugeridos disponibles</p>
                    </div>
                  )}
                </div>
                
                {monthlyChallenges.length > 3 && (
                  <Button
                    onClick={() => navigate('/challenges')}
                    variant="ghost"
                    className="w-full mt-3 text-xs text-black hover:bg-gray-100"
                  >
                    Ver más retos
                  </Button>
                )}
              </div>

              {/* My Challenges */}
              <div className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.06)] p-4 hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.02]">
                <h3 className="font-semibold text-black flex items-center gap-2 text-sm mb-1">
                  <Trophy className="h-4 w-4 text-black" />
                  🔥 Mis Retos
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Da seguimiento a tus hábitos y gana XP
                </p>

                {/* No challenges state */}
                {(!recommendedChallenge && monthlyChallenges.length === 0) ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🌱</div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Aún no tienes retos activos
                    </p>
                    <Button
                      onClick={() => navigate('/challenges')}
                      className="mt-3 bg-black text-white hover:bg-gray-800 rounded-lg h-8 text-xs font-medium px-4"
                    >
                      Explorar retos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Active challenge */}
                    {recommendedChallenge && (
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-black">{recommendedChallenge.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{recommendedChallenge.description}</p>
                          </div>
                          <Badge className="bg-black text-white text-xs">+{recommendedChallenge.points} XP</Badge>
                        </div>
                        
                        {/* Weekly calendar */}
                        <div className="flex items-center gap-1 mt-3 mb-3">
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                                idx < 3 
                                  ? 'bg-black text-white' 
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {idx < 3 && <span className="text-xs">✓</span>}
                              {idx >= 3 && day}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleCompleteChallenge(recommendedChallenge.id, recommendedChallenge.points)}
                            variant="outline"
                            className="flex-1 border-gray-300 text-black hover:bg-gray-100 rounded-lg h-8 text-xs font-medium"
                          >
                            Marcar día
                          </Button>
                          <Button
                            onClick={() => navigate('/challenges')}
                            className="flex-1 bg-black text-white hover:bg-gray-800 rounded-lg h-8 text-xs font-medium"
                          >
                            Ver progreso
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Additional challenges */}
                    {monthlyChallenges.slice(0, 2).map((challenge) => (
                      <div key={challenge.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-black">{challenge.title}</h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{challenge.description}</p>
                          </div>
                          <Badge className="bg-black text-white text-xs ml-2">+{challenge.points} XP</Badge>
                        </div>
                        <Button
                          onClick={() => handleCompleteChallenge(challenge.id, challenge.points)}
                          variant="outline"
                          className="w-full mt-2 border-gray-300 text-black hover:bg-gray-100 rounded-lg h-7 text-xs font-medium"
                        >
                          Ver detalles
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Friend Activity - Interactive - Only show when user has friends */}
          {friendActivity.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  👥 Actividad de amigos
                </h2>
                <Button 
                  onClick={() => navigate('/friends-list')}
                  className="bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-8 px-3 text-xs"
                >
                  Ver todo
                </Button>
              </div>

              <div className="space-y-4">
                {friendActivity.map((activity) => (
                  <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <p className="text-sm text-gray-800 mb-1">
                      <strong className="font-medium">{activity.profiles?.username || activity.profiles?.full_name || 'Usuario'}</strong>{' '}
                      <span className="text-gray-600">{activity.description}</span>
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {activity.xp_earned > 0 && `+${activity.xp_earned} XP • `}
                      {new Date(activity.created_at).toLocaleDateString('es-MX', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Reactions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleReaction(activity.id, activity.user_id, '👏')}
                        className="hover:scale-110 transition-transform text-lg"
                      >
                        👏
                      </button>
                      <button 
                        onClick={() => handleReaction(activity.id, activity.user_id, '🔥')}
                        className="hover:scale-110 transition-transform text-lg"
                      >
                        🔥
                      </button>
                      <button 
                        onClick={() => handleReaction(activity.id, activity.user_id, '💬')}
                        className="hover:scale-110 transition-transform text-lg"
                      >
                        💬
                      </button>
                      <span className="text-xs text-gray-500 ml-2">0 reacciones</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 pt-2 border-t">
                Las actualizaciones se generan automáticamente cuando tus amigos completan retos o desbloquean logros.
              </p>
            </div>
          )}

          {/* Invite and Earn XP */}
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <h2 className="font-semibold text-gray-900 flex items-center justify-center gap-2 text-sm mb-2">
              <Gift className="h-4 w-4 text-primary" />
              Invita y gana XP
            </h2>
            <p className="text-gray-600 text-xs mb-3">
              Invita a tus amigos a Moni AI y gana +50 XP cuando completen su primer reto.
            </p>
            <Button
              onClick={handleShareInvite}
              className="w-full bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9 flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Compartir enlace
            </Button>
          </div>
        </div>

        {/* Achievement Unlocked Toast */}
        {showAchievementUnlocked && unlockedAchievement && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3">
              <div className="text-3xl animate-bounce">{unlockedAchievement.icon}</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{unlockedAchievement.name}</p>
                <p className="text-gray-600 text-xs">{unlockedAchievement.desc}</p>
              </div>
            </div>
          </div>
        )}

        {/* XP Gain Animation (center bottom - secondary) */}
        {showXPGain && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
            <div className={`text-green-600 text-3xl font-bold drop-shadow-2xl transition-all duration-700 ${showXPGain ? 'opacity-100 -translate-y-8 scale-110' : 'opacity-0'}`}>
              +{xpGainAmount} XP
            </div>
          </div>
        )}

        {/* Social Toast Notification */}
        {socialToast.show && (
          <div 
            className="fixed right-4 bottom-8 bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl p-4 shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-right duration-500"
            style={{ maxWidth: '320px' }}
          >
            <span className="text-xl">
              {socialToast.type === 'reaction' && '👏'}
              {socialToast.type === 'comment' && '💬'}
              {socialToast.type === 'achievement' && '🏅'}
              {socialToast.type === 'join_circle' && '💬'}
            </span>
            <p className="text-sm font-medium text-gray-900">
              <strong>{socialToast.userName}</strong>{' '}
              {socialToast.type === 'reaction' && 'reaccionó a tu progreso'}
              {socialToast.type === 'comment' && `comentó tu reto${socialToast.challenge ? ` "${socialToast.challenge}"` : ''}`}
              {socialToast.type === 'achievement' && `felicitó tu logro${socialToast.challenge ? ` "${socialToast.challenge}"` : ''}`}
              {socialToast.type === 'join_circle' && `se unió a tu círculo${socialToast.challenge ? ` "${socialToast.challenge}"` : ''}`}
            </p>
          </div>
        )}

        {/* Hidden audio elements */}
        <audio 
          ref={achievementSoundRef}
          preload="auto"
          src="https://cdn.pixabay.com/audio/2022/03/15/audio_2b21d3ad9f.mp3"
        />
        <audio 
          ref={xpSoundRef}
          preload="auto"
          src="https://cdn.pixabay.com/audio/2022/03/15/audio_3b7f0b1df4.mp3"
        />
        <audio 
          ref={socialToastSoundRef}
          preload="auto"
          src="https://cdn.pixabay.com/audio/2022/03/15/audio_3b7f0b1df4.mp3"
        />

        {/* Username Creation Dialog */}
        <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
          <DialogContent className="max-w-[280px] rounded-3xl border-none shadow-2xl p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-center text-lg font-bold">Crear usuario</DialogTitle>
              <DialogDescription className="text-center text-xs text-muted-foreground">
                3-20 caracteres (a-z, 0-9, _)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 bg-muted/30 rounded-2xl px-4 py-2.5">
                <span className="text-sm text-muted-foreground font-medium">@</span>
                <Input
                  placeholder="usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  maxLength={20}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm"
                />
              </div>
              <Button 
                onClick={handleUsernameSubmit} 
                className="w-full bg-white text-foreground hover:bg-white/90 rounded-2xl shadow-md font-medium"
              >
                Crear usuario
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Level Up Animation */}
        <MoniLevelUp 
          level={Math.floor(totalXP / 100) + 1}
          show={showLevelUp}
          onComplete={() => setShowLevelUp(false)}
        />
      </div>
      <BottomNav />
    </>
  );
};

export default Social;
