import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, X, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RetroCarousel } from "@/components/ui/retro-carousel";

// Extraer emoji del nombre de la categoría
const getCategoryEmoji = (category: string): string => {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const match = category.match(emojiRegex);
  return match ? match[0] : '📊';
};

// Remover emoji del nombre de la categoría
const removeCategoryEmoji = (category: string): string => {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  return category.replace(emojiRegex, '').trim();
};

export default function MisRetos() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchChallenges();
    verifyProgress();
  }, []);

  // Auto-generar retos si no hay ninguno
  useEffect(() => {
    if (!loading && challenges.length === 0 && !generatingChallenges) {
      const timer = setTimeout(() => {
        generateNewChallenges();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, challenges.length]);

  const verifyProgress = async () => {
    try {
      console.log('🔍 Verificando progreso de retos...');
      const { data, error } = await supabase.functions.invoke('verify-challenge-progress');
      
      if (error) {
        console.error('Error verificando progreso:', error);
      } else {
        console.log('✅ Progreso verificado:', data);
        // Recargar retos después de verificar
        await fetchChallenges();
      }
    } catch (error) {
      console.error('Error al verificar progreso:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active challenges
      const { data: activeData, error: activeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Fetch pending challenges
      const { data: pendingData, error: pendingError } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Combine both lists
      setChallenges([...(activeData || []), ...(pendingData || [])]);

      console.log('📊 Retos cargados:', [...(activeData || []), ...(pendingData || [])].length, 'total');
      console.log('  ✅ Activos:', activeData?.length || 0);
      console.log('  ⏳ Pendientes:', pendingData?.length || 0);
    } catch (error) {
      console.error('Error al cargar retos:', error);
      toast.error('Error al cargar tus retos');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllChallenges = async (showToast = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      if (showToast) {
        toast.success('Retos eliminados correctamente');
      }
      await fetchChallenges();
    } catch (error) {
      console.error('Error eliminando retos:', error);
      toast.error('Error al eliminar los retos');
    }
  };

  const generateNewChallenges = async () => {
    try {
      setGeneratingChallenges(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar si el usuario completó el presupuesto
      const { data: profile } = await supabase
        .from('profiles')
        .select('budget_quiz_completed')
        .eq('id', user.id)
        .single();

      if (!profile?.budget_quiz_completed) {
        toast.error('Primero debes completar tu presupuesto', {
          description: 'Ve a tu perfil y completa el quiz de presupuesto para generar retos personalizados'
        });
        setGeneratingChallenges(false);
        return;
      }

      // Eliminar retos anteriores primero
      await deleteAllChallenges(false);

      toast.info('🤖 Moni AI está analizando tu presupuesto y generando 12 retos personalizados...');

      const { data, error } = await supabase.functions.invoke('generate-challenges', {
        body: { userId: user.id, count: 12 }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || "Error al comunicarse con el servidor");
      }

      if (!data?.challenges || data.challenges.length === 0) {
        throw new Error("No se pudieron generar retos. Por favor intenta nuevamente.");
      }

      toast.success(`✨ ${data.challenges.length} retos generados basados en tus gastos reales`);
      await fetchChallenges();
    } catch (error: any) {
      console.error('Error generando retos:', error);
      toast.error(error.message || 'Error al generar nuevos retos');
    } finally {
      setGeneratingChallenges(false);
    }
  };

  const acceptChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'active' })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('¡Reto aceptado!');
      await fetchChallenges();
    } catch (error) {
      console.error('Error al aceptar reto:', error);
      toast.error('Error al aceptar el reto');
    }
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
            {challenges.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAllChallenges()}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0"
              >
                <X className="h-4 w-4 text-gray-700" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <Card className="p-6 text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No tienes retos activos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Genera retos personalizados que te ayuden a ahorrar 25% de tu presupuesto
            </p>
            <Button
              onClick={generateNewChallenges}
              disabled={generatingChallenges}
              size="sm"
              className="bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-md hover:shadow-lg transition-all border border-gray-200/50 font-semibold rounded-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingChallenges ? 'Generando...' : 'Generar Retos con IA'}
            </Button>
          </Card>
        ) : (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight mb-4">
              Sugerencias de la IA
            </h2>
            {(() => {
              console.log('🎯 Renderizando retos:', challenges.length, challenges);
              const grouped = challenges.reduce((acc, challenge) => {
                const category = challenge.category || 'Sin categoría';
                if (!acc[category]) acc[category] = [];
                acc[category].push(challenge);
                return acc;
              }, {} as Record<string, any[]>);
              console.log('📦 Retos agrupados:', Object.keys(grouped).length, 'categorías');
              return Object.entries(grouped);
            })().map(([category, categoryChallenges]: [string, any[]]) => {
              // No limitar, mostrar todos los retos de la categoría
              
              // Obtener emoji de la categoría
              const categoryEmoji = getCategoryEmoji(category);
              const categoryName = removeCategoryEmoji(category);
              
              return (
                <div key={category} className="mb-8">
                  <h3 className="text-md font-semibold text-gray-900 mb-3 px-1 flex items-center gap-2">
                    <span className="text-xl">{categoryEmoji}</span>
                    {categoryName}
                  </h3>
                  <div className="relative">
                    <div className="flex overflow-x-auto gap-4 pb-4 px-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                      {categoryChallenges.map((challenge, index) => (
                        <div key={challenge.id} className="flex-shrink-0 w-[85%] sm:w-[45%] md:w-[30%] snap-start">
                          <ChallengeCard
                            challenge={challenge}
                            index={index}
                            onAccept={acceptChallenge}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Challenge Card Component - Similar to ScoreCard
const ChallengeCard = ({
  challenge,
  index,
  onAccept,
}: {
  challenge: any;
  index: number;
  onAccept: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExpand = () => setIsExpanded(true);
  const handleCollapse = () => setIsExpanded(false);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCollapse();
      }
    };

    if (isExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({top: scrollY, behavior: "instant"});
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isExpanded]);

  // Parse days status array
  const daysStatus = Array.isArray(challenge.days_status) ? challenge.days_status : [];
  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Calculate progress based on challenge type
  const challengeType = challenge.challenge_type || 'spending_limit';
  let progress = 0;
  
  if (challengeType === 'spending_limit' || challengeType === 'daily_budget') {
    // Para límites de gasto: progreso = cuánto has gastado / límite
    progress = Math.min(100, (challenge.current_amount / challenge.target_amount) * 100);
  } else if (challengeType === 'days_without') {
    // Para días sin gastar: progreso = días completados / días objetivo
    const daysCompleted = daysStatus.filter(d => d.completed === true).length;
    const dailyGoal = challenge.daily_goal || 5;
    progress = (daysCompleted / dailyGoal) * 100;
  }
  
  const startDate = new Date(challenge.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  
  const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentDayIndex = Math.min(daysPassed, 6);
  const isLastDay = currentDayIndex === 6;

  const getColors = () => {
    if (challenge.status === 'pending') return {
      bg: 'bg-blue-600',
      gradient: 'from-blue-500 to-blue-600',
      ring: 'ring-blue-600',
      badge: 'bg-white',
      badgeText: 'text-blue-600',
      overlay: 'bg-blue-400',
    };
    
    // Colores diferentes según tipo de reto
    if (challengeType === 'spending_limit') {
      if (progress >= 80) return {
        bg: 'bg-red-600',
        gradient: 'from-red-500 to-red-600',
        ring: 'ring-red-600',
        badge: 'bg-white',
        badgeText: 'text-red-600',
        overlay: 'bg-red-400',
      };
      return {
        bg: 'bg-emerald-600',
        gradient: 'from-emerald-500 to-emerald-600',
        ring: 'ring-emerald-600',
        badge: 'bg-white',
        badgeText: 'text-emerald-600',
        overlay: 'bg-emerald-400',
      };
    }
    
    if (challengeType === 'days_without') {
      return {
        bg: 'bg-purple-600',
        gradient: 'from-purple-500 to-purple-600',
        ring: 'ring-purple-600',
        badge: 'bg-white',
        badgeText: 'text-purple-600',
        overlay: 'bg-purple-400',
      };
    }
    
    if (challengeType === 'daily_budget') {
      return {
        bg: 'bg-orange-600',
        gradient: 'from-orange-500 to-orange-600',
        ring: 'ring-orange-600',
        badge: 'bg-white',
        badgeText: 'text-orange-600',
        overlay: 'bg-orange-400',
      };
    }
    
    // savings_goal
    return {
      bg: 'bg-cyan-600',
      gradient: 'from-cyan-500 to-cyan-600',
      ring: 'ring-cyan-600',
      badge: 'bg-white',
      badgeText: 'text-cyan-600',
      overlay: 'bg-cyan-400',
    };
  };

  const colors = getColors();

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-50 flex items-center justify-center">
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className="bg-black/50 backdrop-blur-lg h-full w-full fixed inset-0"
              onClick={handleCollapse}
            />
            <motion.div
              initial={{opacity: 0, scale: 0.95, y: 20}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 20}}
              transition={{duration: 0.3, ease: "easeOut"}}
              ref={containerRef}
              className={`max-w-3xl w-full mx-4 bg-gradient-to-br ${colors.gradient} backdrop-blur-xl h-[90vh] z-[60] p-4 md:p-6 rounded-3xl relative overflow-y-auto shadow-2xl border border-white/20`}
            >
              <button
                className="absolute top-3 right-3 h-10 w-10 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 border border-white/30 flex items-center justify-center group z-10"
                onClick={handleCollapse}
              >
                <X className="h-4 w-4 text-gray-700 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              
              <motion.div 
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}
                className="space-y-3 pt-2"
              >
                <motion.p className="px-4 md:px-8 text-xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">
                  {challenge.title}
                </motion.p>
                
                {challengeType === 'days_without' ? (
                  <motion.div className="px-4 md:px-8">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
                      <span className="text-2xl font-black text-white drop-shadow">
                        {daysStatus.filter(d => d.completed === true).length}
                      </span>
                      <span className="text-white/70 text-lg font-medium">/</span>
                      <span className="text-lg font-bold text-white/90">
                        {challenge.daily_goal || 5} días
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div className="px-4 md:px-8">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
                      <span className="text-xl font-black text-white drop-shadow">
                        ${challenge.current_amount.toFixed(0)}
                      </span>
                      <span className="text-white/70 text-lg font-medium">/</span>
                      <span className="text-lg font-bold text-white/90">
                        ${challenge.target_amount.toFixed(0)}
                      </span>
                    </div>
                  </motion.div>
                )}
                
                {isLastDay && (
                  <div className="px-4 md:px-8">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/30 to-red-500/30 backdrop-blur-md text-white border border-orange-200/40 py-2 px-4 rounded-xl shadow-lg text-sm">
                      <span className="text-lg">🔥</span>
                      <span className="font-bold">¡Último día!</span>
                    </div>
                  </div>
                )}
                
                <div className="py-3 px-4 md:px-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl">
                    <Quote className="h-5 w-5 text-white/80 mb-2 drop-shadow" />
                    <p className="text-white/95 text-sm md:text-base leading-relaxed font-medium">
                      {challenge.description}
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {challenge.status !== 'pending' && (
                <div className="px-4 md:px-8 space-y-2 mb-4">
                  <h3 className="text-lg font-black text-white mb-3 drop-shadow-lg">
                    📊 Progreso semanal
                  </h3>
                  <div className="space-y-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const dayStatus = daysStatus[dayIndex];
                      const isCompleted = dayStatus?.completed === true;
                      const isFailed = dayStatus?.completed === false;
                      const isCurrentDay = dayIndex === currentDayIndex;
                      
                      return (
                        <motion.div 
                          key={dayIndex}
                          initial={{opacity: 0, x: -20}}
                          animate={{opacity: 1, x: 0}}
                          transition={{delay: dayIndex * 0.03}}
                          className={`flex items-center justify-between p-3 rounded-xl backdrop-blur-md border transition-all duration-300 ${
                            isCurrentDay 
                              ? 'bg-white/30 border-white/40 shadow-lg scale-[1.02]' 
                              : 'bg-white/15 border-white/20 hover:bg-white/25'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-base font-black shadow-lg transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110' 
                                  : isFailed 
                                  ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                  : 'bg-white/40 text-white border-2 border-white/50'
                              }`}
                            >
                              {isCompleted && '✓'}
                              {isFailed && '✗'}
                              {!isCompleted && !isFailed && '·'}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm drop-shadow">
                                {dayNamesFull[dayIndex]}
                              </p>
                              {dayStatus?.date && (
                                <p className="text-xs text-white/80 font-medium">
                                  {format(new Date(dayStatus.date), 'd MMM', { locale: es })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {dayStatus && (
                              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/30">
                                <p className="text-sm font-black text-white drop-shadow">
                                  ${dayStatus.amount?.toFixed(0) || 0}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {challenge.status === 'pending' && (
                <div className="px-4 md:px-8 pb-4">
                  <Button 
                    className="w-full bg-white text-gray-900 hover:bg-white/95 hover:scale-[1.02] font-bold text-base py-4 rounded-xl shadow-2xl transition-all duration-300 border-2 border-white/50"
                    onClick={() => {
                      onAccept(challenge.id);
                      handleCollapse();
                    }}
                  >
                    ✨ Aceptar este reto
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};