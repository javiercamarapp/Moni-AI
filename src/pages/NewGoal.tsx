import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Target, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

const NewGoal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isGroupGoal, setIsGroupGoal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isGroupGoal) {
      fetchFriends();
    }
  }, [isGroupGoal]);

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('friend_id, user_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Extract friend IDs
      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      // Get friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      setFriends(profiles || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus amigos",
        variant: "destructive",
      });
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isGroupGoal && selectedFriends.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un amigo para una meta grupal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para crear una meta",
          variant: "destructive",
        });
        return;
      }

      const { data: goal, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          target: parseFloat(target),
          current: 0,
          deadline,
          type: isGroupGoal ? 'group' : 'personal',
          color: 'primary',
          members: isGroupGoal ? selectedFriends.length + 1 : null,
        })
        .select()
        .single();

      if (error) throw error;

      // If group goal, send invitations to friends
      if (isGroupGoal && goal) {
        // Here you could create a goal_invitations table or send notifications
        // For now, we'll just create activity entries
        const activityPromises = selectedFriends.map(friendId =>
          supabase.from('friend_activity').insert({
            user_id: user.id,
            activity_type: 'goal_invite',
            description: `te invitó a la meta "${title}"`,
            xp_earned: 0,
          })
        );

        await Promise.all(activityPromises);
      }

      toast({
        title: "Meta creada",
        description: isGroupGoal 
          ? `Tu nueva meta grupal ha sido creada e invitaciones enviadas a ${selectedFriends.length} amigos`
          : "Tu nueva meta ha sido creada exitosamente",
      });
      
      navigate('/goals');
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la meta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Nueva Meta</h1>
          <p className="text-xs text-muted-foreground">Crea una meta de ahorro</p>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 max-w-2xl mx-auto">
        <Card className="p-6 bg-gradient-card card-glow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Define tu meta</h2>
              <p className="text-sm text-white/70">Completa los detalles</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                ¿Para qué estás ahorrando?
              </Label>
              <Input
                id="title"
                placeholder="Ej: Viaje a Europa, Nueva laptop, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target" className="text-white">
                ¿Cuánto necesitas ahorrar?
              </Label>
              <Input
                id="target"
                type="number"
                placeholder="$0.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-white">
                ¿Para cuándo?
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              />
            </div>

            {/* Type of goal */}
            <div className="space-y-3">
              <Label className="text-white">Tipo de meta</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="group-goal"
                  checked={isGroupGoal}
                  onCheckedChange={(checked) => setIsGroupGoal(checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                />
                <label
                  htmlFor="group-goal"
                  className="text-sm text-white/90 cursor-pointer flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Meta grupal (invita a tus amigos)
                </label>
              </div>
            </div>

            {/* Friends list for group goals */}
            {isGroupGoal && (
              <div className="space-y-3 pt-2">
                <Label className="text-white">Invita a tus amigos</Label>
                {friends.length === 0 ? (
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-white/70 text-sm">
                      No tienes amigos agregados aún.{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/add-friend')}
                        className="text-white underline hover:text-white/80"
                      >
                        Agregar amigos
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/10 rounded-xl p-3 space-y-2 max-h-60 overflow-y-auto">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Checkbox
                          id={`friend-${friend.id}`}
                          checked={selectedFriends.includes(friend.id)}
                          onCheckedChange={() => toggleFriend(friend.id)}
                          className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                        />
                        <label
                          htmlFor={`friend-${friend.id}`}
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.avatar_url || ''} />
                            <AvatarFallback className="bg-white/20 text-white text-xs">
                              {friend.username?.[0]?.toUpperCase() || friend.full_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">
                              {friend.full_name || friend.username}
                            </p>
                            {friend.username && friend.full_name && (
                              <p className="text-white/60 text-xs">@{friend.username}</p>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedFriends.length > 0 && (
                  <p className="text-white/70 text-xs">
                    {selectedFriends.length} {selectedFriends.length === 1 ? 'amigo seleccionado' : 'amigos seleccionados'}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white disabled:opacity-50"
              >
                {loading ? 'Creando...' : isGroupGoal ? 'Crear Meta Grupal' : 'Crear Meta'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewGoal;
