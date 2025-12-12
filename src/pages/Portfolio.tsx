import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import AssetCard, { Asset, AssetType } from '@/components/portfolio/AssetCard';
import PortfolioChart from '@/components/portfolio/PortfolioChart';
import AddAssetModal from '@/components/portfolio/AddAssetModal';
import AssetDetailView from '@/components/portfolio/AssetDetailView';
import BottomNav from '@/components/BottomNav';

// Sample initial data for demonstration
const INITIAL_ASSETS: Asset[] = [
    { id: '1', symbol: 'NVDA', name: 'NVIDIA Corp', type: AssetType.STOCK, quantity: 50, purchasePrice: 45.00, purchaseDate: '2022-05-15', currentPrice: 118.50 },
    { id: '2', symbol: 'BTC', name: 'Bitcoin', type: AssetType.CRYPTO, quantity: 0.25, purchasePrice: 28500, purchaseDate: '2023-01-10', currentPrice: 62450.00 },
    { id: '3', symbol: 'VOO', name: 'Vanguard S&P 500', type: AssetType.ETF, quantity: 15, purchasePrice: 350.00, purchaseDate: '2021-03-15', currentPrice: 510.20 },
];

const TIME_RANGES = ['1D', '1W', '1M', '3M', 'YTD', '1Y', 'TODO'];

const Portfolio: React.FC = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'ALL' | AssetType>('ALL');
    const [selectedRange, setSelectedRange] = useState('1M');
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS

    // Get selected asset
    const selectedAsset = assets.find(a => a.id === selectedAssetId);

    // Calculate total portfolio value
    const currentTotalValue = useMemo(() => {
        return assets.reduce((acc, a) => acc + (a.currentPrice * a.quantity), 0);
    }, [assets]);

    // Generate chart data based on time range
    const chartData = useMemo(() => {
        const steps = 40;
        const data = [];
        const invested = assets.reduce((acc, a) => acc + (a.purchasePrice * a.quantity), 0);

        for (let i = 0; i < steps; i++) {
            const progress = i / (steps - 1);
            const value = invested + (currentTotalValue - invested) * progress;

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
    }, [assets, currentTotalValue, selectedRange]);

    // Calculate stats for selected range
    const rangeStats = useMemo(() => {
        if (chartData.length === 0) return { profit: 0, profitPercent: 0, label: '' };

        const startValue = chartData[0].value;
        const profit = currentTotalValue - startValue;
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
    }, [chartData, currentTotalValue, selectedRange]);

    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            if (activeFilter === 'ALL') return true;
            return a.type === activeFilter;
        });
    }, [assets, activeFilter]);

    const handleAddAsset = (newAssetData: any) => {
        const newAsset: Asset = {
            ...newAssetData,
            id: Math.random().toString(36).substr(2, 9),
        };
        setAssets([...assets, newAsset]);
    };

    // NOW we can have conditional returns AFTER all hooks are declared
    if (selectedAsset) {
        return (
            <AssetDetailView
                asset={selectedAsset}
                onBack={() => setSelectedAssetId(null)}
            />
        );
    }

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden bg-gradient-to-b from-[#FAFAF9] to-white">

            {/* Brown Background Header */}
            <div className="bg-[#5D4037] pb-32 pt-6 px-6 rounded-b-[40px] shadow-lg relative z-0">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <p className="text-[10px] text-[#D7CCC8] font-bold uppercase tracking-widest">Portafolio Total</p>
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                ${currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 px-6 -mt-32 max-w-5xl mx-auto">

                {/* Main Chart Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 ring-1 ring-black/5">
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

                {/* Filters */}
                <div className="mb-4 mt-8 px-1">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Mis Inversiones</h2>
                    <div className="flex gap-1.5">
                        {(['ALL', AssetType.STOCK, AssetType.CRYPTO, AssetType.ETF] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${activeFilter === f
                                    ? 'bg-[#5D4037] text-white shadow-md'
                                    : 'bg-white text-gray-400 hover:bg-gray-50 shadow-sm'
                                    }`}
                            >
                                {f === 'ALL' ? 'Todos' : f === AssetType.STOCK ? 'Acciones' : f === AssetType.CRYPTO ? 'Cripto' : 'ETF'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Asset List */}
                <div className="pb-28 space-y-3">
                    {filteredAssets.length > 0 ? (
                        filteredAssets.map((asset) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                onClick={() => setSelectedAssetId(asset.id)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            No hay activos en esta categoría.
                        </div>
                    )}

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full border-2 border-dashed border-[#D7CCC8] rounded-2xl p-4 flex items-center justify-center gap-2 text-[#8D6E63] font-bold hover:bg-[#F8F5F2] transition-colors active:scale-[0.99]"
                    >
                        <Plus size={20} />
                        Agregar Inversión
                    </button>
                </div>

            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-24 right-6 md:bottom-16 md:right-10 bg-[#5D4037] text-white w-14 h-14 rounded-full shadow-xl shadow-[#5D4037]/40 z-40 active:scale-90 transition-transform flex items-center justify-center hover:bg-[#4E342E]"
            >
                <Plus size={28} />
            </button>

            <AddAssetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddAsset}
            />

            <BottomNav />
        </div>
    );
};

export default Portfolio;
