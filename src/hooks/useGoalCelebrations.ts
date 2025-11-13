import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GoalCelebration {
  id: string;
  goal_id: string;
  user_id: string;
  celebration_type: 'goal_completed' | 'milestone_reached' | 'challenge_won';
  message: string | null;
  viewers: any; // JSONB array from database
  created_at: string;
  user_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  goal?: {
    title: string;
    target: number;
  };
}

export const useGoalCelebrations = () => {
  const [celebrations, setCelebrations] = useState<GoalCelebration[]>([]);
  const [loading, setLoading] = useState(true);
  const [unviewedCount, setUnviewedCount] = useState(0);

  const fetchCelebrations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener IDs de amigos
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) {
        setCelebrations([]);
        setUnviewedCount(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('goal_celebrations')
        .select('*')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const celebrationData = data || [];
      
      // Fetch profiles and goals separately
      if (celebrationData.length > 0) {
        const userIds = celebrationData.map(c => c.user_id);
        const goalIds = celebrationData.map(c => c.goal_id);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        const { data: goals } = await supabase
          .from('goals')
          .select('id, title, target')
          .in('id', goalIds);
        
        const celebrationsData = celebrationData.map(celebration => ({
          ...celebration,
          user_profile: profiles?.find(p => p.id === celebration.user_id),
          goal: goals?.find(g => g.id === celebration.goal_id),
        })) as GoalCelebration[];
        
        setCelebrations(celebrationsData);

        // Contar celebraciones no vistas
        const unviewed = celebrationsData.filter(c => {
          const viewersArray = Array.isArray(c.viewers) ? c.viewers : [];
          return !viewersArray.includes(user.id);
        }).length;
        setUnviewedCount(unviewed);
      } else {
        setCelebrations([]);
        setUnviewedCount(0);
      }
    } catch (error) {
      console.error('Error fetching celebrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCelebration = async (
    goalId: string,
    celebrationType: 'goal_completed' | 'milestone_reached' | 'challenge_won',
    message?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('goal_celebrations')
        .insert({
          goal_id: goalId,
          user_id: user.id,
          celebration_type: celebrationType,
          message: message || null,
          viewers: [],
        });

      if (error) throw error;

      await fetchCelebrations();
      return true;
    } catch (error) {
      console.error('Error creating celebration:', error);
      return false;
    }
  };

  const markAsViewed = async (celebrationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const celebration = celebrations.find(c => c.id === celebrationId);
      if (!celebration) return;
      
      const viewersArray = Array.isArray(celebration.viewers) ? celebration.viewers : [];
      if (viewersArray.includes(user.id)) return;

      const updatedViewers = [...viewersArray, user.id];

      const { error } = await supabase
        .from('goal_celebrations')
        .update({ viewers: updatedViewers })
        .eq('id', celebrationId);

      if (error) throw error;

      setCelebrations(prev =>
        prev.map(c =>
          c.id === celebrationId ? { ...c, viewers: updatedViewers } : c
        )
      );
      setUnviewedCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking celebration as viewed:', error);
    }
  };

  useEffect(() => {
    fetchCelebrations();

    const channel = supabase
      .channel('goal-celebrations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_celebrations',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Verificar si es de un amigo
            const { data: friendships } = await supabase
              .from('friendships')
              .select('user_id, friend_id')
              .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
              .eq('status', 'accepted');

            const friendIds = friendships?.map(f =>
              f.user_id === user.id ? f.friend_id : f.user_id
            ) || [];

            if (friendIds.includes(payload.new.user_id)) {
              // Obtener perfil del amigo
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', payload.new.user_id)
                .single();

              toast.success(
                `🎉 ${profile?.full_name || 'Un amigo'} completó una meta!`,
                { duration: 5000 }
              );

              // Reproducir sonido de celebración
              const audio = new Audio('/sounds/friend-request.mp3');
              audio.volume = 0.5;
              audio.play().catch(console.error);
            }
          }
          
          fetchCelebrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    celebrations,
    loading,
    unviewedCount,
    createCelebration,
    markAsViewed,
    refetch: fetchCelebrations,
  };
};
