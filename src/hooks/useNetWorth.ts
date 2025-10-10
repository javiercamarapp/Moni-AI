import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, subDays, format } from "date-fns";

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

      // Format date labels based on time range
      const formatDateLabel = (date: Date, range: TimeRange): string => {
        switch (range) {
          case '1M':
            return format(date, 'd MMM');
          case '3M':
            return format(date, 'd MMM');
          case '6M':
            return format(date, 'MMM');
          case '1Y':
            return format(date, 'MMM');
          case 'All':
            return format(date, 'MMM yy').substring(0, 6);
          default:
            return format(date, 'MMM dd');
        }
      };

      // Get today's date
      const today = format(now, 'yyyy-MM-dd');
      
      // Format snapshots for chart (only historical data, not today)
      let chartData: NetWorthSnapshot[] = snapshots?.map(s => ({
        date: formatDateLabel(new Date(s.snapshot_date), timeRange),
        value: Number(s.net_worth),
        assets: Number(s.total_assets),
        liabilities: Number(s.total_liabilities)
      })) || [];

      // If we have no historical data or only today's data, create horizontal line
      const hasHistoricalData = chartData.length > 0 && 
        snapshots?.some(s => s.snapshot_date !== today);
      
      if (!hasHistoricalData) {
        // Create horizontal line from past to today with current net worth value
        chartData = [];
        let dates: Date[] = [];
        
        switch (timeRange) {
          case '1M':
            // Every 5 days for 1 month (6 points)
            for (let i = 5; i >= 0; i--) {
              dates.push(subDays(now, i * 5));
            }
            break;
          case '3M':
            // Every 15 days for 3 months (6 points)
            for (let i = 5; i >= 0; i--) {
              dates.push(subDays(now, i * 15));
            }
            break;
          case '6M':
            // Every month for 6 months (6 points)
            for (let i = 5; i >= 0; i--) {
              dates.push(subMonths(now, i));
            }
            break;
          case '1Y':
            // Every 2 months for 1 year (6 points)
            for (let i = 5; i >= 0; i--) {
              dates.push(subMonths(now, i * 2));
            }
            break;
          case 'All':
            // Divide total time by 6 points
            for (let i = 5; i >= 0; i--) {
              dates.push(subDays(now, i * 7));
            }
            break;
        }
        
        // All points have the same value (horizontal line)
        chartData = dates.map(date => ({
          date: formatDateLabel(date, timeRange),
          value: currentNetWorth,
          assets: totalAssets,
          liabilities: totalLiabilities
        }));
      } else {
        // We have historical data - use it and add today's point
        const hasToday = snapshots?.some(s => s.snapshot_date === today);
        
        if (!hasToday) {
          chartData.push({
            date: formatDateLabel(now, timeRange),
            value: currentNetWorth,
            assets: totalAssets,
            liabilities: totalLiabilities
          });
        }
        
        // Filter data points to avoid overcrowding
        if (chartData.length > 10) {
          const step = Math.ceil(chartData.length / 6);
          const filtered: NetWorthSnapshot[] = [];
          for (let i = 0; i < chartData.length; i += step) {
            filtered.push(chartData[i]);
          }
          // Always include the last point (today)
          if (filtered[filtered.length - 1] !== chartData[chartData.length - 1]) {
            filtered.push(chartData[chartData.length - 1]);
          }
          chartData = filtered;
        }
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
