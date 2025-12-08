
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

const TIME_RANGES = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1A', months: 12 },
  { label: '5A', months: 60 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const optimal = payload.find((p: any) => p.dataKey === 'optimal')?.value || 0;
    const conservative = payload.find((p: any) => p.dataKey === 'conservative')?.value || 0;
    const gain = optimal - conservative;

    return (
      <div className="bg-[#292524]/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-[#44403C] z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[150px]">
        <div className="flex justify-between items-center mb-2 border-b border-stone-700 pb-1">
          <p className="text-stone-300 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
              <span className="text-[10px] text-stone-300 font-bold">Óptimo</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#10b981]">${(optimal / 1000).toFixed(1)}k</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"></span>
              <span className="text-[10px] text-stone-300 font-bold">Realista</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#8b5cf6]">${(payload[1]?.value / 1000).toFixed(1)}k</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
              <span className="text-[10px] text-stone-300 font-bold">Conserv.</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#f59e0b]">${(conservative / 1000).toFixed(1)}k</span>
          </div>
        </div>

        {/* Comparative Insight */}
        {gain > 0 && (
          <div className="mt-2 pt-2 border-t border-stone-700">
            <div className="flex items-center justify-between text-[#10b981]">
              <span className="text-[9px] font-bold">Potencial Extra:</span>
              <div className="flex items-center gap-0.5 bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={10} />
                <span className="text-[9px] font-bold">+${(gain / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ProjectionsSection = ({
  currentBalance,
  avgMonthlySavings
}: {
  currentBalance: number;
  avgMonthlySavings: number;
}) => {
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[2]); // Default 1A

  // Generate data based on range using REAL DATA
  const data = useMemo(() => {
    const arr = [];
    const startBalance = currentBalance || 0; // Use real current balance
    const monthlySavings = avgMonthlySavings || 0; // Use real average savings

    for (let i = 0; i <= selectedRange.months; i++) {
      const monthLabel = i === 0 ? 'Hoy' : `Mes ${i}`;
      // Logic for diverging paths
      const conservative = startBalance + (monthlySavings * 0.75 * i);
      const realistic = startBalance + (monthlySavings * i);
      const optimal = startBalance + (monthlySavings * 1.2 * i) + (i * 500); // Compound

      arr.push({
        name: monthLabel,
        conservative,
        realistic,
        optimal
      });
    }
    return arr;
  }, [selectedRange, currentBalance, avgMonthlySavings]);

  const finalValues = data[data.length - 1];

  return (
    <div className="space-y-4">
      {/* --- Main Projections Card --- */}
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border-b-4 border-stone-100">

        {/* Header & Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-stone-100 rounded-lg">
              <TrendingUp size={16} className="text-[#292524]" />
            </div>
            <h3 className="font-extrabold text-[#292524] text-lg tracking-tight">Proyecciones</h3>
          </div>

          <div className="flex bg-[#F5F5F4] p-1 rounded-xl">
            {TIME_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${selectedRange.label === range.label
                    ? 'bg-white text-[#292524] shadow-sm'
                    : 'text-[#A8A29E] hover:text-[#78716C]'
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 w-full mb-6 cursor-crosshair">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F5F5F4" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A8A29E', fontSize: 10, fontWeight: 'bold' }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="optimal" stroke="#10b981" strokeWidth={2} fill="url(#colorOpt)" />
              <Area type="monotone" dataKey="realistic" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorReal)" />
              <Area type="monotone" dataKey="conservative" stroke="#f59e0b" strokeWidth={2} fill="url(#colorCons)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Conservative */}
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-2.5 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <span className="text-[#d97706] text-[9px] font-bold uppercase tracking-wide mb-1">Conserv.</span>
            <span className="text-[#7C2D12] font-black text-xs">
              ${(finalValues.conservative / 1000).toFixed(0)}k
            </span>
          </div>
          {/* Realistic */}
          <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-xl p-2.5 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <span className="text-[#7c3aed] text-[9px] font-bold uppercase tracking-wide mb-1">Realista</span>
            <span className="text-[#4c1d95] font-black text-xs">
              ${(finalValues.realistic / 1000).toFixed(0)}k
            </span>
          </div>
          {/* Optimal */}
          <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-xl p-2.5 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <span className="text-[#059669] text-[9px] font-bold uppercase tracking-wide mb-1">Óptimo</span>
            <span className="text-[#064e3b] font-black text-xs">
              ${(finalValues.optimal / 1000).toFixed(0)}k
            </span>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#A8A29E] font-medium leading-tight px-4">
          Basado en tu promedio mensual de los últimos 6 meses: <span className="font-bold text-[#78716C]">$8,500</span>
        </p>

      </div>
    </div>
  );
};
