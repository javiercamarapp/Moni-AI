import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FriendChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  challenge_type: 'savings' | 'expenses_reduction' | 'goal_completion';
  category: string | null;
  start_date: string;
  end_date: string;
  challenger_progress: number;
  challenged_progress: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'declined';
  winner_id: string | null;
  xp_reward: number;
  created_at: string;
  challenger_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  challenged_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const useFriendChallenges = () => {
  const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friend_challenges')
        .select('*')
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const challengeData = data || [];
      if (challengeData.length > 0) {
        const userIds = [
          ...challengeData.map(c => c.challenger_id),
          ...challengeData.map(c => c.challenged_id),
        ];
        const uniqueUserIds = [...new Set(userIds)];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', uniqueUserIds);
        
        const enrichedChallenges = challengeData.map(challenge => ({
          ...challenge,
          challenger_profile: profiles?.find(p => p.id === challenge.challenger_id),
          challenged_profile: profiles?.find(p => p.id === challenge.challenged_id),
        })) as FriendChallenge[];
        
        setChallenges(enrichedChallenges);
      } else {
        setChallenges([]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Error al cargar los desafíos');
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async (challengeData: {
    challenged_id: string;
    title: string;
    description?: string;
    target_amount: number;
    challenge_type: string;
    category?: string;
    end_date: string;
    xp_reward?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return false;
      }

      const { error } = await supabase
        .from('friend_challenges')
        .insert({
          challenger_id: user.id,
          ...challengeData,
          xp_reward: challengeData.xp_reward || 50,
        });

      if (error) throw error;

      toast.success('¡Desafío enviado! 🎯');
      await fetchChallenges();
      return true;
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Error al crear el desafío');
      return false;
    }
  };

  const respondToChallenge = async (challengeId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friend_challenges')
        .update({ status: accept ? 'active' : 'declined' })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success(accept ? '¡Desafío aceptado! 💪' : 'Desafío rechazado');
      await fetchChallenges();
      return true;
    } catch (error) {
      console.error('Error responding to challenge:', error);
      toast.error('Error al responder al desafío');
      return false;
    }
  };

  const updateProgress = async (challengeId: string, progress: number, isChallenger: boolean) => {
    try {
      const field = isChallenger ? 'challenger_progress' : 'challenged_progress';
      const { error } = await supabase
        .from('friend_challenges')
        .update({ [field]: progress })
        .eq('id', challengeId);

      if (error) throw error;

      await fetchChallenges();
      return true;
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Error al actualizar el progreso');
      return false;
    }
  };

  useEffect(() => {
    fetchChallenges();

    const channel = supabase
      .channel('friend-challenges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_challenges',
        },
        () => {
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    challenges,
    loading,
    createChallenge,
    respondToChallenge,
    updateProgress,
    refetch: fetchChallenges,
  };
};
