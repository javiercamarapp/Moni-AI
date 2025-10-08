import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, startOfMonth } from "date-fns";

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'All';

interface Asset {
  id: string;
  name: string;
  value: number;
  category: string;
}

interface Liability {
  id: string;
  name: string;
  value: number;
  category: string;
}

interface NetWorthSnapshot {
  date: string;
  value: number;
  assets: number;
  liabilities: number;
}

export function useNetWorth(timeRange: TimeRange) {
  return useQuery({
    queryKey: ['net-worth', timeRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get date range based on timeRange
      let startDate: Date;
      const now = new Date();
      
      switch (timeRange) {
        case '1M':
          startDate = subMonths(now, 1);
          break;
        case '3M':
          startDate = subMonths(now, 3);
          break;
        case '6M':
          startDate = subMonths(now, 6);
          break;
        case '1Y':
          startDate = subMonths(now, 12);
          break;
        case 'All':
          startDate = new Date(2020, 0, 1); // Far back date
          break;
      }

      // Fetch snapshots
      const { data: snapshots, error: snapshotError } = await supabase
        .from('net_worth_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .gte('snapshot_date', format(startDate, 'yyyy-MM-dd'))
        .order('snapshot_date', { ascending: true });

      if (snapshotError) throw snapshotError;

      // Fetch current assets
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id);

      if (assetsError) throw assetsError;

      // Fetch current liabilities
      const { data: liabilities, error: liabilitiesError } = await supabase
        .from('liabilities')
        .select('*')
        .eq('user_id', user.id);

      if (liabilitiesError) throw liabilitiesError;

      // Calculate current totals
      const totalAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0;
      const totalLiabilities = liabilities?.reduce((sum, l) => sum + Number(l.value), 0) || 0;
      const currentNetWorth = totalAssets - totalLiabilities;

      // Format snapshots for chart
      const chartData: NetWorthSnapshot[] = snapshots?.map(s => ({
        date: format(new Date(s.snapshot_date), 'MMM dd'),
        value: Number(s.net_worth),
        assets: Number(s.total_assets),
        liabilities: Number(s.total_liabilities)
      })) || [];

      // Add current data point if not already in snapshots
      const today = format(now, 'yyyy-MM-dd');
      const hasToday = snapshots?.some(s => s.snapshot_date === today);
      
      if (!hasToday) {
        chartData.push({
          date: format(now, 'MMM dd'),
          value: currentNetWorth,
          assets: totalAssets,
          liabilities: totalLiabilities
        });
      }

      // Calculate percentage change
      let percentageChange = 0;
      if (chartData.length >= 2) {
        const firstValue = chartData[0].value;
        const lastValue = chartData[chartData.length - 1].value;
        percentageChange = firstValue !== 0 
          ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 
          : 0;
      }

      return {
        currentNetWorth,
        totalAssets,
        totalLiabilities,
        assets: assets || [],
        liabilities: liabilities || [],
        chartData,
        percentageChange,
        highPoint: Math.max(...chartData.map(d => d.value)),
        lowPoint: Math.min(...chartData.map(d => d.value))
      };
    }
  });
}

export function useHasNetWorthData() {
  return useQuery({
    queryKey: ['has-net-worth-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: assets } = await supabase
        .from('assets')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const { data: liabilities } = await supabase
        .from('liabilities')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      return (assets && assets.length > 0) || (liabilities && liabilities.length > 0);
    }
  });
}
