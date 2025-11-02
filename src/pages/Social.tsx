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
import { Camera, Users, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

const Social = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [scoreMoni, setScoreMoni] = useState<number>(40);
  const [profile, setProfile] = useState<any>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              {/* Avatar with Upload Button */}
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {user?.email ? getInitials(user.email) : "US"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Camera className="h-3 w-3" />
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
                <h2 className="text-lg font-bold text-gray-900">
                  {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario"}
                </h2>
                
                {/* Username or Create Username Button */}
                {profile?.username ? (
                  <p className="text-xs text-primary font-medium mt-0.5">
                    @{profile.username}
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsernameDialog(true)}
                    className="h-5 px-2 text-[10px] text-primary hover:text-primary/80 -ml-2 mt-0.5"
                  >
                    Crear usuario
                  </Button>
                )}
                
                <p className="text-xs text-gray-600 mt-0.5">
                  {user?.email || "usuario@ejemplo.com"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-500">Score Moni:</span>
                  <span className={`text-xs font-semibold ${getScoreColor(scoreMoni)}`}>
                    {scoreMoni}/100
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 ${getScoreColor(scoreMoni)}`}>
                    {getScoreLabel(scoreMoni)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio/Description */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                {profile?.bio || user?.user_metadata?.bio || "Mejorando mis finanzas con Moni AI 🚀"}
              </p>
            </div>

            {/* Level Badge */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold">Nivel {profile?.level || 1}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {xpData.currentXP} / {xpData.xpForNextLevel} XP
                </span>
              </div>
              
              {/* XP Progress Bar */}
              <Progress value={xpData.progress} className="h-2" />
            </div>
          </div>

          {/* Action Buttons Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex justify-center gap-8">
              <button 
                onClick={() => navigate('/friends-list')}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium">Amigos</span>
              </button>

              <button 
                onClick={() => navigate('/groups')}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium">Grupos</span>
              </button>

              <button 
                onClick={() => navigate('/social-stats')}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium">Stats</span>
              </button>
            </div>
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
