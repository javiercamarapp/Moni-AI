
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Asset, AssetType, ChartDataPoint, Transaction } from './types';
import AssetCard from './components/AssetCard';
import BottomNav from './components/BottomNav';
import AddAssetModal from './components/AddAssetModal';
import PortfolioChart from './components/PortfolioChart';
import AssetDetailView from './components/AssetDetailView';
import { marketService } from './services/marketDataService';

// Initial Data with realistic starting points
const INITIAL_ASSETS: Asset[] = [
  { id: '1', symbol: 'NVDA', name: 'NVIDIA Corp', type: AssetType.STOCK, quantity: 50, purchasePrice: 45.00, purchaseDate: '2022-05-15', currentPrice: 118.50 }, 
  { id: '2', symbol: 'BTC', name: 'Bitcoin', type: AssetType.CRYPTO, quantity: 0.25, purchasePrice: 28500, purchaseDate: '2023-01-10', currentPrice: 62450.00 },
  { id: '3', symbol: 'AAPL', name: 'Apple Inc', type: AssetType.STOCK, quantity: 30, purchasePrice: 145.00, purchaseDate: '2022-05-20', currentPrice: 221.80 }, 
  { id: '4', symbol: 'ETH', name: 'Ethereum', type: AssetType.CRYPTO, quantity: 4.0, purchasePrice: 1800, purchaseDate: '2023-11-05', currentPrice: 2450.00 },
  { id: '5', symbol: 'VOO', name: 'Vanguard S&P 500', type: AssetType.ETF, quantity: 15, purchasePrice: 350.00, purchaseDate: '2021-03-15', currentPrice: 510.20 }, 
];

// Initial Dummy Transactions to populate history
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', assetId: '1', type: 'BUY', quantity: 50, price: 45.00, date: '2022-05-15T10:00:00Z' },
  { id: 't2', assetId: '2', type: 'BUY', quantity: 0.25, price: 28500, date: '2023-01-10T14:30:00Z' },
  { id: 't3', assetId: '3', type: 'BUY', quantity: 30, price: 145.00, date: '2022-05-20T09:15:00Z' },
];

const TIME_RANGES = ['1D', '1S', '1M', '3M', 'YTD', '1A', 'TODO'];

const isStockMarketOpen = () => {
  const now = new Date();
  const day = now.getDay(); 
  const hour = now.getHours();
  if (day === 0 || day === 6) return false;
  if (hour >= 9 && hour < 16) return true;
  return false;
};

// Generate a random walk path ONCE
const generateStaticPath = (startPrice: number, endPrice: number, steps: number, volatility: number) => {
  let current = 0;
  const rawPoints = [0];
  
  for(let i = 0; i < steps - 1; i++) {
      const change = (Math.random() - 0.5) * volatility; 
      current += change;
      rawPoints.push(current);
  }
  
  const first = rawPoints[0];
  const last = rawPoints[rawPoints.length - 1];
  const denominator = last - first === 0 ? 1 : last - first;
  
  return rawPoints.map(val => {
      const progress = (val - first) / denominator;
      const calculatedValue = startPrice + (progress * (endPrice - startPrice));
      return Math.max(0, calculatedValue);
  });
};

const App: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STOCK' | 'CRYPTO' | 'DIGITAL'>('ALL');
  const [selectedRange, setSelectedRange] = useState('1D');
  const [marketStatus, setMarketStatus] = useState(isStockMarketOpen());
  
  // Cache historical data so the chart shape doesn't change on every tick
  const [historyCache, setHistoryCache] = useState<Record<string, number[]>>({});
  const [baseTotalValue, setBaseTotalValue] = useState<number>(0);

  // Calculate Totals
  const { currentTotalValue } = useMemo(() => {
    const curr = assets.reduce((acc, a) => acc + (a.currentPrice * a.quantity), 0);
    return { currentTotalValue: curr };
  }, [assets]);

  // Initial Data Generation (Runs Once)
  useEffect(() => {
    const initialTotal = assets.reduce((acc, a) => acc + (a.currentPrice * a.quantity), 0);
    setBaseTotalValue(initialTotal);

    const cache: Record<string, number[]> = {};

    TIME_RANGES.forEach(range => {
        let startValue = 0;
        let steps = 50;
        let volatility = 1;

        switch (range) {
            case '1D':
                startValue = initialTotal * (1 - (Math.random() * 0.008 - 0.004)); 
                steps = 60;
                volatility = 4;
                break;
            case '1S': startValue = initialTotal * 0.98; steps = 40; volatility = 3; break;
            case '1M': startValue = initialTotal * 0.95; steps = 40; volatility = 2; break;
            case '3M': startValue = initialTotal * 0.90; steps = 50; volatility = 2; break;
            case 'YTD': startValue = initialTotal * 0.82; steps = 50; volatility = 2; break;
            case '1A': startValue = initialTotal * 0.75; steps = 60; volatility = 1.5; break;
            case 'TODO': 
                const invested = assets.reduce((acc, a) => acc + (a.purchasePrice * a.quantity), 0);
                startValue = invested; 
                steps = 80; 
                volatility = 1; 
                break;
            default: startValue = initialTotal;
        }
        cache[range] = generateStaticPath(startValue, initialTotal, steps, volatility);
    });

    setHistoryCache(cache);
  }, []); 

  // Market Service Integration
  useEffect(() => {
    // Check market hours
    const checkMarket = setInterval(() => {
        setMarketStatus(isStockMarketOpen());
    }, 60000);

    // Subscribe to all assets
    const handlePriceUpdate = (symbol: string, newPrice: number) => {
        setAssets(prevAssets => prevAssets.map(asset => {
            if (asset.symbol === symbol) {
                return { ...asset, currentPrice: newPrice };
            }
            return asset;
        }));
    };

    assets.forEach(asset => {
        marketService.subscribe(asset.symbol, asset.type, asset.currentPrice, handlePriceUpdate);
    });

    return () => {
        clearInterval(checkMarket);
        assets.forEach(asset => {
             // In a real app we would unsubscribe
        });
    };
  }, []); 

  // Construct Chart Data
  const { chartData, rangeStats } = useMemo(() => {
    if (!historyCache[selectedRange] || currentTotalValue === 0) {
        return { chartData: [], rangeStats: { profit: 0, profitPercent: 0, label: '' } };
    }

    const history = historyCache[selectedRange];
    const liveHistory = [...history.slice(0, -1), currentTotalValue];
    const totalPoints = liveHistory.length;
    const now = new Date();

    const getFormattedDate = (index: number, range: string): string => {
        const ratio = index / (totalPoints - 1);
        const inverseRatio = 1 - ratio;

        if (range === '1D') {
            const startOfDay = new Date(now);
            startOfDay.setHours(9, 30, 0, 0);
            const minutesToAdd = ratio * 390; 
            const pointTime = new Date(startOfDay.getTime() + minutesToAdd * 60000);
            return pointTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else if (range === '1S') {
            const d = new Date(now.getTime() - (inverseRatio * 7 * 24 * 60 * 60 * 1000));
            const day = d.toLocaleDateString('es-ES', { weekday: 'short' });
            return day.charAt(0).toUpperCase() + day.slice(1);
        } else if (range === '1M' || range === '3M') {
            const days = range === '1M' ? 30 : 90;
            const d = new Date(now.getTime() - (inverseRatio * days * 24 * 60 * 60 * 1000));
            return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        } else if (range === 'YTD') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const diffTime = now.getTime() - startOfYear.getTime();
            const d = new Date(startOfYear.getTime() + (ratio * diffTime));
            return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        } else if (range === '1A') {
            const d = new Date(now.getTime() - (inverseRatio * 365 * 24 * 60 * 60 * 1000));
            return d.toLocaleDateString('es-ES', { month: 'short' });
        } else if (range === 'TODO') {
            const d = new Date(now.getTime() - (inverseRatio * 5 * 365 * 24 * 60 * 60 * 1000));
            return d.getFullYear().toString();
        }
        return '';
    };

    let label = '';
    switch (selectedRange) {
        case '1D': label = 'Hoy'; break;
        case '1S': label = 'Esta semana'; break;
        case '1M': label = 'Último mes'; break;
        case '3M': label = 'Últimos 3 meses'; break;
        case 'YTD': label = 'Este año (YTD)'; break;
        case '1A': label = 'Último año'; break;
        case 'TODO': label = 'Histórico'; break;
    }

    const dataPoints: ChartDataPoint[] = liveHistory.map((val, i) => ({
        date: getFormattedDate(i, selectedRange),
        value: Math.max(0, val)
    }));

    const startValue = history[0];
    const profit = currentTotalValue - startValue;
    const profitPercent = startValue === 0 ? 0 : (profit / startValue) * 100;

    return {
        chartData: dataPoints,
        rangeStats: { profit, profitPercent, label }
    };
  }, [selectedRange, currentTotalValue, historyCache]);


  const handleAddAsset = (newAssetData: any) => {
    const newAsset: Asset = {
      ...newAssetData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setAssets([...assets, newAsset]);
    
    // Also record as a BUY transaction
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      assetId: newAsset.id,
      type: 'BUY',
      quantity: newAsset.quantity,
      price: newAsset.purchasePrice,
      date: new Date().toISOString()
    }
    setTransactions(prev => [newTx, ...prev]);

    marketService.subscribe(newAsset.symbol, newAsset.type, newAsset.currentPrice, (sym, price) => {
        setAssets(prev => prev.map(a => a.symbol === sym ? {...a, currentPrice: price} : a));
    });
  };

  const handleTrade = (assetId: string, type: 'BUY' | 'SELL', quantity: number, price: number) => {
    // 1. Add Transaction
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      assetId,
      type,
      quantity,
      price,
      date: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);

    // 2. Update Asset Quantity & Average Cost
    setAssets(prevAssets => prevAssets.map(asset => {
      if (asset.id !== assetId) return asset;

      if (type === 'BUY') {
        const totalCostOld = asset.quantity * asset.purchasePrice;
        const totalCostNew = quantity * price;
        const newQuantity = asset.quantity + quantity;
        const newAvgCost = (totalCostOld + totalCostNew) / newQuantity;
        
        return {
          ...asset,
          quantity: newQuantity,
          purchasePrice: newAvgCost
        };
      } else {
        // Sell - FIFO usually, but for simple tracker we keep avg cost same, just reduce qty
        const newQuantity = Math.max(0, asset.quantity - quantity);
        return {
          ...asset,
          quantity: newQuantity
        };
      }
    }));
  };

  const filteredAssets = assets.filter(a => {
    if (activeFilter === 'ALL') return true;
    return a.type === activeFilter;
  });

  const activeAsset = assets.find(a => a.id === selectedAssetId);
  const activeTransactions = transactions.filter(t => t.assetId === selectedAssetId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Render Detail View if an asset is selected
  if (activeAsset) {
      return (
        <AssetDetailView 
            asset={activeAsset} 
            transactions={activeTransactions}
            onBack={() => setSelectedAssetId(null)} 
            onTrade={handleTrade}
        />
      );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden bg-[#F5F5F5]">
      
      {/* Brown Background Header */}
      <div className="bg-[#5D4037] pb-32 pt-6 px-6 rounded-b-[40px] shadow-lg relative z-0">
        <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
            <div>
                <p className="text-[10px] text-[#D7CCC8] font-bold uppercase tracking-widest">Portafolio Total</p>
                <h1 className="text-3xl font-bold font-['DM_Sans'] tracking-tight text-white">
                ${currentTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
                {!marketStatus && (
                    <div className="flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                        <span className="text-[10px] text-[#D7CCC8]/80 font-medium">Mercado Cerrado (Solo Cripto Activo)</span>
                    </div>
                )}
            </div>
            </div>
        </div>
      </div>

      {/* Main Content - Pulled up with negative margin to overlap header */}
      <div className="relative z-10 px-6 -mt-32 max-w-md mx-auto">

        {/* Main Chart Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 ring-1 ring-black/5">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rendimiento</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-bold tracking-tight ${rangeStats.profit >= 0 ? 'text-[#5D4037]' : 'text-red-500'}`}>
                           {rangeStats.profit >= 0 ? '+' : ''}${Math.abs(rangeStats.profit).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0})}
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
            
            {/* The Chart */}
            <PortfolioChart data={chartData} />
            
            {/* Time Range Selectors */}
            <div className="flex justify-between mt-6 px-1 border-t border-gray-100 pt-4">
              {TIME_RANGES.map((range) => (
                <button 
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`text-[11px] font-bold rounded-lg px-2.5 py-1.5 transition-all ${
                    selectedRange === range 
                      ? 'text-[#5D4037] bg-[#5D4037]/10' 
                      : 'text-gray-400 hover:text-[#5D4037] hover:bg-gray-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
        </div>

        {/* Filters - Inversiones */}
        <div className="mb-4 mt-8 px-1">
             <h2 className="text-lg font-bold text-gray-800 mb-3">Mis Inversiones</h2>
             <div className="flex gap-1.5">
                 {(['ALL', 'STOCK', 'CRYPTO', 'DIGITAL'] as const).map(f => (
                     <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                          activeFilter === f 
                          ? 'bg-[#5D4037] text-white shadow-md' 
                          : 'bg-white text-gray-400 hover:bg-gray-50 shadow-sm'
                        }`}
                     >
                         {f === 'ALL' ? 'Todos' : f}
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
         className="fixed bottom-24 right-6 bg-[#5D4037] text-white w-14 h-14 rounded-full shadow-xl shadow-[#5D4037]/40 z-40 active:scale-90 transition-transform flex items-center justify-center hover:bg-[#4E342E]"
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

export default App;
