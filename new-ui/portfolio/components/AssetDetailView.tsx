import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownLeft, Zap, BarChart2 } from 'lucide-react';
import { Asset, AssetType, ChartDataPoint, Transaction, AssetSentiment } from '../types';
import PortfolioChart from './PortfolioChart';
import TradeModal from './TradeModal';
import { fetchAssetSentiment } from '../services/sentimentService';

interface AssetDetailViewProps {
  asset: Asset; 
  transactions?: Transaction[];
  onBack: () => void;
  onTrade?: (assetId: string, type: 'BUY' | 'SELL', quantity: number, price: number) => void;
}

const TIME_RANGES = ['1D', '1S', '1M', '3M', 'YTD', '1A', 'TODO'];

// Helper to generate path 
const generateAssetPath = (startPrice: number, endPrice: number, steps: number, volatility: number) => {
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

const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset, transactions = [], onBack, onTrade }) => {
  const [selectedRange, setSelectedRange] = useState('1D');
  const [historyCache, setHistoryCache] = useState<Record<string, number[]>>({});
  const [sentiment, setSentiment] = useState<AssetSentiment | null>(null);
  
  // Trade Modal State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  // Load Sentiment
  useEffect(() => {
    fetchAssetSentiment(asset.symbol).then(setSentiment);
  }, [asset.symbol]);

  // When selectedRange changes or component mounts, generate the "history" part of the chart
  useEffect(() => {
    // Determine start price based on range
    const cache: Record<string, number[]> = {};
    const basePrice = asset.currentPrice;

    TIME_RANGES.forEach(range => {
        let startPrice = 0;
        let steps = 50;
        let volatility = asset.type === AssetType.CRYPTO ? 5 : 2;

        switch (range) {
            case '1D': 
                // Start slightly different to simulate daily movement
                startPrice = basePrice * (1 + (Math.random() * 0.02 - 0.01)); 
                steps = 40; 
                break;
            case '1S': startPrice = basePrice * 0.96; steps = 30; break;
            case '1M': startPrice = basePrice * 0.92; steps = 30; break;
            case '3M': startPrice = basePrice * 0.88; steps = 40; break;
            case 'YTD': startPrice = basePrice * 0.80; steps = 50; break;
            case '1A': startPrice = basePrice * 0.75; steps = 50; break;
            case 'TODO': startPrice = asset.purchasePrice; steps = 60; break;
            default: startPrice = basePrice;
        }
        
        // Generate a static path that ends at the current basePrice
        cache[range] = generateAssetPath(startPrice, basePrice, steps, volatility);
    });

    setHistoryCache(cache);
  }, []); 

  // Combined Data: Static History + Live Current Price
  const chartData = useMemo(() => {
    if (!historyCache[selectedRange]) return [];

    const history = historyCache[selectedRange];
    const liveHistory = [...history.slice(0, -1), asset.currentPrice];
    
    const now = new Date();
    return liveHistory.map((val, i) => {
        const ratio = i / (liveHistory.length - 1);
        const inverseRatio = 1 - ratio;
        let dateLabel = '';

        if (selectedRange === '1D') {
             const d = new Date(now.getTime() - (inverseRatio * 6.5 * 60 * 60 * 1000));
             dateLabel = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else if (selectedRange === '1A' || selectedRange === 'TODO') {
             const d = new Date(now.getTime() - (inverseRatio * 365 * 24 * 60 * 60 * 1000));
             dateLabel = d.toLocaleDateString('es-ES', { month: 'short' });
        } else {
             const days = selectedRange === '1S' ? 7 : 30;
             const d = new Date(now.getTime() - (inverseRatio * days * 24 * 60 * 60 * 1000));
             dateLabel = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        }

        return { date: dateLabel, value: val * asset.quantity }; 
    });

  }, [selectedRange, historyCache, asset.currentPrice, asset.quantity]); 


  // Live Stats Calculation
  const marketValue = asset.currentPrice * asset.quantity;
  const totalCost = asset.purchasePrice * asset.quantity;
  const totalReturn = marketValue - totalCost;
  const totalReturnPercent = totalCost === 0 ? 0 : (totalReturn / totalCost) * 100;
  
  const todayStartPrice = historyCache['1D'] ? historyCache['1D'][0] : asset.currentPrice;
  const todayStartValue = todayStartPrice * asset.quantity;
  const todayReturn = marketValue - todayStartValue;
  const todayReturnPercent = todayStartValue === 0 ? 0 : (todayReturn / todayStartValue) * 100;

  const handleOpenTrade = (type: 'BUY' | 'SELL') => {
    setTradeType(type);
    setIsTradeModalOpen(true);
  };

  const handleConfirmTrade = (quantity: number, price: number) => {
    if (onTrade) {
      onTrade(asset.id, tradeType, quantity, price);
    }
  };

  const getSentimentColor = (status: string) => {
      switch(status) {
          case 'Bullish': return 'text-green-600 bg-green-50';
          case 'Bearish': return 'text-red-600 bg-red-50';
          default: return 'text-gray-600 bg-gray-50';
      }
  };

  const getSentimentBarColor = (status: string) => {
      switch(status) {
          case 'Bullish': return 'bg-green-500';
          case 'Bearish': return 'bg-red-500';
          default: return 'bg-yellow-400';
      }
  };

  return (
    <div className="min-h-screen bg-white pb-10 animate-fade-in relative">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 px-6 pt-12 pb-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors mb-2"
        >
          <ArrowLeft className="text-gray-800" size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-500 uppercase tracking-wide">{asset.name}</h1>
        
        <div className="mt-1">
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

      {/* Chart */}
      <div className="h-80 w-full mb-6">
         <PortfolioChart data={chartData} />
      </div>

      {/* Range Selector */}
      <div className="flex justify-between px-6 border-b border-gray-100 pb-6 mb-6">
        {TIME_RANGES.map((range) => (
        <button 
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`text-[11px] font-bold rounded-lg px-3 py-2 transition-all ${
            selectedRange === range 
                ? 'text-[#5D4037] bg-[#5D4037]/10' 
                : 'text-gray-400 hover:text-[#5D4037] hover:bg-gray-50'
            }`}
        >
            {range}
        </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 px-6 mb-6">
          <button 
              onClick={() => handleOpenTrade('BUY')}
              className="flex-1 bg-[#5D4037] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#5D4037]/20 active:scale-[0.98] transition-transform hover:bg-[#4E342E]"
          >
              Comprar
          </button>
          <button 
              onClick={() => handleOpenTrade('SELL')}
              className="flex-1 bg-[#EFEBE9] text-[#5D4037] font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform hover:bg-[#D7CCC8]"
          >
              Vender
          </button>
      </div>

      {/* Stats Cards */}
      <div className="px-6 space-y-6">
        <h3 className="text-lg font-bold text-gray-800">Tu Posición</h3>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Acciones</p>
                <p className="text-lg font-bold text-gray-800">{asset.quantity.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Costo Promedio</p>
                <p className="text-lg font-bold text-gray-800">${asset.purchasePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5">
             <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                 <span className="text-sm text-gray-500 font-medium">Valor de Mercado</span>
                 <span className="text-sm font-bold text-gray-800">${marketValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                 <span className="text-sm text-gray-500 font-medium">Rendimiento Hoy (Est.)</span>
                 <span className={`text-sm font-bold ${todayReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     {todayReturn >= 0 ? '+' : ''}{todayReturn.toLocaleString(undefined, {minimumFractionDigits: 2})} ({todayReturnPercent.toFixed(2)}%)
                 </span>
             </div>
             <div className="flex justify-between items-center py-2 pt-3">
                 <span className="text-sm text-gray-500 font-medium">Rendimiento Total</span>
                 <span className={`text-sm font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2})} ({totalReturnPercent.toFixed(2)}%)
                 </span>
             </div>
        </div>

        {/* Transaction History (Moved Here) */}
        <div>
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Clock size={18} className="text-gray-400"/>
               Historial Reciente
             </h3>
             {transactions.length > 0 ? (
               <div className="space-y-3">
                 {transactions.map(tx => (
                   <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'}`}>
                           {tx.type === 'BUY' 
                             ? <ArrowDownLeft size={16} className="text-green-600" /> 
                             : <ArrowUpRight size={16} className="text-red-600" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-800">{tx.type === 'BUY' ? 'Compra' : 'Venta'} de {asset.symbol}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {new Date(tx.date).toLocaleDateString()}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-sm font-bold ${tx.type === 'BUY' ? 'text-gray-800' : 'text-gray-800'}`}>
                           {tx.type === 'BUY' ? '+' : '-'}{tx.quantity} u.
                         </p>
                         <p className="text-xs text-gray-400">@ ${tx.price.toLocaleString()}</p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-gray-400 text-sm">No hay transacciones recientes.</p>
             )}
        </div>

        {/* Market Sentiment Card */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-[#5D4037]" fill="#5D4037" />
                <h3 className="text-lg font-bold text-gray-800">Sentimiento del Mercado</h3>
            </div>
            
            {sentiment ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                         <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSentimentColor(sentiment.status)}`}>
                             {sentiment.status}
                         </div>
                         <span className="text-xs text-gray-400 font-medium">{sentiment.lastUpdated}</span>
                    </div>

                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <span className="text-xs font-semibold inline-block text-gray-600">
                                Score de Confianza
                            </span>
                            <span className="text-xs font-bold inline-block text-[#5D4037]">
                                {sentiment.score}/100
                            </span>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                            <div 
                                style={{ width: `${sentiment.score}%` }} 
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getSentimentBarColor(sentiment.status)} transition-all duration-1000`}
                            ></div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-[#5D4037] pl-3 italic">
                        "{sentiment.summary}"
                    </p>
                </div>
            ) : (
                <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5D4037]"></div>
                </div>
            )}
        </div>

        <div className="bg-[#5D4037]/5 rounded-2xl p-6 mt-4">
            <h4 className="font-bold text-[#5D4037] mb-2">Precio en Vivo</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
                Precio actual: ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                {asset.type === AssetType.CRYPTO 
                  ? " Datos obtenidos en tiempo real de Binance Public API." 
                  : " Datos de mercado simulados basados en volatilidad histórica."}
            </p>
        </div>
      </div>

      <TradeModal 
        isOpen={isTradeModalOpen}
        type={tradeType}
        assetSymbol={asset.symbol}
        currentPrice={asset.currentPrice}
        onClose={() => setIsTradeModalOpen(false)}
        onConfirm={handleConfirmTrade}
      />
    </div>
  );
};

export default AssetDetailView;