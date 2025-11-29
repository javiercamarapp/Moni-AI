import React from 'react';
import { ArrowLeft, Pencil, TrendingUp, Calendar, FileText, Activity } from '@/components/networth/new-ui/Icons';

export interface AssetItem {
    id: string;
    name: string;
    tag: string;
    value: number;
}

interface AssetDetailViewProps {
    asset: AssetItem;
    categoryTitle: string;
    categoryIcon: any;
    categoryGradient: string;
    onBack: () => void;
    onEdit: (asset: AssetItem) => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({
    asset,
    categoryTitle,
    categoryIcon: Icon,
    categoryGradient,
    onBack,
    onEdit
}) => {
    // Format currency
    const formatMoney = (value: number) => {
        return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Mock data generation for the chart based on current value
    const generateChartData = (currentValue: number) => {
        const points = [];
        const variance = currentValue * 0.05; // 5% variance
        for (let i = 0; i < 7; i++) {
            // Create a random-ish curve ending at the current value
            const randomOffset = Math.random() * variance - (variance / 2);
            // Ensure the last point is the current value
            const val = i === 6 ? currentValue : currentValue - (variance * (6 - i) * 0.2) + randomOffset;
            points.push(val);
        }
        return points;
    };

    const chartData = generateChartData(asset.value);
    const minVal = Math.min(...chartData) * 0.99;
    const maxVal = Math.max(...chartData) * 1.01;
    const range = maxVal - minVal;

    // Create SVG path
    const points = chartData.map((val, index) => {
        const x = (index / (chartData.length - 1)) * 100;
        const y = 100 - ((val - minVal) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="fixed inset-0 bg-moni-dark/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-[#F2F4F8] w-full h-full md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
                {/* Header */}
                <header className="px-6 pt-6 pb-2 flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white rounded-full shadow-soft flex items-center justify-center text-moni-dark hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-moni-dark font-bold">Detalle del Activo</h1>
                    <button
                        onClick={() => onEdit(asset)}
                        className="w-10 h-10 bg-white rounded-full shadow-soft flex items-center justify-center text-moni-brown hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <Pencil size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center pt-8 pb-6 px-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md mb-4 ${categoryGradient}`}>
                            <Icon size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-moni-dark text-center leading-tight">{asset.name}</h2>
                        <p className="text-gray-400 font-medium text-sm mt-1">{asset.tag}</p>

                        <div className="mt-6 flex flex-col items-center">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Valor Actual</span>
                            <h3 className="text-4xl font-extrabold text-moni-dark">{formatMoney(asset.value)}</h3>
                            <div className="flex items-center gap-1 mt-2 bg-green-100 px-3 py-1 rounded-full">
                                <TrendingUp size={14} className="text-moni-green" />
                                <span className="text-moni-green text-xs font-bold">+2.4% este mes</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="mx-6 bg-white rounded-3xl p-6 shadow-soft mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-moni-dark text-sm">Historial de Valor</h4>
                            <div className="flex gap-2">
                                {['1M', '6M', '1A'].map((period, idx) => (
                                    <button key={period} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${idx === 0 ? 'bg-moni-brown text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-40 w-full relative">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#8D6E63" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#8D6E63" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`M0,100 L0,${100 - ((chartData[0] - minVal) / range) * 100} ${points} L100,100 Z`}
                                    fill="url(#chartGradient)"
                                />
                                <path
                                    d={`M ${points}`}
                                    fill="none"
                                    stroke="#8D6E63"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Dot at the end */}
                                <circle cx="100" cy={100 - ((chartData[6] - minVal) / range) * 100} r="3" fill="#8D6E63" stroke="white" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mx-6 mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-soft">
                            <div className="flex items-center gap-2 mb-2 text-gray-400">
                                <Calendar size={14} />
                                <span className="text-[10px] font-bold uppercase">Adquisición</span>
                            </div>
                            <p className="font-bold text-moni-dark">12 Ene 2024</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-soft">
                            <div className="flex items-center gap-2 mb-2 text-gray-400">
                                <Activity size={14} />
                                <span className="text-[10px] font-bold uppercase">Rentabilidad</span>
                            </div>
                            <p className="font-bold text-moni-green">+ $1,250.00</p>
                        </div>
                    </div>

                    {/* Notes / Details */}
                    <div className="mx-6 bg-white rounded-3xl p-6 shadow-soft mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-moni-brown" />
                            <h4 className="font-bold text-moni-dark">Notas y Detalles</h4>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Este activo representa una parte fundamental de tu portafolio en la categoría de {categoryTitle}.
                            Mantén actualizado su valor de mercado periódicamente para tener un cálculo preciso de tu patrimonio neto.
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Última actualización</span>
                                <span className="font-medium text-moni-dark">Hoy, 10:42 AM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
