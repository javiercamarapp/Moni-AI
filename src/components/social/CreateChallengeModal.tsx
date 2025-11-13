import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFriendChallenges } from '@/hooks/useFriendChallenges';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trophy, TrendingDown, Target } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CreateChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendId: string;
  friendName: string;
}

export const CreateChallengeModal = ({
  open,
  onOpenChange,
  friendId,
  friendName,
}: CreateChallengeModalProps) => {
  const { createChallenge } = useFriendChallenges();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [challengeType, setChallengeType] = useState<'savings' | 'expenses_reduction' | 'goal_completion'>('savings');
  const [category, setCategory] = useState('');
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);

  const challengeTypes = {
    savings: { label: 'Ahorro', icon: Trophy, color: 'text-green-500' },
    expenses_reduction: { label: 'Reducción de Gastos', icon: TrendingDown, color: 'text-blue-500' },
    goal_completion: { label: 'Meta Específica', icon: Target, color: 'text-purple-500' },
  };

  const handleSubmit = async () => {
    if (!title || !targetAmount || !endDate) return;

    setLoading(true);
    const success = await createChallenge({
      challenged_id: friendId,
      title,
      description: description || undefined,
      target_amount: parseFloat(targetAmount),
      challenge_type: challengeType,
      category: category || undefined,
      end_date: format(endDate, 'yyyy-MM-dd'),
      xp_reward: 100,
    });

    setLoading(false);
    if (success) {
      setTitle('');
      setDescription('');
      setTargetAmount('');
      setCategory('');
      setEndDate(undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Retar a {friendName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título del Desafío</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: ¿Quién ahorra más en un mes?"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Desafío</Label>
            <Select value={challengeType} onValueChange={(v: any) => setChallengeType(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(challengeTypes).map(([key, { label, icon: Icon, color }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target">Meta de {challengeType === 'expenses_reduction' ? 'Reducción' : 'Ahorro'}</Label>
            <Input
              id="target"
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="$0.00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría (Opcional)</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Entretenimiento, Comida, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Fecha Límite</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal mt-1"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade detalles sobre el desafío..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title || !targetAmount || !endDate || loading}
              className="flex-1"
            >
              {loading ? 'Enviando...' : 'Enviar Desafío'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
