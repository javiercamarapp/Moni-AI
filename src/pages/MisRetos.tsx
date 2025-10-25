import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Calendar, TrendingUp, CheckCircle, XCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function MisRetos() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 Retos activos:', challengesData);
      setChallenges(challengesData || []);
    } catch (error) {
      console.error('Error al cargar retos:', error);
      toast.error('Error al cargar tus retos');
    } finally {
      setLoading(false);
    }
  };

  const generateNewChallenges = async () => {
    try {
      setGeneratingChallenges(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      toast.info('🤖 Moni AI está analizando tus transacciones...');

      const { data, error } = await supabase.functions.invoke('generate-challenges', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast.success('✨ Nuevos retos generados');
      await fetchChallenges();
    } catch (error: any) {
      console.error('Error generando retos:', error);
      toast.error(error.message || 'Error al generar nuevos retos');
    } finally {
      setGeneratingChallenges(false);
    }
  };

  const getChallengeProgress = (challenge: any) => {
    if (!challenge.target_amount || challenge.target_amount === 0) return 0;
    return Math.min((challenge.current_amount / challenge.target_amount) * 100, 100);
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Mis Retos</h1>
              <p className="text-sm text-gray-500">Desafíos personalizados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Mis retos de la semana</h2>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <Card className="p-8 text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No tienes retos activos
            </h3>
            <p className="text-gray-600 mb-4">
              Genera tus primeros retos personalizados con IA
            </p>
            <Button
              onClick={generateNewChallenges}
              disabled={generatingChallenges}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingChallenges ? 'Generando...' : 'Generar Retos'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge, index) => {
              const progress = getChallengeProgress(challenge);
              const daysLeft = getDaysRemaining(challenge.end_date);
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-5 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-base mb-1">
                          {challenge.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {challenge.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {daysLeft > 0 ? `${daysLeft} días restantes` : 'Último día'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl">🎯</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-bold text-gray-900">
                          ${challenge.current_amount.toLocaleString()} / ${challenge.target_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                      <p className="text-xs text-right text-gray-500">
                        {progress.toFixed(0)}% completado
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}