import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePendingFriendRequests = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPendingCount(0);
        return;
      }

      const { data, error } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Setup realtime subscription
    const channel = supabase
      .channel('pending-requests-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships'
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pendingCount, isLoading, refetch: fetchPendingCount };
};
