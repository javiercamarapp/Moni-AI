import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Target, TrendingDown, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { FriendChallenge, useFriendChallenges } from '@/hooks/useFriendChallenges';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface FriendChallengeCardProps {
  challenge: FriendChallenge;
  currentUserId: string;
}

export const FriendChallengeCard = ({ challenge, currentUserId }: FriendChallengeCardProps) => {
  const { respondToChallenge, updateProgress } = useFriendChallenges();
  const [responding, setResponding] = useState(false);

  const isChallenger = challenge.challenger_id === currentUserId;
  const isChallenged = challenge.challenged_id === currentUserId;
  const isPending = challenge.status === 'pending';
  const isActive = challenge.status === 'active';
  const isCompleted = challenge.status === 'completed';

  const myProgress = isChallenger ? challenge.challenger_progress : challenge.challenged_progress;
  const opponentProgress = isChallenger ? challenge.challenged_progress : challenge.challenger_progress;
  const myProfile = isChallenger ? challenge.challenger_profile : challenge.challenged_profile;
  const opponentProfile = isChallenger ? challenge.challenged_profile : challenge.challenger_profile;

  const myProgressPercent = (myProgress / challenge.target_amount) * 100;
  const opponentProgressPercent = (opponentProgress / challenge.target_amount) * 100;

  const daysRemaining = differenceInDays(new Date(challenge.end_date), new Date());

  const challengeTypeConfig = {
    savings: { icon: Trophy, label: 'Ahorro', color: 'bg-green-500' },
    expenses_reduction: { icon: TrendingDown, label: 'Reducción', color: 'bg-blue-500' },
    goal_completion: { icon: Target, label: 'Meta', color: 'bg-purple-500' },
  };

  const config = challengeTypeConfig[challenge.challenge_type];
  const Icon = config.icon;

  const handleRespond = async (accept: boolean) => {
    setResponding(true);
    await respondToChallenge(challenge.id, accept);
    setResponding(false);
  };

  const getStatusBadge = () => {
    if (isPending) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Activo
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          <Trophy className="w-3 h-3 mr-1" />
          Completado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
        <XCircle className="w-3 h-3 mr-1" />
        Cancelado
      </Badge>
    );
  };

  return (
    <Card className="p-5 border-border/40 hover:border-border/60 transition-all">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground">{challenge.title}</h3>
              <p className="text-sm text-muted-foreground/70 mt-0.5">
                {config.label} · ${challenge.target_amount.toLocaleString()}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Description */}
        {challenge.description && (
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        )}

        {/* Date and Days Remaining */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(challenge.end_date), 'PPP', { locale: es })}
          </div>
          {isActive && daysRemaining > 0 && (
            <Badge variant="secondary" className="text-xs">
              {daysRemaining} días restantes
            </Badge>
          )}
        </div>

        {/* Progress Section */}
        {(isActive || isCompleted) && (
          <div className="space-y-3">
            {/* My Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={myProfile?.avatar_url || undefined} />
                    <AvatarFallback>{myProfile?.full_name?.[0] || 'T'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">Tú</span>
                </div>
                <span className="font-semibold">
                  ${myProgress.toLocaleString()} ({myProgressPercent.toFixed(0)}%)
                </span>
              </div>
              <Progress value={myProgressPercent} className="h-2" />
            </div>

            {/* Opponent Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={opponentProfile?.avatar_url || undefined} />
                    <AvatarFallback>{opponentProfile?.full_name?.[0] || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{opponentProfile?.full_name || 'Amigo'}</span>
                </div>
                <span className="font-semibold">
                  ${opponentProgress.toLocaleString()} ({opponentProgressPercent.toFixed(0)}%)
                </span>
              </div>
              <Progress value={opponentProgressPercent} className="h-2" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isPending && isChallenged && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleRespond(true)}
              disabled={responding}
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aceptar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRespond(false)}
              disabled={responding}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rechazar
            </Button>
          </div>
        )}

        {isCompleted && challenge.winner_id && (
          <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">
              {challenge.winner_id === currentUserId ? '¡Ganaste!' : `${opponentProfile?.full_name || 'Tu amigo'} ganó`}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
