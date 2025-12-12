import React, { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Asset } from './AssetCard';
import PortfolioChart from './PortfolioChart';

interface AssetDetailViewProps {
    asset: Asset;
    onBack: () => void;
}

const TIME_RANGES = ['1D', '1W', '1M', '3M', 'YTD', '1Y', 'TODO'];

const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset, onBack }) => {
    console.log('AssetDetailView rendering with asset:', asset);

    const [selectedRange, setSelectedRange] = useState('1M');

    // Calculate values
    const marketValue = asset.currentPrice * asset.quantity;
    const totalCost = asset.purchasePrice * asset.quantity;
    const totalReturn = marketValue - totalCost;
    const totalReturnPercent = totalCost === 0 ? 0 : (totalReturn / totalCost) * 100;

    console.log('AssetDetailView calculated values:', { marketValue, totalCost, totalReturn });

    // Generate chart data based on time range
    const chartData = useMemo(() => {
        const steps = 40;
        const data = [];

        // Simple simulation: grow from purchase price to current price
        for (let i = 0; i < steps; i++) {
            const progress = i / (steps - 1);
            const price = asset.purchasePrice + (asset.currentPrice - asset.purchasePrice) * progress;
            const value = price * asset.quantity;

            // Generate date labels based on range
            let dateLabel = '';
            if (selectedRange === '1D') {
                dateLabel = `${9 + Math.floor(progress * 6.5)}:${String(Math.floor((progress * 390) % 60)).padStart(2, '0')}`;
            } else if (selectedRange === '1W') {
                const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                dateLabel = days[Math.floor(progress * 6)];
            } else {
                dateLabel = `${Math.floor(progress * 30) + 1}`;
            }

            data.push({ date: dateLabel, value });
        }
        return data;
    }, [asset, selectedRange]);

    const rangeStats = useMemo(() => {
        if (chartData.length === 0) return { profit: 0, profitPercent: 0, label: '' };

        const startValue = chartData[0].value;
        const profit = marketValue - startValue;
        const profitPercent = startValue === 0 ? 0 : (profit / startValue) * 100;

        const labels: Record<string, string> = {
            '1D': 'Hoy',
            '1W': 'Esta semana',
            '1M': 'Último mes',
            '3M': 'Últimos 3 meses',
            'YTD': 'Este año',
            '1Y': 'Último año',
            'TODO': 'Histórico'
        };

        return {
            profit,
            profitPercent,
            label: labels[selectedRange] || ''
        };
    }, [chartData, marketValue, selectedRange]);

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-white z-20 px-6 pt-8 pb-4 border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors mb-3"
                >
                    <ArrowLeft className="text-gray-800" size={24} />
                </button>
                <h1 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{asset.name}</h1>

                <div className="mt-2">
                    <h2 className="text-4xl font-bold text-[#5D4037]">
                        ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`flex items-center text-sm font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalReturn >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                            ${Math.abs(totalReturn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalReturnPercent.toFixed(2)}%)
                        </span>
                        <span className="text-gray-400 text-sm font-medium">Total</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-4">
                {/* Chart Card */}
                <div className="bg-white rounded-3xl p-6 shadow-lg ring-1 ring-black/5 mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rendimiento</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className={`text-2xl font-bold tracking-tight ${rangeStats.profit >= 0 ? 'text-[#5D4037]' : 'text-red-500'}`}>
                                    {rangeStats.profit >= 0 ? '+' : ''}${Math.abs(rangeStats.profit).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rangeStats.profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {rangeStats.profit >= 0 ? '+' : ''}{rangeStats.profitPercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-medium">{rangeStats.label}</p>
                        </div>
                    </div>

                    <PortfolioChart data={chartData} />

                    {/* Time Range Selectors */}
                    <div className="flex justify-between mt-6 px-1 border-t border-gray-100 pt-4">
                        {TIME_RANGES.map((range) => (
                            <button
                                key={range}
                                onClick={() => setSelectedRange(range)}
                                className={`text-[11px] font-bold rounded-lg px-2.5 py-1.5 transition-all ${selectedRange === range
                                    ? 'text-[#5D4037] bg-[#5D4037]/10'
                                    : 'text-gray-400 hover:text-[#5D4037] hover:bg-gray-50'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800">Tu Posición</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Cantidad</p>
                            <p className="text-lg font-bold text-gray-800">{asset.quantity.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Costo Promedio</p>
                            <p className="text-lg font-bold text-gray-800">${asset.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                            <span className="text-sm text-gray-500 font-medium">Valor de Mercado</span>
                            <span className="text-sm font-bold text-gray-800">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                            <span className="text-sm text-gray-500 font-medium">Precio Actual</span>
                            <span className="text-sm font-bold text-gray-800">${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 pt-3">
                            <span className="text-sm text-gray-500 font-medium">Rendimiento Total</span>
                            <span className={`text-sm font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalReturnPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#5D4037]/5 rounded-2xl p-6">
                        <h4 className="font-bold text-[#5D4037] mb-2">Detalles de Compra</h4>
                        <p className="text-sm text-gray-600">
                            Adquirido el {new Date(asset.purchaseDate).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} a ${asset.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailView;
