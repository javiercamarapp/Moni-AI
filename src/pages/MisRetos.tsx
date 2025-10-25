import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, Calendar, TrendingUp, CheckCircle, XCircle, Target, RefreshCw } from "lucide-react";
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
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchChallenges();
    verifyProgress(); // Verificar progreso al cargar
  }, []);

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

      // Fetch active challenges (accepted and in progress)
      const { data: activeData, error: activeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      const activeChallenges = activeData || [];
      const slotsAvailable = 2 - activeChallenges.length;

      // If we need more challenges to fill 2 slots, fetch pending suggestions
      if (slotsAvailable > 0) {
        const { data: pendingData, error: pendingError } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(slotsAvailable);

        if (pendingError) throw pendingError;

        const pendingSuggestions = pendingData || [];
        setChallenges([...activeChallenges, ...pendingSuggestions]);
      } else {
        // We already have 2 active challenges
        setChallenges(activeChallenges);
      }

      console.log('📊 Retos cargados:', activeData);
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
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Mis retos de la semana</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <Card key={i} className="p-2.5 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
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
          <div className="grid grid-cols-2 gap-3">
            {challenges.slice(0, 2).map((challenge, index) => {
              const progress = (challenge.current_amount / challenge.target_amount) * 100;
              // days_status already comes parsed from Supabase (JSONB type)
              const daysStatus = Array.isArray(challenge.days_status) ? challenge.days_status : [];
              const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
              
              // Calculate which day we're on
              const startDate = new Date(challenge.start_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              startDate.setHours(0, 0, 0, 0);
              
              const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const currentDayIndex = Math.min(daysPassed, 6); // 0-6 for Sunday-Saturday
              const isLastDay = currentDayIndex === 6;
              
              return (
                <Card 
                  key={challenge.id} 
                  className="w-full p-2.5 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden min-w-0 cursor-pointer hover:shadow-lg transition-shadow"
                  style={{ transform: 'translate3d(0, 0, 0)' }}
                  onClick={() => setSelectedChallenge(challenge)}
                >
                  <div className="relative z-10">
                    {isLastDay && (
                      <Badge className="w-full bg-orange-500/20 text-orange-700 text-[9px] border-orange-500/30 mb-2 justify-center">
                        🔥 Último día del reto
                      </Badge>
                    )}
                    
                    <div className="mb-2">
                      <h4 className="text-sm font-bold text-foreground drop-shadow-sm mb-0.5 line-clamp-1 leading-tight">
                        {challenge.title}
                      </h4>
                      <p className="text-[10px] text-foreground/70 drop-shadow-sm line-clamp-2 leading-tight">
                        {challenge.description}
                      </p>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-base font-bold text-foreground drop-shadow-sm">
                          ${challenge.current_amount.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-foreground/70 drop-shadow-sm">
                          de ${challenge.target_amount}
                        </span>
                      </div>
                      
                      <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 backdrop-blur-sm rounded p-1.5 border border-gray-200 mb-2">
                      <div className="flex justify-between gap-0.5">
                        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                          const dayStatus = daysStatus[dayIndex];
                          const isCompleted = dayStatus?.completed === true;
                          const isFailed = dayStatus?.completed === false;
                          const isPending = !dayStatus;
                          const isCurrentDay = dayIndex === currentDayIndex;
                          
                          return (
                            <div 
                              key={dayIndex} 
                              className="flex flex-col items-center"
                            >
                              <span className={`text-[8px] mb-0.5 ${isCurrentDay ? 'text-blue-600 font-bold' : 'text-foreground/70'}`}>
                                {dayNames[dayIndex]}
                              </span>
                              <div 
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  isCompleted 
                                    ? 'bg-green-500/80 text-white' 
                                    : isFailed 
                                    ? 'bg-red-500/80 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                } ${isCurrentDay ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                              >
                                {isCompleted && '✓'}
                                {isFailed && '✗'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {challenge.status === 'pending' ? (
                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-7 text-[10px] font-medium"
                        onClick={() => acceptChallenge(challenge.id)}
                      >
                        Aceptar reto
                      </Button>
                    ) : (
                      <div className="text-center py-1">
                        <Badge className="bg-green-500/20 text-green-700 text-[9px] border-green-500/30">
                          En progreso
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle del reto */}
      <Dialog open={!!selectedChallenge} onOpenChange={(open) => !open && setSelectedChallenge(null)}>
        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-sm">
          {selectedChallenge && (() => {
            const progress = (selectedChallenge.current_amount / selectedChallenge.target_amount) * 100;
            const daysStatus = Array.isArray(selectedChallenge.days_status) ? selectedChallenge.days_status : [];
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            
            const startDate = new Date(selectedChallenge.start_date);
            const endDate = new Date(selectedChallenge.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            
            const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const currentDayIndex = Math.min(daysPassed, 6);
            const isLastDay = currentDayIndex === 6;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {selectedChallenge.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {isLastDay && (
                    <Badge className="w-full bg-orange-500/20 text-orange-700 border-orange-500/30 justify-center py-2">
                      🔥 ¡Último día del reto!
                    </Badge>
                  )}
                  
                  <div>
                    <p className="text-gray-700 text-base leading-relaxed">
                      {selectedChallenge.description}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6">
                    <div className="flex justify-between items-baseline mb-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Progreso actual</p>
                        <p className="text-3xl font-bold text-gray-900">
                          ${selectedChallenge.current_amount.toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Meta semanal</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${selectedChallenge.target_amount.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {progress.toFixed(1)}% completado
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Progreso diario</h3>
                    <div className="space-y-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                        const dayStatus = daysStatus[dayIndex];
                        const isCompleted = dayStatus?.completed === true;
                        const isFailed = dayStatus?.completed === false;
                        const isPending = !dayStatus;
                        const isCurrentDay = dayIndex === currentDayIndex;
                        
                        return (
                          <div 
                            key={dayIndex}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              isCurrentDay ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                  isCompleted 
                                    ? 'bg-green-500 text-white' 
                                    : isFailed 
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {isCompleted && '✓'}
                                {isFailed && '✗'}
                                {isPending && '·'}
                              </div>
                              <div>
                                <p className={`font-medium ${isCurrentDay ? 'text-blue-700' : 'text-gray-900'}`}>
                                  {dayNames[dayIndex]}
                                </p>
                                {dayStatus?.date && (
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(dayStatus.date), 'd MMM', { locale: es })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {dayStatus && (
                                <p className={`text-sm font-semibold ${
                                  isCompleted ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  ${dayStatus.amount?.toFixed(0) || 0}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {selectedChallenge.status === 'pending' ? (
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptChallenge(selectedChallenge.id);
                          setSelectedChallenge(null);
                        }}
                      >
                        Aceptar reto
                      </Button>
                    ) : (
                      <Badge className="flex-1 bg-green-500/20 text-green-700 border-green-500/30 justify-center py-2">
                        ✓ Reto en progreso
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}