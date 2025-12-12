import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getCache,
  setCache,
  invalidateAllCache as clearAllCache,
  CACHE_KEYS,
  CACHE_TTL
} from '@/lib/cacheService';

// Cache stale time: 5 minutes (React Query in-memory)
const STALE_TIME = 5 * 60 * 1000;

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  transaction_date: string;
  category_id: string | null;
  account: string | null;
  payment_method: string | null;
  frequency: string | null;
  created_at: string;
  updated_at: string;
  categories: { name: string; color: string } | null;
}

export const useTransactions = (startDate?: Date, endDate?: Date) => {
  const cacheKey = startDate && endDate
    ? `${CACHE_KEYS.TRANSACTIONS}_${startDate.getMonth()}_${startDate.getFullYear()}`
    : CACHE_KEYS.TRANSACTIONS;

  return useQuery<Transaction[]>({
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

      // Update localStorage cache
      setCache(cacheKey, data || [], CACHE_TTL.TRANSACTIONS);

      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: 10 * 60 * 1000,
    initialData: () => getCache<Transaction[]>(cacheKey) ?? undefined,
  });
};

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  target: number;
  current: number;
  deadline?: string | null;
  color: string;
  icon?: string | null;
  type: string;
  category?: string | null;
  is_public?: boolean | null;
  members?: number | null;
  start_date?: string | null;
  ai_confidence?: number | null;
  predicted_completion_date?: string | null;
  required_weekly_saving?: number | null;
  required_daily_saving?: number | null;
  last_contribution_date?: string | null;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  return useQuery<Goal[]>({
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

      // Update localStorage cache
      setCache(CACHE_KEYS.GOALS, data || [], CACHE_TTL.DEFAULT);

      return data || [];
    },
    staleTime: STALE_TIME,
    initialData: () => getCache<Goal[]>(CACHE_KEYS.GOALS) ?? undefined,
  });
};

export interface GroupGoal {
  id: string;
  circle_id: string;
  title: string;
  description?: string | null;
  target_amount: number;
  deadline?: string | null;
  icon?: string | null;
  category?: string | null;
  is_public?: boolean | null;
  completed_members: number;
  start_date?: string | null;
  ai_confidence?: number | null;
  predicted_completion_date?: string | null;
  required_weekly_saving?: number | null;
  created_at: string;
  user_progress?: {
    id: string;
    goal_id: string;
    user_id: string;
    current_amount: number;
    completed: boolean;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export const useGroupGoals = () => {
  return useQuery<GroupGoal[]>({
    queryKey: ['groupGoals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get user's circle memberships
      const { data: memberships, error: memberError } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;
      if (!memberships || memberships.length === 0) return [];

      const circleIds = memberships.map(m => m.circle_id);

      // Get circle goals
      const { data: goals, error: goalsError } = await supabase
        .from('circle_goals')
        .select('*')
        .in('circle_id', circleIds);

      if (goalsError) throw goalsError;
      if (!goals || goals.length === 0) return [];

      // Get user's progress for these goals
      const goalIds = goals.map(g => g.id);
      const { data: progress, error: progressError } = await supabase
        .from('circle_goal_members')
        .select('*')
        .in('goal_id', goalIds)
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Combine goals with user's progress
      return goals.map(goal => ({
        ...goal,
        user_progress: progress?.find(p => p.goal_id === goal.id) || null
      })) as GroupGoal[];
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
      const score = data?.score_moni || 40;

      // Update both legacy localStorage and new cache
      localStorage.setItem('scoreMoni', score.toString());
      setCache(CACHE_KEYS.SCORE_MONI, score, CACHE_TTL.DEFAULT);

      return score;
    },
    staleTime: STALE_TIME,
    initialData: () => {
      // Try new cache first, then legacy
      const cached = getCache<number>(CACHE_KEYS.SCORE_MONI);
      if (cached !== null) return cached;

      const legacy = localStorage.getItem('scoreMoni');
      return legacy ? Number(legacy) : undefined;
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
      const [{ data: assetsData, error: assetsError }, { data: liabilitiesData, error: liabilitiesError }] = await Promise.all([
        supabase.from('assets').select('value').eq('user_id', user.id),
        supabase.from('liabilities').select('value').eq('user_id', user.id),
      ]);

      if (assetsError) {
        console.error('Error fetching assets:', assetsError);
      }
      if (liabilitiesError) {
        console.error('Error fetching liabilities:', liabilitiesError);
      }

      const totalAssets = assetsData?.reduce((sum, a) => sum + Number(a.value), 0) || 0;
      const totalLiabilities = liabilitiesData?.reduce((sum, l) => sum + Number(l.value), 0) || 0;

      const netWorth = totalAssets - totalLiabilities;

      // Update localStorage cache
      setCache(CACHE_KEYS.NET_WORTH, netWorth, CACHE_TTL.DEFAULT);

      return netWorth;
    },
    staleTime: STALE_TIME,
    initialData: () => getCache<number>(CACHE_KEYS.NET_WORTH),
  });
};

interface BankConnection {
  id: string;
  bank_name: string;
  account_id: string;
  access_token: string;
  is_active: boolean | null;
  last_sync: string | null;
  plaid_item_id: string | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export const useBankConnections = () => {
  return useQuery<BankConnection[]>({
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

      // Update localStorage cache
      setCache(CACHE_KEYS.BANK_CONNECTIONS, data || [], CACHE_TTL.DEFAULT);

      return data || [];
    },
    staleTime: STALE_TIME,
    initialData: () => getCache<BankConnection[]>(CACHE_KEYS.BANK_CONNECTIONS) ?? undefined,
  });
};

interface MonthlyTotals {
  income: number;
  expenses: number;
  fixed: number;
}

export const useMonthlyTotals = (monthOffset: number = 0) => {
  const cacheKey = `${CACHE_KEYS.MONTHLY_TOTALS}_${monthOffset}`;

  return useQuery<MonthlyTotals>({
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
        '22cecde3-c7c8-437e-9b9d-d73bc7f3bdfe',
        'c88f9517-ba61-4420-bc49-ba6261c37e9c',
        '4675137c-d5b5-4679-b308-6259762ea100',
        'c4d8514f-54be-4fba-8300-b18164d78790',
        '77bc7935-51b3-418b-9945-7028c27d47ec',
        '8544dcaa-4114-4893-aa38-c4372c46a821',
        'eba3ecce-a824-41d3-8209-175902e66cb9',
        '94c263d1-aed5-4399-b5af-da3dfe758b58',
        'd81abe12-0879-49bc-9d94-ebf7c3e9e315',
        'd9251ee1-749f-4cc7-94a2-ceb19a16fd8c',
        'e50cbb0b-6f45-4afd-bf09-218e413a3086'
      ];

      const fixed = transactions
        .filter(t => t.type === 'gasto' && (
          fixedExpensesCategories.includes(t.category_id) ||
          t.description?.toLowerCase().includes('renta')
        ))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const result = { income, expenses, fixed };

      // Update localStorage cache
      setCache(cacheKey, result, CACHE_TTL.MONTHLY_DATA);

      return result;
    },
    staleTime: STALE_TIME,
    initialData: () => getCache<MonthlyTotals>(cacheKey) ?? undefined,
  });
};

interface AccountItem {
  id: string;
  bank_name: string;
  account_name: string;
  balance: number;
  type: 'asset' | 'liability';
}

export const useAccountsList = () => {
  return useQuery<AccountItem[]>({
    queryKey: ['accountsList'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const [{ data: assets, error: assetsError }, { data: liabilities, error: liabilitiesError }] = await Promise.all([
        supabase.from('assets').select('*').eq('user_id', user.id),
        supabase.from('liabilities').select('*').eq('user_id', user.id),
      ]);

      if (assetsError) throw assetsError;
      if (liabilitiesError) throw liabilitiesError;

      // Helper to determine if item is a card or bank account
      const isCardOrBank = (name: string = '', category: string = '') => {
        const text = `${name} ${category}`.toLowerCase();

        const excluded = [
          'efectivo', 'cash', 'wallet', 'billetera',
          'inversión', 'investment', 'bolsa', 'crypto', 'gbh', 'cet',
          'hipoteca', 'mortgage', 'casa', 'propiedad',
          'préstamo', 'loan', 'crédito personal', 'automotriz', 'auto'
        ];

        if (excluded.some(term => text.includes(term))) return false;

        const included = [
          'tarjeta', 'card', 'tdc',
          'banco', 'bank',
          'ahorro', 'savings',
          'cheques', 'checking', 'corriente',
          'nómina', 'nomina',
          'débito', 'debit',
          'crédito', 'credit',
          'cuenta'
        ];

        return included.some(term => text.includes(term));
      };

      const assetAccounts: AccountItem[] = (assets || [])
        .filter(a => isCardOrBank(a.name, a.category))
        .map(a => ({
          id: a.id,
          bank_name: a.category || 'Banco',
          account_name: a.name,
          balance: Number(a.value),
          type: 'asset' as const,
        }));

      const liabilityAccounts: AccountItem[] = (liabilities || [])
        .filter(l => isCardOrBank(l.name, l.category))
        .map(l => ({
          id: l.id,
          bank_name: l.category || 'Banco',
          account_name: l.name,
          balance: Number(l.value),
          type: 'liability' as const,
        }));

      const result = [...assetAccounts, ...liabilityAccounts];

      // Update localStorage cache
      setCache(CACHE_KEYS.ACCOUNTS_LIST, result, CACHE_TTL.DEFAULT);

      return result;
    },
    staleTime: STALE_TIME,
    initialData: () => getCache<AccountItem[]>(CACHE_KEYS.ACCOUNTS_LIST) ?? undefined,
  });
};

// Hook to invalidate all financial queries AND localStorage cache
export const useInvalidateFinancialData = () => {
  const queryClient = useQueryClient();

  return () => {
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['scoreMoni'] });
    queryClient.invalidateQueries({ queryKey: ['netWorth'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyTotals'] });
    queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
    queryClient.invalidateQueries({ queryKey: ['accountsList'] });

    // Also invalidate localStorage cache
    clearAllCache();

    console.log('All financial data caches invalidated');
  };
};
