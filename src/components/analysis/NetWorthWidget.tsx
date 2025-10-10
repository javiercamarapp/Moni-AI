import { useState } from "react";
import { Card } from "@/components/ui/card";
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
      <Card className="p-4 bg-gradient-card card-glow border-white/20 animate-pulse">
        <div className="space-y-3">
          <div className="h-20 bg-white/5 rounded"></div>
          <div className="h-[120px] bg-white/5 rounded"></div>
        </div>
      </Card>
    );
  }

  const { currentNetWorth, totalAssets, totalLiabilities, chartData, percentageChange } = netWorthData;
  const isPositive = currentNetWorth >= 0;
  const isPositiveChange = percentageChange >= 0;

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Evolución Patrimonio Neto
            </p>
            <p className="text-xs text-white/60">Activos − Pasivos</p>
          </div>
          {isPositiveChange ? (
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-400" />
          )}
        </div>

        <div>
          <p className={`text-3xl font-bold ${isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
            ${(currentNetWorth / 1000).toFixed(1)}k
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-xs font-medium",
              isPositiveChange ? "text-emerald-300" : "text-red-300"
            )}>
              {isPositiveChange ? '+' : ''}{percentageChange.toFixed(2)}%
            </span>
            <span className="text-xs text-white/60">
              {timeRange === '1M' ? 'vs mes' : 
               timeRange === '3M' ? 'vs 3M' :
               timeRange === '6M' ? 'vs 6M' :
               timeRange === '1Y' ? 'vs año' :
               'total'}
            </span>
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <div>
              <span className="text-white/60">Activos: </span>
              <span className="text-emerald-300 font-medium">${(totalAssets / 1000).toFixed(1)}k</span>
            </div>
            <div>
              <span className="text-white/60">Pasivos: </span>
              <span className="text-red-300 font-medium">${(totalLiabilities / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>

        {/* Time Range Buttons */}
        <div className="flex gap-1 justify-center">
          {(['1M', '3M', '6M', '1Y', 'All'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                "h-6 px-2 text-[10px] transition-all",
                timeRange === range 
                  ? "bg-primary/20 text-white border-primary/50 shadow-glow-sm" 
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
              )}
            >
              {range}
            </Button>
          ))}
        </div>

        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositiveChange ? "#10b981" : "#ef4444"} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={isPositiveChange ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'white', fontSize: 9 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                tick={{ fill: 'white', fontSize: 9 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                labelStyle={{ color: 'white' }}
                formatter={(value: number) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Patrimonio']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isPositiveChange ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                fill="url(#colorNetWorth)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-[10px] text-white/70 text-center">
            Tu patrimonio crece con cada ingreso y se actualiza automáticamente con tus transacciones
          </p>
        </div>
      </div>
    </Card>
  );
}
