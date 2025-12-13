import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetWorth } from '@/hooks/useNetWorth';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardHeroSectionProps {
  scoreMoni: number;
  isLoadingScore?: boolean;
}

const DashboardHeroSection: React.FC<DashboardHeroSectionProps> = ({ scoreMoni, isLoadingScore = false }) => {
  const navigate = useNavigate();
  const { data: netWorthData, isLoading } = useNetWorth('6M');

  // Score gauge configuration
  const safeScore = Math.min(100, Math.max(0, scoreMoni || 0));
  const gaugeAngle = (safeScore / 100) * 180; // 180 degrees for half circle

  const getScoreStatus = (s: number) => {
    if (s >= 80) return { label: "Excelente", color: "#10b981" };
    if (s >= 60) return { label: "Bueno", color: "#3b82f6" };
    if (s >= 40) return { label: "Regular", color: "#eab308" };
    return { label: "Mejorable", color: "#ef4444" };
  };

  const status = getScoreStatus(safeScore);

  // Format currency
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString('es-MX')}`;
  };

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const percentageChange = netWorthData?.percentageChange || 0;
  const changeValue = netWorthData?.chartData && netWorthData.chartData.length >= 2
    ? netWorthData.chartData[netWorthData.chartData.length - 1].value - netWorthData.chartData[0].value
    : 0;

  return (
    <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-md md:max-w-3xl lg:max-w-4xl mx-auto">
      {/* Score Moni Card - slightly wider */}
      <div
        className="col-span-2 bg-white/95 backdrop-blur-sm rounded-2xl p-3 lg:p-5 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
        onClick={() => navigate('/score-moni')}
      >
        <span className="text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Score Moni
        </span>

        {isLoadingScore ? (
          // Loading skeleton - all gray
          <div className="relative flex items-center justify-center mt-1 mb-0.5">
            <svg className="w-20 h-12 lg:w-28 lg:h-16" viewBox="0 0 100 55">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute bottom-0 flex flex-col items-center">
              <Skeleton className="h-5 w-8 lg:h-7 lg:w-10" />
            </div>
          </div>
        ) : (
          <>
            {/* Semi-circle gauge */}
            <div className="relative flex items-center justify-center mt-1 mb-0.5">
              <svg className="w-20 h-12 lg:w-28 lg:h-16" viewBox="0 0 100 55">
                {/* Background track */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={status.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(gaugeAngle / 180) * 125.6} 125.6`}
                />
              </svg>
              {/* Score number */}
              <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-lg lg:text-2xl font-bold text-gray-900">{safeScore}</span>
              </div>
            </div>

            <div className="text-center">
              <span
                className="text-[9px] lg:text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${status.color}15`,
                  color: status.color
                }}
              >
                {status.label}
              </span>
            </div>
          </>
        )}

        {isLoadingScore && (
          <div className="text-center mt-1">
            <Skeleton className="h-4 w-16 mx-auto rounded-full" />
          </div>
        )}
      </div>

      {/* Net Worth Card */}
      <div
        className="col-span-3 md:col-span-6 lg:col-span-8 bg-white/95 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
        onClick={() => navigate('/net-worth')}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Patrimonio
          </span>
          {/* Change indicator */}
          <div className="flex items-center gap-1">
            {percentageChange > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : percentageChange < 0 ? (
              <TrendingDown className="w-3 h-3 text-red-600" />
            ) : (
              <Minus className="w-3 h-3 text-gray-500" />
            )}
            <span className={`text-[10px] font-medium ${percentageChange > 0 ? 'text-green-600' :
                percentageChange < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
              {percentageChange.toFixed(1)}%
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="flex-1 w-full" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col w-full">
            <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 text-center w-full">
              {formatFullCurrency(netWorthData?.currentNetWorth || 0)}
            </span>

            {/* Chart - takes remaining space */}
            <div className="w-full flex-1 min-h-[48px] md:min-h-[80px] lg:min-h-[100px]">
              {netWorthData?.chartData && netWorthData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthData.chartData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8D6E63" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8D6E63" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      interval="preserveStartEnd"
                      tickFormatter={(value) => {
                        // Show only month abbreviation (first 3 chars)
                        return value;
                      }}
                      ticks={(() => {
                        const data = netWorthData?.chartData || [];
                        if (data.length === 0) return [];
                        // Get unique months - show only first occurrence of each month
                        const seenMonths = new Set<string>();
                        return data
                          .filter(d => {
                            const month = d.date.split(' ')[0]; // Get month part (e.g., "Dic")
                            if (seenMonths.has(month)) return false;
                            seenMonths.add(month);
                            return true;
                          })
                          .map(d => d.date);
                      })()}
                      hide={typeof window !== 'undefined' && window.innerWidth < 768}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      width={40}
                      hide={typeof window !== 'undefined' && window.innerWidth < 768}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8D6E63"
                      strokeWidth={1.5}
                      fill="url(#netWorthGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-[10px] text-gray-400">Sin datos</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeroSection;
