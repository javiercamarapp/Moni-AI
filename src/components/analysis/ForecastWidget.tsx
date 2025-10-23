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
  const [timeframe, setTimeframe] = useState<'3' | '6' | '12' | '60' | '120'>('12');
  
  const monthsToShow = timeframe === '3' ? 3 : 
                       timeframe === '6' ? 6 :
                       timeframe === '12' ? 12 :
                       timeframe === '60' ? 60 : 120;
  
  const displayData = forecastData.slice(0, monthsToShow);

  return (
    <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <p className="text-xs font-bold text-foreground">📊 Proyecciones</p>
          </div>
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
        </div>

        <div className="h-32">
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
                  backgroundColor: 'white', 
                  border: '1px solid rgba(0,0,0,0.1)', 
                  borderRadius: '8px',
                  fontSize: '9px'
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
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-amber-50 rounded-lg p-1.5 border border-amber-200">
            <p className="text-[8px] text-amber-700 font-medium">Conserv.</p>
            <p className="text-[11px] font-bold text-amber-900 leading-tight">
              {(() => {
                const value = displayData[displayData.length - 1]?.conservative || 0;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                return `$${Math.round(value / 1000)}k`;
              })()}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-1.5 border border-purple-200">
            <p className="text-[8px] text-purple-700 font-medium">Realista</p>
            <p className="text-[11px] font-bold text-purple-900 leading-tight">
              {(() => {
                const value = displayData[displayData.length - 1]?.realistic || 0;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                return `$${Math.round(value / 1000)}k`;
              })()}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-1.5 border border-emerald-200">
            <p className="text-[8px] text-emerald-700 font-medium">Óptimo</p>
            <p className="text-[11px] font-bold text-emerald-900 leading-tight">
              {(() => {
                const value = displayData[displayData.length - 1]?.optimistic || 0;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                return `$${Math.round(value / 1000)}k`;
              })()}
            </p>
          </div>
        </div>

        {goalProbability > 0 && (
          <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] text-purple-700 font-medium">Prob. meta</p>
                <p className="text-sm font-bold text-purple-900">{goalProbability}%</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-purple-700 font-medium">ETA</p>
                <p className="text-[11px] font-bold text-purple-900">{goalETA}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
