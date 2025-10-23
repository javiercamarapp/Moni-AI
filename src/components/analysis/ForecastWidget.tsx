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
    <Card className="p-4 bg-gradient-card card-glow border-white/20 hover:scale-105 transition-transform duration-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-medium text-white">📊 Proyecciones con Escenarios</p>
          </div>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as '3' | '6')}>
            <TabsList className="h-7 bg-white/10 border border-white/30">
              <TabsTrigger value="3" className="text-[10px] text-white data-[state=active]:bg-white data-[state=active]:text-black px-2">
                3M
              </TabsTrigger>
              <TabsTrigger value="6" className="text-[10px] text-white data-[state=active]:bg-white data-[state=active]:text-black px-2">
                6M
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-48">
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
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

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-500/20 rounded-lg p-2 border border-amber-500/30">
            <p className="text-[10px] text-amber-200 font-medium">Conservador</p>
            <p className="text-sm font-bold text-white break-words">
              ${(displayData[displayData.length - 1]?.conservative || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-2 border border-purple-500/30">
            <p className="text-[10px] text-purple-200 font-medium">Realista</p>
            <p className="text-sm font-bold text-white break-words">
              ${(displayData[displayData.length - 1]?.realistic || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-emerald-500/20 rounded-lg p-2 border border-emerald-500/30">
            <p className="text-[10px] text-emerald-200 font-medium">Óptimo</p>
            <p className="text-sm font-bold text-white break-words">
              ${(displayData[displayData.length - 1]?.optimistic || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-purple-200 font-medium">Probabilidad meta</p>
              <p className="text-lg font-bold text-white">{goalProbability}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-purple-200 font-medium">ETA estimado</p>
              <p className="text-sm font-bold text-white">{goalETA}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
