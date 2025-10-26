import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Sparkles, BarChart3 } from "lucide-react";
import { motion } from "motion/react";

interface Scenario {
  conservative: number;
  realistic: number;
  optimistic: number;
}

interface ForecastData {
  month: string;
  conservative: number;
  realistic: number;
  optimistic: number;
}

interface GoalInfo {
  title: string;
  target: number;
  current: number;
  progress: number;
}

interface ForecastProps {
  forecastData: ForecastData[];
  goalProbability: number;
  goalETA: string;
  avgMonthlySavings6M?: number;
  goalInfo?: GoalInfo | null;
}

export default function ForecastWidget({ forecastData, goalProbability, goalETA, avgMonthlySavings6M, goalInfo }: ForecastProps) {
  const [timeframe, setTimeframe] = useState<'3' | '6' | '12' | '60' | '120'>('12');
  
  const monthsToShow = timeframe === '3' ? 3 : 
                       timeframe === '6' ? 6 :
                       timeframe === '12' ? 12 :
                       timeframe === '60' ? 60 : 120;
  
  const displayData = forecastData.slice(0, monthsToShow);
  
  // Check if data is empty or not loaded yet
  const hasData = displayData && displayData.length > 0 && displayData.some(d => d.realistic > 0 || d.conservative > 0 || d.optimistic > 0);

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <p className="text-xs font-bold text-foreground">📊 Proyecciones</p>
          </div>
          {hasData && (
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as '3' | '6' | '12' | '60' | '120')}>
              <TabsList className="h-6 bg-muted">
                <TabsTrigger value="3" className="text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-0.5">
                  3M
                </TabsTrigger>
                <TabsTrigger value="6" className="text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-0.5">
                  6M
                </TabsTrigger>
                <TabsTrigger value="12" className="text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-0.5">
                  1A
                </TabsTrigger>
                <TabsTrigger value="60" className="text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-0.5">
                  5A
                </TabsTrigger>
                <TabsTrigger value="120" className="text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-0.5">
                  10A
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {!hasData ? (
          // Loading state
          <div className="h-[200px] flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <BarChart3 className="w-5 h-5 text-primary" />
              </motion.div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              AI analizando transacciones...
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="optimistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="realistic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="conservative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(0,0,0,0.3)"
                tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 8 }}
              />
              <YAxis 
                stroke="rgba(0,0,0,0.3)"
                tick={{ fill: 'rgba(0,0,0,0.6)', fontSize: 8 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#1f2937',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{
                  color: '#1f2937',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="optimistic" 
                stroke="#10b981"
                fill="url(#optimistic)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="realistic" 
                stroke="#8b5cf6"
                fill="url(#realistic)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="conservative" 
                stroke="#f59e0b"
                fill="url(#conservative)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {hasData && (
          <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-amber-50 rounded-lg p-1.5 border border-amber-200">
            <p className="text-[8px] text-amber-700 font-medium">Conserv.</p>
            <p className="text-[11px] font-bold text-amber-900 leading-tight">
              {(() => {
                const value = displayData[displayData.length - 1]?.conservative || 0;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                return `$${Math.round(value).toLocaleString('es-MX')}`;
              })()}
            </p>
            <p className="text-[7px] text-gray-500 mt-0.5">(75% ahorro promedio)</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-1.5 border border-purple-200">
            <p className="text-[8px] text-purple-700 font-medium">Realista</p>
            <p className="text-[11px] font-bold text-purple-900 leading-tight">
              {(() => {
                const value = displayData[displayData.length - 1]?.realistic || 0;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                return `$${Math.round(value).toLocaleString('es-MX')}`;
              })()}
            </p>
            <p className="text-[7px] text-gray-500 mt-0.5">(ahorro histórico promedio)</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-1.5 border border-emerald-200">
            <p className="text-[8px] text-emerald-700 font-medium">Óptimo</p>
            <p className="text-[11px] font-bold text-emerald-900 leading-tight">
              {(() => {
                const value = displayData[displayData.length - 1]?.optimistic || 0;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                return `$${Math.round(value).toLocaleString('es-MX')}`;
              })()}
            </p>
            <p className="text-[7px] text-gray-500 mt-0.5">(+20% del promedio)</p>
          </div>
          </div>
        )}

        {hasData && avgMonthlySavings6M !== undefined && avgMonthlySavings6M > 0 && (
          <div className="text-center pt-2">
            <p className="text-[10px] text-gray-500">
              Esta proyección se basa en tu promedio mensual de ahorro de los últimos 6 meses: 
              <span className="font-semibold text-gray-700">
                {" "}${Math.round(avgMonthlySavings6M).toLocaleString('es-MX')}
              </span>
            </p>
          </div>
        )}

        {hasData && goalInfo && goalProbability > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-2.5 border border-purple-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-purple-600 font-medium uppercase tracking-wide">Meta de Ahorro</p>
                  <p className="text-xs font-bold text-purple-900 mt-0.5">{goalInfo.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-purple-600 font-medium">ETA</p>
                  <p className="text-[11px] font-bold text-purple-900">{goalETA}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold text-purple-800">
                    ${goalInfo.current.toLocaleString('es-MX')}
                  </span>
                  <span className="text-[9px] text-purple-600">
                    de ${goalInfo.target.toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="relative h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, goalInfo.progress)}%` }}
                  />
                </div>
                <p className="text-[9px] text-purple-700 font-medium">{goalInfo.progress.toFixed(1)}% completado</p>
                <p className="text-[7px] text-gray-500">(progreso actual vs meta total)</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-purple-200">
                <div>
                  <p className="text-[8px] text-purple-600 font-medium">Probabilidad de éxito</p>
                  <p className="text-sm font-bold text-purple-900">{goalProbability}%</p>
                  <p className="text-[7px] text-gray-500">(tiempo + consistencia + capacidad)</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-purple-500 max-w-[140px]">
                    Basado en tu ahorro promedio de los últimos 6 meses
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
