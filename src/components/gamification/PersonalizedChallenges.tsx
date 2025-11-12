import { useState } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Challenge {
  id: string;
  titulo: string;
  descripcion: string;
  period: string;
  challenge_type: string;
  estimated_savings: number;
  xp_reward: number;
  difficulty: string;
  completed?: boolean;
  status?: string;
}

interface PersonalizedChallengesProps {
  challenges: Challenge[];
  onRefresh: () => void;
}

const periodIcons: Record<string, any> = {
  daily: Calendar,
  weekly: TrendingUp,
  monthly: Target
};

const periodLabels: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual"
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/20 text-green-300",
  medium: "bg-yellow-500/20 text-yellow-300",
  hard: "bg-red-500/20 text-red-300"
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil"
};

export function PersonalizedChallenges({ challenges, onRefresh }: PersonalizedChallengesProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAcceptChallenge = async (challenge: Challenge) => {
    try {
      setLoading(challenge.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Insertar el reto aceptado
      const { error } = await supabase
        .from('user_daily_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          status: 'active',
          difficulty_level: challenge.difficulty,
          challenge_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast.success('¡Reto aceptado! 🎯', {
        description: 'Puedes completarlo durante el período correspondiente.'
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al aceptar el reto');
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyChallenge = async (challenge: Challenge) => {
    try {
      setLoading(challenge.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Llamar a la función de verificación
      const { data, error } = await supabase.functions.invoke('verify-challenge-auto', {
        body: { challengeId: challenge.id, userId: user.id }
      });

      if (error) throw error;

      if (data.verification.completed) {
        toast.success('¡Reto completado! 🎉', {
          description: `Ganaste ${challenge.xp_reward} XP`
        });
      } else {
        toast.info('Reto no completado todavía', {
          description: 'Sigue trabajando en ello, ¡tú puedes!'
        });
      }

      onRefresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al verificar el reto');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Retos Personalizados</h3>
      </div>

      <div className="grid gap-3">
        {challenges.map((challenge, index) => {
          const PeriodIcon = periodIcons[challenge.period] || Target;
          const isActive = challenge.status === 'active';
          const isCompleted = challenge.completed;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={isCompleted ? 'border-primary/50 bg-primary/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isCompleted ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <PeriodIcon className="w-5 h-5 text-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base mb-1">
                          {challenge.titulo}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {periodLabels[challenge.period]}
                          </Badge>
                          <Badge className={difficultyColors[challenge.difficulty]}>
                            {difficultyLabels[challenge.difficulty]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm">
                    {challenge.descripcion}
                  </CardDescription>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Ahorro estimado:
                    </span>
                    <span className="font-semibold text-primary">
                      ${challenge.estimated_savings.toLocaleString()} MXN
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Recompensa:
                    </span>
                    <span className="font-semibold text-foreground">
                      {challenge.xp_reward} XP
                    </span>
                  </div>

                  {!isCompleted && !isActive && (
                    <Button
                      onClick={() => handleAcceptChallenge(challenge)}
                      disabled={loading === challenge.id}
                      className="w-full"
                    >
                      {loading === challenge.id ? 'Aceptando...' : 'Aceptar Reto 🎯'}
                    </Button>
                  )}

                  {isActive && !isCompleted && (
                    <Button
                      onClick={() => handleVerifyChallenge(challenge)}
                      disabled={loading === challenge.id}
                      variant="outline"
                      className="w-full"
                    >
                      {loading === challenge.id ? 'Verificando...' : 'Verificar Progreso'}
                    </Button>
                  )}

                  {isCompleted && (
                    <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-center text-sm font-medium">
                      ✅ ¡Completado!
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              No hay retos personalizados disponibles aún.
            </p>
            <Button 
              onClick={onRefresh}
              variant="outline"
              className="mt-4"
            >
              Generar Retos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}