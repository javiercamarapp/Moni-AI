import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMonthlyTotals, useGoals, useGroupGoals, useScoreMoni, useNetWorth, useBankConnections, useTransactions } from './useFinancialData';

// Cache time: 5 minutes
const STALE_TIME = 5 * 60 * 1000;

export const useDashboardData = (monthOffset: number = 0) => {
  // Use los hooks existentes optimizados
  const goals = useGoals();
  const groupGoals = useGroupGoals();
  const scoreMoni = useScoreMoni();
  const netWorth = useNetWorth();
  const bankConnections = useBankConnections();
  const monthlyTotals = useMonthlyTotals(monthOffset);

  // Get recent transactions (only for current month)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const recentTransactions = useTransactions(
    monthOffset === 0 ? firstDay : undefined,
    monthOffset === 0 ? lastDay : undefined
  );

  return {
    goals: goals.data || [],
    isLoadingGoals: goals.isLoading,

    groupGoals: groupGoals.data || [],
    isLoadingGroupGoals: groupGoals.isLoading,

    scoreMoni: scoreMoni.data || 40,
    isLoadingScore: scoreMoni.isLoading,

    netWorth: netWorth.data || 0,
    isLoadingNetWorth: netWorth.isLoading,

    hasBankConnections: (bankConnections.data?.length || 0) > 0,
    bankConnections: bankConnections.data || [],
    isLoadingBankConnections: bankConnections.isLoading,

    monthlyIncome: monthlyTotals.data?.income || 0,
    monthlyExpenses: monthlyTotals.data?.expenses || 0,
    fixedExpenses: monthlyTotals.data?.fixed || 0,
    isLoadingMonthly: monthlyTotals.isLoading,

    recentTransactions: monthOffset === 0 ? (recentTransactions.data || []).slice(0, 20) : [],
    isLoadingTransactions: recentTransactions.isLoading,

    isLoading: goals.isLoading || groupGoals.isLoading || scoreMoni.isLoading || netWorth.isLoading ||
      bankConnections.isLoading || monthlyTotals.isLoading || recentTransactions.isLoading,
  };
};
