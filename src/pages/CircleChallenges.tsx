import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Trophy, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MoniLoader } from "@/components/MoniLoader";

const CircleChallenges = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [showCreateChallengeDialog, setShowCreateChallengeDialog] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeXP, setChallengeXP] = useState("20");
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGainAmount, setXPGainAmount] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const xpSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      // Fetch circle details
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (circleError || !circleData) {
        toast.error('Error al cargar el círculo');
        navigate('/retos');
        return;
      }
      setCircle(circleData);

      // Check if current user is a member
      const { data: memberData } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', id)
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      setIsMember(!!memberData);

      // Fetch challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('circle_challenges')
        .select('*')
        .eq('circle_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    }
  };

  const setupRealtimeSubscription = () => {
    if (!id) return;

    const channel = supabase
      .channel(`circle-challenges-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_challenges',
          filter: `circle_id=eq.${id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCompleteChallenge = async (challengeId: string, xpReward: number) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (completedChallenges.has(challengeId)) {
      toast.info('Ya completaste este reto');
      return;
    }

    try {
      // Add XP to user in circle
      const { data: memberData } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', id)
        .eq('user_id', user.id)
        .single();

      if (memberData) {
        await supabase
          .from('circle_members')
          .update({ xp: (memberData.xp || 0) + xpReward })
          .eq('id', memberData.id);
      }

      // Add global XP
      await supabase.rpc('increment_social_xp', {
        target_user_id: user.id,
        xp_amount: xpReward
      });

      // Create activity log
      const { data: challengeData } = await supabase
        .from('circle_challenges')
        .select('title')
        .eq('id', challengeId)
        .single();

      await supabase
        .from('friend_activity')
        .insert({
          user_id: user.id,
          activity_type: 'challenge_completed',
          description: `completó el reto "${challengeData?.title || 'del círculo'}"`,
          xp_earned: xpReward
        });

      setCompletedChallenges(prev => new Set([...prev, challengeId]));

      // Show XP animation
      setXPGainAmount(xpReward);
      setShowXPGain(true);

      if (xpSoundRef.current) {
        xpSoundRef.current.currentTime = 0;
        xpSoundRef.current.volume = 0.35;
        xpSoundRef.current.play().catch(() => {});
      }

      setTimeout(() => {
        setShowXPGain(false);
      }, 2500);

      toast.success(`¡Reto completado! +${xpReward} XP`);
      fetchData();
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast.error('Error al completar el reto');
    }
  };

  const handleCreateChallenge = async () => {
    if (!user || !id || !challengeTitle.trim()) {
      toast.error('Por favor completa el título del reto');
      return;
    }

    try {
      const { error } = await supabase
        .from('circle_challenges')
        .insert({
          circle_id: id,
          title: challengeTitle,
          description: challengeDescription,
          xp_reward: parseInt(challengeXP) || 20,
          created_by: user.id,
          is_active: true
        });

      if (error) throw error;

      toast.success('Reto creado exitosamente');
      setShowCreateChallengeDialog(false);
      setChallengeTitle("");
      setChallengeDescription("");
      setChallengeXP("20");
      fetchData();
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast.error('Error al crear el reto');
    }
  };

  if (!circle) {
    return (
      <div className="page-standard min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="page-standard min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5f0ee]/80 to-transparent backdrop-blur-sm">
        <div className="page-container py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/circle/${id}`)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Retos: {circle.name}
              </h1>
              <p className="text-xs text-gray-600">
                Completa retos y gana XP
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-2 space-y-4">
        {/* Active Challenges */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
            <Trophy className="h-4 w-4 text-yellow-600" />
            🏆 Retos del círculo
          </h2>
          {challenges.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-4">
              No hay retos activos. {isMember && '¡Crea el primero!'}
            </p>
          ) : (
            <div className="space-y-3 mb-3">
              {challenges.map((challenge) => {
                const isCompleted = completedChallenges.has(challenge.id);
                return (
                  <div 
                    key={challenge.id} 
                    className={cn(
                      "p-3 border rounded-xl transition-all",
                      isCompleted 
                        ? "border-emerald-200 bg-emerald-50/50 opacity-75" 
                        : "border-gray-100 bg-white"
                    )}
                  >
                    <div className="flex-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium block",
                          isCompleted ? "text-emerald-700 line-through" : "text-gray-900"
                        )}>
                          Reto: &quot;{challenge.title}&quot;
                        </span>
                        {isCompleted && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            ✓ Completado
                          </span>
                        )}
                      </div>
                      {challenge.description && (
                        <span className="text-xs text-gray-500 block mt-1">
                          {challenge.description} · +{challenge.xp_reward} XP
                        </span>
                      )}
                    </div>
                    {isMember && !isCompleted && (
                      <Button
                        onClick={() => handleCompleteChallenge(challenge.id, challenge.xp_reward)}
                        size="sm"
                        className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0 rounded-xl font-medium h-8 text-xs"
                      >
                        Marcar como completado
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {isMember && (
            <Button
              onClick={() => setShowCreateChallengeDialog(true)}
              className="w-full bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              Crear nuevo reto
            </Button>
          )}
        </div>
      </div>

      {/* XP Gain Animation */}
      {showXPGain && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div 
            className="text-emerald-600 text-3xl font-bold drop-shadow-2xl animate-bounce"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(52, 211, 153, 0.9))',
              textShadow: '0 0 20px rgba(52, 211, 153, 0.8)'
            }}
          >
            +{xpGainAmount} XP
          </div>
        </div>
      )}

      {/* Hidden audio element */}
      <audio 
        ref={xpSoundRef}
        preload="auto"
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_3b7f0b1df4.mp3"
      />

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateChallengeDialog} onOpenChange={setShowCreateChallengeDialog}>
        <DialogContent className="max-w-[320px] rounded-3xl border-none shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-center text-lg font-bold">Crear Reto del Círculo</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Define un reto personalizado para que los miembros del círculo puedan completar y ganar XP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Título del reto *</label>
              <Input
                placeholder="Ej: Ahorra $100 esta semana"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                maxLength={100}
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Descripción del reto</label>
              <Input
                placeholder="Explica en qué consiste el reto (opcional)"
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                maxLength={200}
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Recompensa en XP *</label>
              <Input
                type="number"
                placeholder="20"
                value={challengeXP}
                onChange={(e) => setChallengeXP(e.target.value)}
                min="1"
                max="1000"
                className="rounded-xl text-sm"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                💡 Recomendado: 10-50 XP para retos diarios, 50-200 XP para retos semanales
              </p>
            </div>
            <Button 
              onClick={handleCreateChallenge}
              disabled={!challengeTitle.trim() || !challengeXP}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl shadow-md font-medium disabled:opacity-50"
            >
              ✨ Crear reto personalizado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CircleChallenges;
