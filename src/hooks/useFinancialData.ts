import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Cache stale time: 5 minutes
const STALE_TIME = 5 * 60 * 1000;

export const useTransactions = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['transactions', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      let query = supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (startDate && endDate) {
        query = query
          .gte('transaction_date', startDate.toISOString().split('T')[0])
          .lte('transaction_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
  });
};

export const useScoreMoni = () => {
  return useQuery({
    queryKey: ['scoreMoni'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('user_scores')
        .select('score_moni')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.score_moni || 40;
    },
    staleTime: STALE_TIME,
    initialData: () => {
      const cached = localStorage.getItem('scoreMoni');
      return cached ? Number(cached) : undefined;
    },
  });
};

export const useNetWorth = () => {
  return useQuery({
    queryKey: ['netWorth'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Fetch both assets and liabilities in parallel
      const [{ data: assetsData }, { data: liabilitiesData }] = await Promise.all([
        supabase.from('assets').select('value').eq('user_id', user.id),
        supabase.from('liabilities').select('value').eq('user_id', user.id),
      ]);

      const totalAssets = assetsData?.reduce((sum, a) => sum + Number(a.value), 0) || 0;
      const totalLiabilities = liabilitiesData?.reduce((sum, l) => sum + Number(l.value), 0) || 0;
      
      return totalAssets - totalLiabilities;
    },
    staleTime: STALE_TIME,
  });
};

export const useBankConnections = () => {
  return useQuery({
    queryKey: ['bankConnections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
  });
};

export const useMonthlyTotals = (monthOffset: number = 0) => {
  return useQuery({
    queryKey: ['monthlyTotals', monthOffset],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, category_id, description')
        .eq('user_id', user.id)
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      if (error) throw error;

      const transactions = data || [];
      const income = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + Number(t.amount), 0);

      // Fixed expenses categories
      const fixedExpensesCategories = [
        '22cecde3-c7c8-437e-9b9d-d73bc7f3bdfe', // Luz
        'c88f9517-ba61-4420-bc49-ba6261c37e9c', // Agua
        '4675137c-d5b5-4679-b308-6259762ea100', // Internet
        'c4d8514f-54be-4fba-8300-b18164d78790', // Teléfono
        '77bc7935-51b3-418b-9945-7028c27d47ec', // Gas
        '8544dcaa-4114-4893-aa38-c4372c46a821', // Netflix
        'eba3ecce-a824-41d3-8209-175902e66cb9', // Spotify
        '94c263d1-aed5-4399-b5af-da3dfe758b58', // Amazon Prime
        'd81abe12-0879-49bc-9d94-ebf7c3e9e315', // Disney+
        'd9251ee1-749f-4cc7-94a2-ceb19a16fd8c', // HBO Max
        'e50cbb0b-6f45-4afd-bf09-218e413a3086' // Gym
      ];

      const fixed = transactions
        .filter(t => t.type === 'gasto' && (
          fixedExpensesCategories.includes(t.category_id) || 
          t.description?.toLowerCase().includes('renta')
        ))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return { income, expenses, fixed };
    },
    staleTime: STALE_TIME,
  });
};

// Hook to invalidate all financial queries
export const useInvalidateFinancialData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['scoreMoni'] });
    queryClient.invalidateQueries({ queryKey: ['netWorth'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyTotals'] });
    queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
  };
};
