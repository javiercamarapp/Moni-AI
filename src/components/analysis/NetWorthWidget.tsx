import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Shield, TrendingDown } from "lucide-react";
import { useNetWorth, TimeRange } from "@/hooks/useNetWorth";
import { cn } from "@/lib/utils";

export default function NetWorthWidget() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const { data: netWorthData, isLoading } = useNetWorth(timeRange);

  if (!netWorthData) {
    return (
      <div className="min-h-screen animated-wave-bg px-4 py-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-32 bg-white/5 rounded"></div>
          <div className="h-[400px] bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  const { currentNetWorth, totalAssets, totalLiabilities, chartData, percentageChange, highPoint, lowPoint } = netWorthData;
  const isPositive = currentNetWorth >= 0;
  const isPositiveChange = percentageChange >= 0;

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/90 flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4" /> Patrimonio Neto
          </p>
          <p className={`text-3xl sm:text-4xl font-bold ${isPositive ? 'text-white' : 'text-red-300'} break-words`}>
            ${currentNetWorth.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "text-sm font-medium",
              percentageChange === 0 ? "text-white/50" : 
              isPositiveChange ? "text-emerald-300" : "text-red-300"
            )}>
              {isPositiveChange && percentageChange !== 0 ? '+' : ''}{percentageChange.toFixed(2)}%
            </span>
            <span className="text-sm text-white/60">
              {timeRange === '1M' ? 'último mes' : 
               timeRange === '3M' ? 'últimos 3M' :
               timeRange === '6M' ? 'últimos 6M' :
               timeRange === '1Y' ? 'último año' :
               'total'}
            </span>
          </div>
        </div>
        {isPositiveChange ? (
          <TrendingUp className="h-8 w-8 text-emerald-400" />
        ) : (
          <TrendingDown className="h-8 w-8 text-red-400" />
        )}
      </div>

      {/* Chart with high/low indicators */}
      <div className="relative h-[400px]">
        <style>{`
          .recharts-cartesian-axis-tick-value { display: none !important; }
          .recharts-yAxis { display: none !important; }
          .recharts-cartesian-axis.yAxis { display: none !important; }
        `}</style>
        {/* High Point Label */}
        {highPoint && (
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/30 z-10">
            <p className="text-[8px] text-white/70 font-medium">high:</p>
            <p className="text-[10px] font-bold text-emerald-300 break-all">
              ${highPoint.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
        
        {/* Low Point Label */}
        {lowPoint && (
          <div className="absolute bottom-20 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/30 z-10">
            <p className="text-[8px] text-white/70 font-medium">low:</p>
            <p className="text-[10px] font-bold text-red-300 break-all">
              ${lowPoint.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.95)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                borderRadius: '12px',
                fontSize: '13px',
                padding: '12px 16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginBottom: '4px' }}
              formatter={(value: number) => [
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '15px' }}>
                  ${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>, 
                'Patrimonio Neto'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#colorNetWorth)"
              animationDuration={300}
              dot={false}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Buttons - closer to chart */}
      <div className="flex gap-1.5 justify-center -mt-2">
        {(['1M', '3M', '6M', '1Y', 'All'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={cn(
              "h-6 px-2 text-[10px] transition-all rounded-full",
              timeRange === range 
                ? "bg-white/20 text-white border-white/30 shadow-lg" 
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20"
            )}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Assets and Liabilities - closer to buttons with hover effects */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button 
          onClick={() => navigate('/assets')}
          className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 border border-emerald-500/20 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <p className="text-[10px] text-white/70 mb-0.5">Activos</p>
          <p className="text-base font-bold text-emerald-300 break-words">
            ${totalAssets.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </p>
        </button>
        <button 
          onClick={() => navigate('/liabilities')}
          className="bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-500/20 transition-all hover:bg-red-500/20 hover:border-red-500/30 hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <p className="text-[10px] text-white/70 mb-0.5">Pasivos</p>
          <p className="text-base font-bold text-red-300 break-words">
            ${totalLiabilities.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </p>
        </button>
      </div>

    </div>
  );
}
