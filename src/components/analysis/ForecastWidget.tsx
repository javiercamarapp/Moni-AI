import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from "lucide-react";

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

interface ForecastProps {
  forecastData: ForecastData[];
  goalProbability: number;
  goalETA: string;
}

export default function ForecastWidget({ forecastData, goalProbability, goalETA }: ForecastProps) {
  const [timeframe, setTimeframe] = useState<'3' | '6'>('3');
  
  const displayData = timeframe === '3' ? forecastData.slice(0, 3) : forecastData;

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Proyecciones con Escenarios
            </p>
            <p className="text-xs text-white/60">Forecast de ahorro</p>
          </div>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as '3' | '6')}>
            <TabsList className="h-7 bg-white/10 border border-white/20">
              <TabsTrigger value="3" className="text-xs text-white data-[state=active]:bg-white data-[state=active]:text-black px-2">
                3M
              </TabsTrigger>
              <TabsTrigger value="6" className="text-xs text-white data-[state=active]:bg-white data-[state=active]:text-black px-2">
                6M
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'white', fontSize: 9 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                tick={{ fill: 'white', fontSize: 9 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                labelStyle={{ color: 'white' }}
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
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-amber-300">Conservador</p>
            <p className="text-xs font-bold text-amber-300 break-words">
              ${(displayData[displayData.length - 1]?.conservative || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300">Realista</p>
            <p className="text-xs font-bold text-purple-300 break-words">
              ${(displayData[displayData.length - 1]?.realistic || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-300">Óptimo</p>
            <p className="text-xs font-bold text-emerald-300 break-words">
              ${(displayData[displayData.length - 1]?.optimistic || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">Probabilidad de cumplir meta</p>
              <p className="text-lg font-bold text-purple-300">{goalProbability}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">ETA estimado</p>
              <p className="text-sm font-medium text-white">{goalETA}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
