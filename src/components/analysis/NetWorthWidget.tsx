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
    <div className="px-4 py-4 space-y-4">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-foreground/90 flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4" /> Patrimonio Neto
          </p>
          <p className={`text-3xl sm:text-4xl font-bold ${isPositive ? 'text-foreground' : 'text-destructive'} break-words`}>
            ${currentNetWorth.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "text-sm font-medium",
              percentageChange === 0 ? "text-muted-foreground" : 
              isPositiveChange ? "text-emerald-600" : "text-destructive"
            )}>
              {isPositiveChange && percentageChange !== 0 ? '+' : ''}{percentageChange.toFixed(2)}%
            </span>
            <span className="text-sm text-muted-foreground">
              {timeRange === '1M' ? 'último mes' : 
               timeRange === '3M' ? 'últimos 3M' :
               timeRange === '6M' ? 'últimos 6M' :
               timeRange === '1Y' ? 'último año' :
               'total'}
            </span>
          </div>
        </div>
        {isPositiveChange ? (
          <TrendingUp className="h-8 w-8 text-emerald-600" />
        ) : (
          <TrendingDown className="h-8 w-8 text-destructive" />
        )}
      </div>

      {/* Chart with high/low indicators */}
      <div className="relative h-[280px]">
        {/* High Point Label */}
        {highPoint && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-blue-100 z-10 shadow-lg">
            <p className="text-[8px] text-muted-foreground font-medium">high:</p>
            <p className="text-[10px] font-bold text-emerald-600 break-all">
              ${highPoint.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
        
        {/* Low Point Label */}
        {lowPoint && (
          <div className="absolute bottom-20 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-blue-100 z-10 shadow-lg">
            <p className="text-[8px] text-muted-foreground font-medium">low:</p>
            <p className="text-[10px] font-bold text-destructive break-all">
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
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tickFormatter={(value) => (value === 0 ? '' : value)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9E9E9E', fontSize: 12 }}
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
      <div className="flex gap-1.5 justify-center -mt-6">
        {(['1M', '3M', '6M', '1Y', 'All'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={cn(
              "h-7 px-2.5 text-[10px] transition-all rounded-[20px] shadow-lg font-semibold border border-blue-100",
              timeRange === range 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105" 
                : "bg-white text-foreground hover:bg-primary/10 hover:scale-105"
            )}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Assets and Liabilities - closer to buttons with hover effects */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <button 
          onClick={() => navigate('/assets')}
          className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer border border-blue-100 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-foreground/80 leading-tight font-medium">Activos</p>
              <p className="text-base font-bold text-emerald-700 leading-tight break-words">
                ${totalAssets >= 1000000 
                  ? `${(totalAssets / 1000000).toFixed(2)}M` 
                  : totalAssets >= 100000 
                  ? `${(totalAssets / 1000).toFixed(0)}k` 
                  : totalAssets.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => navigate('/liabilities')}
          className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer border border-blue-100 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-foreground/80 leading-tight font-medium">Pasivos</p>
              <p className="text-base font-bold text-destructive leading-tight break-words">
                ${totalLiabilities >= 1000000 
                  ? `${(totalLiabilities / 1000000).toFixed(2)}M` 
                  : totalLiabilities >= 100000 
                  ? `${(totalLiabilities / 1000).toFixed(0)}k` 
                  : totalLiabilities.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
}
