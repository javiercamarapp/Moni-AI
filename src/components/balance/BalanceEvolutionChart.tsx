import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

interface DailyTrendData {
    day: string;
    dayFull?: string;
    income: number;
    expense: number;
}

interface BalanceEvolutionChartProps {
    data: DailyTrendData[];
}

const BalanceEvolutionChart: React.FC<BalanceEvolutionChartProps> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white rounded-[1.75rem] p-5 shadow-sm border border-white/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[#5D4037]">Evolución de Flujo</h3>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                    </div>
                </div>
            </div>

            <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
                            dy={10}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            hide={true}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                                backdropFilter: 'blur(4px)',
                                color: '#fff',
                                borderRadius: '12px',
                                border: 'none',
                                fontSize: '11px',
                                padding: '8px 12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ padding: 0 }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                            labelStyle={{ color: '#9CA3AF', marginBottom: '4px', display: 'none' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#10B981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            stroke="#EF4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BalanceEvolutionChart;
