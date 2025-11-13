import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, TrendingUp, Sparkles } from 'lucide-react';
import { useGoalCelebrations } from '@/hooks/useGoalCelebrations';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

export const FriendCelebrations = () => {
  const { celebrations, loading, markAsViewed, unviewedCount } = useGoalCelebrations();

  const celebrationTypeConfig = {
    goal_completed: { icon: Trophy, label: '¡Meta Completada!', color: 'text-yellow-500' },
    milestone_reached: { icon: Target, label: 'Hito Alcanzado', color: 'text-blue-500' },
    challenge_won: { icon: TrendingUp, label: 'Desafío Ganado', color: 'text-green-500' },
  };

  useEffect(() => {
    // Marcar como vistas las celebraciones visibles después de 2 segundos
    const timer = setTimeout(() => {
      celebrations.slice(0, 5).forEach(c => markAsViewed(c.id));
    }, 2000);

    return () => clearTimeout(timer);
  }, [celebrations]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Celebraciones de Amigos</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (celebrations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          Aún no hay celebraciones de tus amigos
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ¡Cuando tus amigos completen metas, las verás aquí!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Celebraciones de Amigos</h2>
        </div>
        {unviewedCount > 0 && (
          <Badge variant="default" className="animate-pulse">
            {unviewedCount} nuevas
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {celebrations.map((celebration, index) => {
          const config = celebrationTypeConfig[celebration.celebration_type];
          const Icon = config.icon;

          return (
            <motion.div
              key={celebration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={celebration.user_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {celebration.user_profile?.full_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {celebration.user_profile?.full_name || 'Amigo'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-sm font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(celebration.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>

                    {celebration.goal && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">{celebration.goal.title}</span>
                        {celebration.celebration_type === 'goal_completed' && (
                          <> - ${celebration.goal.target.toLocaleString()}</>
                        )}
                      </p>
                    )}

                    {celebration.message && (
                      <p className="text-sm text-foreground mt-2 italic">
                        "{celebration.message}"
                      </p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <span className="text-2xl">🎉</span>
                      <span className="text-2xl">🎊</span>
                      <span className="text-2xl">✨</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
