import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Calendar, Trophy, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  category: string;
  challenge_type: string;
  target_amount: number;
  difficulty: string;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  challenge_date: string;
  status: string;
  completed: boolean;
  challenge?: DailyChallenge;
}

const Challenges = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [recommendedChallenges, setRecommendedChallenges] = useState<DailyChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<UserChallenge[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch active challenges
      const { data: activeData, error: activeError } = await supabase
        .from('user_daily_challenges')
        .select(`
          *,
          challenge:daily_challenges(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('challenge_date', { ascending: false });

      if (activeError) throw activeError;
      setActiveChallenges(activeData || []);

      // Fetch completed challenges (last 7 days)
      const { data: completedData, error: completedError } = await supabase
        .from('user_daily_challenges')
        .select(`
          *,
          challenge:daily_challenges(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('challenge_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('challenge_date', { ascending: false });

      if (completedError) throw completedError;
      setCompletedChallenges(completedData || []);

      // Calculate streak
      const { data: streakData } = await supabase
        .from('user_daily_challenges')
        .select('challenge_date, completed')
        .eq('user_id', user.id)
        .order('challenge_date', { ascending: false })
        .limit(30);

      if (streakData && streakData.length > 0) {
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < streakData.length; i++) {
          const challengeDate = new Date(streakData[i].challenge_date);
          challengeDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          expectedDate.setHours(0, 0, 0, 0);

          if (challengeDate.getTime() === expectedDate.getTime() && streakData[i].completed) {
            currentStreak++;
          } else if (challengeDate.getTime() < expectedDate.getTime()) {
            break;
          }
        }
        setStreak(currentStreak);
      }

      // Fetch recommended challenges
      const { data: recommendedData, error: recommendedError } = await supabase
        .from('daily_challenges')
        .select('*')
        .limit(3);

      if (recommendedError) throw recommendedError;
      setRecommendedChallenges(recommendedData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los retos');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_daily_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          challenge_date: new Date().toISOString(),
          status: 'active'
        });

      if (error) throw error;

      toast.success('¡Reto aceptado! Puedes comenzar ahora.');
      fetchData();
    } catch (error: any) {
      console.error('Error accepting challenge:', error);
      toast.error('Error al aceptar el reto');
    }
  };

  const handleMarkComplete = async (userChallengeId: string, xpReward: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_daily_challenges')
        .update({ 
          completed: true,
          status: 'completed'
        })
        .eq('id', userChallengeId);

      if (error) throw error;

      // Add XP
      await supabase.rpc('increment_social_xp', {
        target_user_id: user.id,
        xp_amount: xpReward
      });

      // Show confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c8a57b', '#e3c890', '#f5efea']
      });

      toast.success(`¡Reto completado! +${xpReward} XP`);
      fetchData();
    } catch (error: any) {
      console.error('Error completing challenge:', error);
      toast.error('Error al completar el reto');
    }
  };

  return (
    <>
      <div className="min-h-screen pb-24 bg-gradient-to-b from-amber-50/30 to-orange-50/20 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-purple-50/80 via-cyan-50/60 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Retos
                </h1>
                <p className="text-xs text-gray-600">
                  Desafía tus hábitos financieros con Moni AI
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-6 space-y-6" style={{ maxWidth: '1200px' }}>
          {loading ? (
            <div className="py-12">
              <SectionLoader size="lg" />
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-[#c8a57b]/10">
                  <p className="text-xs text-gray-600 mb-1">Racha Actual</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                    🔥 {streak} días
                  </p>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-[#c8a57b]/10">
                  <p className="text-xs text-gray-600 mb-1">Retos Activos</p>
                  <p className="text-lg font-bold text-gray-900">{activeChallenges.length}</p>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-[#c8a57b]/10">
                  <p className="text-xs text-gray-600 mb-1">Completados (7 días)</p>
                  <p className="text-lg font-bold text-gray-900">{completedChallenges.length}</p>
                </div>
              </div>

              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900">Mis Retos Activos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeChallenges.map((userChallenge) => {
                      const challenge = userChallenge.challenge as any;
                      return (
                        <div key={userChallenge.id} className="bg-white rounded-2xl shadow-sm p-5 border border-[#c8a57b]/10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                                {challenge?.title || 'Reto'}
                              </h3>
                              <p className="text-xs text-gray-600">
                                {challenge?.description || ''}
                              </p>
                            </div>
                            <span className="text-xl">🎯</span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Recompensa</span>
                              <span className="font-semibold text-[#c8a57b]">+{challenge?.xp_reward || 0} XP</span>
                            </div>

                            <Button
                              onClick={() => handleMarkComplete(userChallenge.id, challenge?.xp_reward || 0)}
                              className="w-full h-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md transition-all border-0 text-gray-900 font-semibold text-sm"
                            >
                              Marcar completado
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Challenges */}
              {activeChallenges.length === 0 && recommendedChallenges.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-[#c8a57b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🌱</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Aún no tienes retos activos
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Comienza con un reto recomendado por Moni AI y mejora tus hábitos financieros.
                  </p>
                </div>
              ) : recommendedChallenges.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#c8a57b]" />
                    <h2 className="text-base font-semibold text-gray-900">Recomendados por Moni AI</h2>
                  </div>
                  <p className="text-xs text-gray-600">
                    Basados en tus hábitos, gastos e ingresos
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendedChallenges.map((challenge) => (
                      <div key={challenge.id} className="bg-white rounded-2xl shadow-sm p-5 border border-[#c8a57b]/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">
                              {challenge.title}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {challenge.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {challenge.difficulty || 'Normal'}
                            </span>
                            <span className="font-semibold text-[#c8a57b]">+{challenge.xp_reward} XP</span>
                          </div>

                          <Button
                            onClick={() => handleAcceptChallenge(challenge.id)}
                            className="w-full h-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md transition-all border-0 text-gray-900 font-semibold text-sm"
                          >
                            Aceptar reto
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Challenges */}
              {completedChallenges.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#c8a57b]" />
                    <h2 className="text-base font-semibold text-gray-900">Retos Completados (últimos 7 días)</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedChallenges.map((userChallenge) => {
                      const challenge = userChallenge.challenge as any;
                      return (
                        <div key={userChallenge.id} className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-200/50 relative overflow-hidden">
                          <div className="absolute top-2 right-2">
                            <span className="text-2xl">✓</span>
                          </div>
                          <div className="flex-1 pr-8">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">
                              {challenge?.title || 'Reto'}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2">
                              {challenge?.description || ''}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-emerald-600">
                                +{challenge?.xp_reward || 0} XP ganados
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
};

export default Challenges;
