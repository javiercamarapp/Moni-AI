import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Shield, TrendingDown } from "lucide-react";
import { useNetWorth, TimeRange } from "@/hooks/useNetWorth";
import { cn } from "@/lib/utils";

export default function NetWorthWidget() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const { data: netWorthData, isLoading } = useNetWorth(timeRange);

  if (isLoading || !netWorthData) {
    return (
      <div className="px-4 py-8 animate-pulse">
        <div className="space-y-6">
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
          <p className={`text-5xl font-bold ${isPositive ? 'text-white' : 'text-red-300'}`}>
            ${(currentNetWorth / 1000).toFixed(1)}k
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "text-sm font-medium",
              isPositiveChange ? "text-emerald-300" : "text-red-300"
            )}>
              {isPositiveChange ? '+' : ''}{percentageChange.toFixed(2)}%
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

      {/* Assets and Liabilities */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-4 border border-emerald-500/20">
          <p className="text-xs text-white/70 mb-1">Activos</p>
          <p className="text-2xl font-bold text-emerald-300">
            ${(totalAssets / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-500/20">
          <p className="text-xs text-white/70 mb-1">Pasivos</p>
          <p className="text-2xl font-bold text-red-300">
            ${(totalLiabilities / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositiveChange ? "#10b981" : "#ef4444"} stopOpacity={0.6}/>
                <stop offset="95%" stopColor={isPositiveChange ? "#10b981" : "#ef4444"} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'white', fontSize: 11 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.9)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '12px',
                fontSize: '12px',
                padding: '12px'
              }}
              labelStyle={{ color: 'white', marginBottom: '4px' }}
              formatter={(value: number) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Patrimonio']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isPositiveChange ? "#10b981" : "#ef4444"}
              strokeWidth={3}
              fill="url(#colorNetWorth)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Buttons */}
      <div className="flex gap-2 justify-center">
        {(['1M', '3M', '6M', '1Y', 'All'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={cn(
              "h-9 px-4 text-sm transition-all rounded-full",
              timeRange === range 
                ? "bg-white/20 text-white border-white/30 shadow-lg" 
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20"
            )}
          >
            {range}
          </Button>
        ))}
      </div>
    </div>
  );
}
