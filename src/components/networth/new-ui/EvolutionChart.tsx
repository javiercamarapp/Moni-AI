import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartDataPoint } from '@/hooks/useNetWorth';

interface EvolutionChartProps {
    data: ChartDataPoint[];
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[240px] w-full bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 text-xs font-medium border border-dashed border-gray-200">
                No hay datos suficientes para mostrar la gráfica
            </div>
        );
    }

    return (
        <div className="h-[180px] lg:h-[180px] w-full lg:-ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8C6A5D" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8C6A5D" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" opacity={0.5} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#A8A29E', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        hide={true}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            padding: '8px 12px'
                        }}
                        itemStyle={{ color: '#44403C', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#A8A29E', fontSize: '10px', marginBottom: '4px' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Patrimonio']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8C6A5D"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
