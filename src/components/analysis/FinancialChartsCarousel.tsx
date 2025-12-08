import { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, AreaChart, Area, ComposedChart, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, YAxis
} from 'recharts';
import {
    BarChart3, PieChart as PieIcon, TrendingUp, Layers,
    Activity, Sun, Scale, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, CreditCard
} from 'lucide-react';

interface HistoricalDataPoint {
    name: string;
    inc: number;
    exp: number;
    sav: number;
}

interface FinancialChartsCarouselProps {
    historicalData: HistoricalDataPoint[];
    expenseBreakdown?: { fixed: number; variable: number; savings: number };
    netWorthData?: Array<{ name: string; assets: number; liabilities: number; net: number }>;
    savingsAccumulation?: Array<{ name: string; monthly: number; accumulated: number }>;
    financialRatios?: Array<{ name: string; user: number; ideal: number; unit: string }>;
}

const COLORS = {
    income: '#10b981',
    expense: '#f97316',
    savings: '#a855f7',
    assets: '#10b981',
    liabilities: '#f43f5e',
    netWorth: '#7c3aed',
    fixed: '#f59e0b',
    variable: '#ec4899',
    benchmark: '#E7E5E4',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const isHistorical = payload.some((p: any) => p.dataKey === 'inc');

        return (
            <div className="bg-[#292524]/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-[#44403C] z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[150px]">
                <div className="flex justify-between items-center mb-2 border-b border-stone-700 pb-1">
                    <p className="text-stone-300 text-[10px] font-bold uppercase tracking-wider">{label || payload[0].name}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }}></span>
                                <span className="text-[10px] font-bold text-stone-300 capitalize">{entry.name}:</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-white">
                                {typeof entry.value === 'number' ?
                                    (entry.value > 1000 ? `$${(entry.value / 1000).toFixed(1)}k` : `${entry.value}${entry.payload.unit || ''}`)
                                    : entry.value}
                            </span>
                        </div>
                    ))}

                    {isHistorical && payload.length >= 2 && (
                        <div className="mt-2 pt-2 border-t border-stone-700">
                            <div className="flex justify-between items-center text-[9px]">
                                <span className="text-stone-400">Margen:</span>
                                <span className="font-bold text-[#10b981]">
                                    +${(payload.find((p: any) => p.dataKey === 'inc')?.value - payload.find((p: any) => p.dataKey === 'exp')?.value).toFixed(1)}k
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export const FinancialChartsCarousel = ({
    historicalData,
    expenseBreakdown,
    netWorthData,
    savingsAccumulation,
    financialRatios,
}: FinancialChartsCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const slides = [
        { id: 'historical', title: 'Comparativo Histórico', icon: BarChart3, color: 'text-stone-600' },
        { id: 'health', title: 'Salud Financiera', icon: PieIcon, color: 'text-emerald-600' },
        { id: 'networth', title: 'Evolución Patrimonial', icon: TrendingUp, color: 'text-purple-600' },
        { id: 'accumulation', title: 'Ahorro Acumulado', icon: Layers, color: 'text-amber-600' },
        { id: 'evolution', title: 'Tu Evolución', icon: Activity, color: 'text-blue-600' },
        { id: 'seasonal', title: 'Tendencias Estacionales', icon: Sun, color: 'text-orange-500' },
        { id: 'ratios', title: 'Ratios Financieros', icon: Scale, color: 'text-teal-600' },
    ];

    // Auto-rotate
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [isPaused, slides.length]);

    const renderChart = () => {
        switch (currentIndex) {
            case 0: // Historical Comparison
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={historicalData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#F5F5F4" strokeDasharray="3 3" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                            <Bar dataKey="inc" name="Ingresos" fill={COLORS.income} radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="exp" name="Gastos" fill={COLORS.expense} radius={[4, 4, 0, 0]} barSize={12} />
                            <Line
                                type="monotone"
                                dataKey="sav"
                                name="Ahorro"
                                stroke={COLORS.savings}
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.savings }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            case 1: // Financial Health (Pie)
                if (!expenseBreakdown) {
                    return <div className="flex items-center justify-center h-full text-sm text-[#A8A29E]">Sin datos suficientes</div>;
                }

                const healthData = [
                    { name: 'Gastos Fijos', value: expenseBreakdown.fixed, color: COLORS.fixed },
                    { name: 'Variables', value: expenseBreakdown.variable, color: COLORS.variable },
                    { name: 'Ahorro', value: expenseBreakdown.savings, color: COLORS.assets },
                ];

                const total = healthData.reduce((sum, item) => sum + item.value, 0);

                return (
                    <div className="flex items-center justify-between h-full px-2">
                        <div className="h-full w-1/2 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={healthData}
                                        innerRadius={45}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {healthData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                                <span className="text-[9px] font-bold text-[#A8A29E] uppercase">Total</span>
                                <span className="text-sm font-black text-[#292524]">${(total / 1000).toFixed(0)}k</span>
                            </div>
                        </div>
                        <div className="w-1/2 flex flex-col justify-center gap-3">
                            {healthData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#A8A29E] uppercase">{item.name}</p>
                                        <p className="text-xs font-black text-[#292524]">${(item.value / 1000).toFixed(1)}k</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 2: // Net Worth Evolution
                if (!netWorthData || netWorthData.length === 0) {
                    return <div className="flex items-center justify-center h-full text-sm text-[#A8A29E]">Sin datos de patrimonio</div>;
                }

                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={netWorthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.netWorth} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={COLORS.netWorth} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#F5F5F4" strokeDasharray="3 3" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="net" name="Patrimonio Neto" stroke={COLORS.netWorth} strokeWidth={3} fill="url(#colorNet)" />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 3: // Savings Accumulation
                if (!savingsAccumulation || savingsAccumulation.length === 0) {
                    return <div className="flex items-center justify-center h-full text-sm text-[#A8A29E]">Sin datos de ahorro</div>;
                }

                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={savingsAccumulation} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#F5F5F4" strokeDasharray="3 3" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="monthly" name="Ahorro Mensual" fill={COLORS.savings} radius={[4, 4, 0, 0]} barSize={16} />
                            <Line
                                type="monotone"
                                dataKey="accumulated"
                                name="Acumulado"
                                stroke={COLORS.income}
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            case 4: // Evolution (Score/Performance) - Placeholder
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                        <Activity size={32} className="text-[#3b82f6] opacity-50" />
                        <p className="text-sm font-bold text-[#292524] text-center">Evolución de Score</p>
                        <p className="text-xs text-[#A8A29E] text-center">Conecta tu historial de score crediticio para ver tu evolución</p>
                    </div>
                );

            case 5: // Seasonal Trends - Placeholder
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                        <Sun size={32} className="text-[#f97316] opacity-50" />
                        <p className="text-sm font-bold text-[#292524] text-center">Tendencias Estacionales</p>
                        <p className="text-xs text-[#A8A29E] text-center">Necesitas al menos 12 meses de historial para ver patrones estacionales</p>
                    </div>
                );

            case 6: // Financial Ratios Benchmark
                if (!financialRatios || financialRatios.length === 0) {
                    return <div className="flex items-center justify-center h-full text-sm text-[#A8A29E]">Sin datos de ratios</div>;
                }

                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialRatios} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                            <CartesianGrid horizontal={true} vertical={false} stroke="#F5F5F4" strokeDasharray="3 3" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#292524', fontSize: 10, fontWeight: 'bold' }} width={80} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="ideal" name="Ideal" fill={COLORS.benchmark} radius={[0, 4, 4, 0]} barSize={12} />
                            <Bar dataKey="user" name="Tú" fill={COLORS.netWorth} radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    const current = slides[currentIndex];
    const Icon = current.icon;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <div className="mb-6">
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border-b-4 border-stone-100 relative group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-stone-100 rounded-lg">
                        <Icon size={16} className={current.color} />
                    </div>
                    <h3 className="font-extrabold text-[#292524] text-sm tracking-tight">{current.title}</h3>
                </div>

                {/* Chart */}
                <div className="h-48 w-full mb-4">
                    {renderChart()}
                </div>

                {/* Navigation Arrows (Always visible) */}
                <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-md text-stone-600 transition-opacity hover:bg-white z-10"
                    aria-label="Previous chart"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-md text-stone-600 transition-opacity hover:bg-white z-10"
                    aria-label="Next chart"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentIndex
                                ? 'w-8 bg-[#8D6E63]'
                                : 'w-2 bg-[#E7E5E4] hover:bg-[#D6D3D1]'
                                }`}
                            aria-label={`Go to chart ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
