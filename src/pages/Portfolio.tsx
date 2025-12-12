import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import AssetCard, { Asset, AssetType } from '@/components/portfolio/AssetCard';
import PortfolioChart from '@/components/portfolio/PortfolioChart';
import AddAssetModal from '@/components/portfolio/AddAssetModal';
import AssetDetailView from '@/components/portfolio/AssetDetailView';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketService } from '@/services/marketDataService';
import { toast } from 'sonner';
import { SectionLoader } from '@/components/SectionLoader';

const TIME_RANGES = ['1D', '1S', '1M', '3M', 'YTD', '1A', 'TODO'];

// Map database categories to AssetType
const categoryToAssetType = (categoria: string): AssetType => {
  const cat = categoria.toLowerCase();
  if (cat.includes('cripto')) return AssetType.CRYPTO;
  if (cat.includes('accion') || cat.includes('etf')) return AssetType.STOCK;
  if (cat.includes('etf')) return AssetType.ETF;
  return AssetType.STOCK;
};

// Parse subcategoria to extract quantity and price
const parseSubcategoria = (subcategoria: string | null): { quantity: number; price: number } => {
  if (!subcategoria) return { quantity: 1, price: 0 };
  
  // Format: "X acciones @ $Y" or "X unidades @ $Y"
  const match = subcategoria.match(/^([\d.]+)\s*(?:acciones|unidades)\s*@\s*\$?([\d.]+)/i);
  if (match) {
    return {
      quantity: parseFloat(match[1]) || 1,
      price: parseFloat(match[2]) || 0
    };
  }
  return { quantity: 1, price: 0 };
};

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | AssetType>('ALL');
  const [selectedRange, setSelectedRange] = useState('1M');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [liveAssets, setLiveAssets] = useState<Asset[]>([]);

  // Fetch user's investment assets from database
  const { data: dbAssets, isLoading, error } = useQuery({
    queryKey: ['portfolio-assets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Fetch from activos table - filter for investment categories
      const { data, error } = await supabase
        .from('activos')
        .select('*')
        .eq('user_id', user.id)
        .or('categoria.ilike.%Acciones%,categoria.ilike.%Cripto%,categoria.ilike.%ETF%');

      if (error) throw error;
      return data || [];
    }
  });

  // Transform DB assets to Asset format
  const transformedAssets = useMemo(() => {
    if (!dbAssets) return [];
    
    return dbAssets.map(asset => {
      const parsed = parseSubcategoria(asset.subcategoria);
      const assetType = categoryToAssetType(asset.categoria);
      
      return {
        id: asset.id,
        symbol: asset.nombre.split(' ')[0].toUpperCase(), // First word as symbol
        name: asset.nombre,
        type: assetType,
        quantity: parsed.quantity || 1,
        purchasePrice: parsed.price || (asset.valor || 0),
        purchaseDate: asset.fecha_adquisicion || asset.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        currentPrice: parsed.price || (asset.valor || 0) // Will be updated by market service
      };
    });
  }, [dbAssets]);

  // Initialize live assets from transformed assets
  useEffect(() => {
    if (transformedAssets.length > 0 && liveAssets.length === 0) {
      setLiveAssets(transformedAssets);
    }
  }, [transformedAssets]);

  // Subscribe to market updates
  useEffect(() => {
    if (liveAssets.length === 0) return;

    const handlePriceUpdate = (symbol: string, newPrice: number) => {
      setLiveAssets(prev => prev.map(asset => 
        asset.symbol === symbol ? { ...asset, currentPrice: newPrice } : asset
      ));
    };

    liveAssets.forEach(asset => {
      marketService.subscribe(asset.symbol, asset.type, asset.currentPrice, handlePriceUpdate);
    });

    return () => {
      marketService.unsubscribeAll();
    };
  }, [liveAssets.length]);

  // Use live assets or transformed if no live updates yet
  const assets = liveAssets.length > 0 ? liveAssets : transformedAssets;

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const currentTotalValue = useMemo(() => {
    return assets.reduce((acc, a) => acc + (a.currentPrice * a.quantity), 0);
  }, [assets]);

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
      } else if (selectedRange === '1S') {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        dateLabel = days[Math.floor(progress * 6)];
      } else {
        dateLabel = `${Math.floor(progress * 30) + 1}`;
      }

      data.push({ date: dateLabel, value });
    }
    return data;
  }, [assets, currentTotalValue, selectedRange]);

  const rangeStats = useMemo(() => {
    if (chartData.length === 0) return { profit: 0, profitPercent: 0, label: '' };

    const startValue = chartData[0].value;
    const profit = currentTotalValue - startValue;
    const profitPercent = startValue === 0 ? 0 : (profit / startValue) * 100;

    const labels: Record<string, string> = {
      '1D': 'Hoy',
      '1S': 'Esta semana',
      '1M': 'Último mes',
      '3M': 'Últimos 3 meses',
      'YTD': 'Este año',
      '1A': 'Último año',
      'TODO': 'Histórico'
    };

    return { profit, profitPercent, label: labels[selectedRange] || '' };
  }, [chartData, currentTotalValue, selectedRange]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (activeFilter === 'ALL') return true;
      return a.type === activeFilter;
    });
  }, [assets, activeFilter]);

  const handleAddAsset = async (newAssetData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return;
      }

      // Map AssetType to category
      const categoryMap: Record<AssetType, string> = {
        [AssetType.STOCK]: 'Acciones y ETFs',
        [AssetType.CRYPTO]: 'Criptomonedas',
        [AssetType.ETF]: 'Acciones y ETFs',
        [AssetType.DIGITAL]: 'Activos Digitales'
      };

      const totalValue = newAssetData.quantity * newAssetData.purchasePrice;

      const { data, error } = await supabase.from('activos').insert({
        user_id: user.id,
        nombre: newAssetData.name || newAssetData.symbol,
        valor: totalValue,
        categoria: categoryMap[newAssetData.type as AssetType] || 'Acciones y ETFs',
        subcategoria: `${newAssetData.quantity} ${newAssetData.type === AssetType.CRYPTO ? 'unidades' : 'acciones'} @ $${newAssetData.purchasePrice}`,
        moneda: 'MXN',
        es_activo_fijo: false,
        liquidez_porcentaje: newAssetData.type === AssetType.CRYPTO ? 85 : 90,
        fecha_adquisicion: newAssetData.purchaseDate
      }).select().single();

      if (error) throw error;

      // Add to local state immediately
      const newAsset: Asset = {
        id: data.id,
        symbol: newAssetData.symbol.toUpperCase(),
        name: newAssetData.name || newAssetData.symbol,
        type: newAssetData.type,
        quantity: newAssetData.quantity,
        purchasePrice: newAssetData.purchasePrice,
        purchaseDate: newAssetData.purchaseDate,
        currentPrice: newAssetData.purchasePrice
      };

      setLiveAssets(prev => [...prev, newAsset]);
      
      // Subscribe to market updates for new asset
      marketService.subscribe(newAsset.symbol, newAsset.type, newAsset.currentPrice, (sym, price) => {
        setLiveAssets(prev => prev.map(a => a.symbol === sym ? { ...a, currentPrice: price } : a));
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['portfolio-assets'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth'] });

      toast.success('Inversión agregada correctamente');
    } catch (err) {
      console.error('Error adding asset:', err);
      toast.error('Error al agregar inversión');
    }
  };

  if (selectedAsset) {
    return (
      <AssetDetailView
        asset={selectedAsset}
        onBack={() => setSelectedAssetId(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAF9] to-white flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
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
              className="h-10 w-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#5D4037] hover:bg-white shadow-sm hover:shadow-md transition-all"
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
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-2">
                {assets.length === 0 
                  ? 'No tienes inversiones registradas aún.' 
                  : 'No hay activos en esta categoría.'}
              </p>
              {assets.length === 0 && (
                <p className="text-gray-400 text-xs">
                  Agrega tu primera inversión para comenzar a trackear tu portafolio.
                </p>
              )}
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
