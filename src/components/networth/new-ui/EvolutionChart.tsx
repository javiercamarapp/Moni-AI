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

    // Calculate dynamic tick interval based on data length
    const tickInterval = data.length > 20 ? Math.floor(data.length / 6) : 
                         data.length > 10 ? Math.floor(data.length / 5) : 
                         data.length > 5 ? 1 : 0;

    return (
        <div className="h-[200px] lg:h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8C6A5D" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8C6A5D" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" opacity={0.5} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#A8A29E', fontSize: 10, fontWeight: 500 }}
                        dy={10}
                        interval={tickInterval}
                        minTickGap={20}
                    />
                    <YAxis
                        hide={true}
                        domain={['dataMin - 1000', 'dataMax + 1000']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#5D4037',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: '10px 14px'
                        }}
                        itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#D7CCC8', fontSize: '11px', marginBottom: '4px' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        labelFormatter={(label) => label}
                        cursor={{ stroke: '#8D6E63', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#5D4037"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={800}
                        dot={false}
                        activeDot={{ r: 5, fill: '#5D4037', strokeWidth: 2, stroke: '#fff' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
