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
import { Camera, Users, TrendingUp, Zap, Calendar, Trophy, Target, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const Social = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [scoreMoni, setScoreMoni] = useState<number>(40);
  const [profile, setProfile] = useState<any>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [monthlyRanking, setMonthlyRanking] = useState<number>(0);
  const [groupGoals, setGroupGoals] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Fetch group goals
        const { data: goalsData } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'group')
          .order('created_at', { ascending: false });

        if (goalsData) {
          setGroupGoals(goalsData);
        }
      }
    };

    fetchUserData();
  }, []);

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
                <span className="text-[10px] text-gray-600 font-medium text-center">Grupos</span>
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
                onClick={() => navigate('/financial-events')}
                className="flex flex-col items-center gap-1.5 group w-16"
              >
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">Eventos financieros</span>
              </button>
            </div>
          </div>

          {/* Group Goals Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">Metas Grupales</h3>
              </div>
              {groupGoals.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/new-goal')}
                  className="h-7 text-xs text-primary hover:text-primary/80"
                >
                  + Nueva
                </Button>
              )}
            </div>

            {groupGoals.length === 0 ? (
              <div className="text-center py-6">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Aún no tienes metas grupales creadas
                </p>
                <Button
                  onClick={() => navigate('/new-goal')}
                  variant="outline"
                  className="h-9 px-4 text-xs rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                >
                  Invita a tus amigos a una meta
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {groupGoals.map((goal) => {
                  const progress = (Number(goal.current) / Number(goal.target)) * 100;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => navigate(`/goals`)}
                      className="w-full text-left bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${goal.color || 'from-primary/20 to-primary/10'} flex items-center justify-center`}>
                            <Target className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                              {goal.title}
                            </h4>
                            {goal.members && (
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {goal.members} miembros
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-600">
                            ${Number(goal.current).toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            ${Number(goal.target).toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(progress, 100)} 
                          className="h-1.5"
                          indicatorClassName="bg-gradient-to-r from-primary to-primary/80"
                        />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-primary font-medium">
                            {progress.toFixed(0)}% completado
                          </span>
                          {goal.deadline && (
                            <span className="text-gray-500">
                              {new Date(goal.deadline).toLocaleDateString('es-MX', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
      </div>
      <BottomNav />
    </>
  );
};

export default Social;
