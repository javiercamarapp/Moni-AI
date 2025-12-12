import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';

interface ChartDataPoint {
    date: string;
    value: number;
}

interface PortfolioChartProps {
    data: ChartDataPoint[];
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5D4037" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#5D4037" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide={true} />
                    <YAxis domain={['dataMin', 'dataMax']} hide={true} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#5D4037',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '8px 12px',
                            textAlign: 'center'
                        }}
                        itemStyle={{ color: '#FFF', fontWeight: 'bold', fontSize: '16px', padding: 0 }}
                        labelStyle={{ color: '#D7CCC8', fontSize: '12px', fontWeight: 500, marginBottom: '2px', textTransform: 'capitalize' }}
                        cursor={{ stroke: '#8D6E63', strokeWidth: 1, strokeDasharray: '4 4' }}
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#5D4037"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioChart;
