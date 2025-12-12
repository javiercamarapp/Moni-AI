import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetWorth } from '@/hooks/useNetWorth';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardHeroSectionProps {
  scoreMoni: number;
}

const DashboardHeroSection: React.FC<DashboardHeroSectionProps> = ({ scoreMoni }) => {
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
    <div className="px-4 pb-8">
      {/* Cards container */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {/* Score Moni Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => navigate('/score-moni')}
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Score Moni
            </span>
            
            {/* Semi-circle gauge */}
            <div className="relative flex items-center justify-center mt-2 mb-1">
              <svg className="w-24 h-14" viewBox="0 0 100 55">
                {/* Background track */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={status.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(gaugeAngle / 180) * 125.6} 125.6`}
                />
              </svg>
              {/* Score number */}
              <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-900">{safeScore}</span>
              </div>
            </div>
            
            <div className="text-center">
              <span 
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${status.color}15`, 
                  color: status.color 
                }}
              >
                {status.label}
              </span>
            </div>
          </div>

          {/* Net Worth Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => navigate('/net-worth')}
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Patrimonio
            </span>
            
            {isLoading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="mt-1">
                  <span className="text-xl font-bold text-gray-900">
                    {formatFullCurrency(netWorthData?.currentNetWorth || 0)}
                  </span>
                </div>
                
                {/* Change indicator */}
                <div className="flex items-center gap-1 mt-0.5">
                  {percentageChange > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : percentageChange < 0 ? (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  ) : (
                    <Minus className="w-3 h-3 text-gray-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    percentageChange > 0 ? 'text-green-600' : 
                    percentageChange < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {changeValue >= 0 ? '+' : ''}{formatCurrency(changeValue)} ({percentageChange.toFixed(1)}%)
                  </span>
                </div>
                
                {/* Mini chart */}
                <div className="h-10 mt-1">
                  {netWorthData?.chartData && netWorthData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={netWorthData.chartData}>
                        <defs>
                          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8D6E63" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8D6E63" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-lg text-xs">
                                  <p className="text-gray-700">{formatFullCurrency(payload[0].value as number)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8D6E63"
                          strokeWidth={2}
                          fill="url(#netWorthGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs text-gray-400">Sin datos</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
};

export default DashboardHeroSection;
