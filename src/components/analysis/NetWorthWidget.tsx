import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Shield } from "lucide-react";

interface NetWorthProps {
  netWorth: number;
  assets: number;
  liabilities: number;
  historicalData: { month: string; assets: number; liabilities: number; netWorth: number }[];
  runwayMonths: number;
}

export default function NetWorthWidget({ netWorth, assets, liabilities, historicalData, runwayMonths }: NetWorthProps) {
  const isPositive = netWorth >= 0;
  const runwaySafe = runwayMonths >= 3;

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Patrimonio Neto
            </p>
            <p className="text-xs text-white/60">Assets − Deudas</p>
          </div>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          ) : (
            <TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
          )}
        </div>

        <div>
          <p className={`text-3xl font-bold ${isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
            ${(netWorth / 1000).toFixed(1)}k
          </p>
          <div className="flex gap-4 mt-2 text-xs">
            <div>
              <span className="text-white/60">Activos: </span>
              <span className="text-emerald-300 font-medium">${(assets / 1000).toFixed(1)}k</span>
            </div>
            <div>
              <span className="text-white/60">Pasivos: </span>
              <span className="text-red-300 font-medium">${(liabilities / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>

        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorLiabilities" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
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
                dataKey="assets" 
                stackId="1"
                stroke="#10b981" 
                fill="url(#colorAssets)" 
              />
              <Area 
                type="monotone" 
                dataKey="liabilities" 
                stackId="2"
                stroke="#ef4444" 
                fill="url(#colorLiabilities)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={`p-2 rounded-lg ${runwaySafe ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">Runway de Liquidez</p>
              <p className={`text-lg font-bold ${runwaySafe ? 'text-emerald-300' : 'text-red-300'}`}>
                {runwayMonths.toFixed(1)} meses
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60">Meta: ≥3 meses</p>
              <p className={`text-xs font-medium ${runwaySafe ? 'text-emerald-300' : 'text-red-300'}`}>
                {runwaySafe ? '✅ Seguro' : '⚠️ Crítico'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
