import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Download, ListFilter, Wallet, Bitcoin, Plus } from 'lucide-react';
import { headingPage, headingSection } from '@/styles/typography';
import { FilterDropdown } from '@/components/networth/new-ui/FilterDropdown';
import { AssetCard } from '@/components/networth/new-ui/AssetCard';
import { useNavigate } from 'react-router-dom';
import { useNetWorth, useHasNetWorthData, TimeRange, ChartDataPoint } from '@/hooks/useNetWorth';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import networthIntro from "@/assets/networth-coins-bg.png";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';

// Time ranges matching portfolio design
const TIME_RANGES: TimeRange[] = ['1M', '3M', '6M', '1Y', 'All'];

// Portfolio-style Chart Component
const NetWorthChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-gray-400">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5D4037" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#5D4037" stopOpacity={0}/>
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
            formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#5D4037" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorNetWorth)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Reusable Section Header
const SectionHeader = ({
  title,
  onFilterClick,
  isFilterActive,
  children
}: {
  title: string,
  onFilterClick: () => void,
  isFilterActive: boolean,
  children?: React.ReactNode
}) => (
  <div className="flex justify-between items-center mb-4 mt-8 relative z-30">
    <h2 className={headingSection}>{title}</h2>
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFilterClick();
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border text-xs font-semibold transition-colors ${isFilterActive ? 'bg-[#8D6E63] text-white border-[#8D6E63]' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
      >
        <ListFilter size={14} />
        Filtrar
      </button>
      {children}
    </div>
  </div>
);

const NetWorth: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');

  // Filtering States
  const [showLiquidityFilters, setShowLiquidityFilters] = useState(false);
  const [liquidityBank, setLiquidityBank] = useState('Todas');

  const [showSemiLiquidityFilters, setShowSemiLiquidityFilters] = useState(false);
  const [semiLiquidityTag, setSemiLiquidityTag] = useState('Todos');

  // Data Fetching
  const { data: hasData, isLoading: checkingData } = useHasNetWorthData();
  const { data: netWorthData, isLoading: loadingData } = useNetWorth(selectedRange);

  // Get range label
  const getRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case '1M': return 'Último mes';
      case '3M': return 'Últimos 3 meses';
      case '6M': return 'Últimos 6 meses';
      case '1Y': return 'Último año';
      case 'All': return 'Histórico';
      default: return '';
    }
  };

  // Derived Data
  const liquidAssets = useMemo(() => {
    if (!netWorthData) return [];
    return netWorthData.assets.filter(a => a.categoria === 'Activos líquidos').map(a => ({
      id: a.id,
      icon: Wallet,
      title: a.nombre,
      subtitle: a.categoria,
      amountFormatted: `$${Number(a.valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      institution: a.nombre.split(' ')[0],
      valor: Number(a.valor)
    }));
  }, [netWorthData]);

  const semiLiquidAssets = useMemo(() => {
    if (!netWorthData) return [];
    return netWorthData.assets.filter(a => a.categoria === 'Activos financieros' || a.categoria === 'Activos por cobrar').map(a => ({
      id: a.id,
      icon: a.categoria === 'Activos financieros' ? Bitcoin : Wallet,
      title: a.nombre,
      subtitle: a.categoria,
      tag: a.subcategoria || (a.categoria === 'Activos financieros' ? 'Inversión' : 'Por Cobrar'),
      amountFormatted: `$${Number(a.valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isCrypto: a.subcategoria === 'Criptomonedas',
      valor: Number(a.valor)
    }));
  }, [netWorthData]);

  // Totals
  const totalLiquid = useMemo(() => liquidAssets.reduce((acc, curr) => acc + curr.valor, 0), [liquidAssets]);
  const totalSemiLiquid = useMemo(() => semiLiquidAssets.reduce((acc, curr) => acc + curr.valor, 0), [semiLiquidAssets]);

  // Filtered lists
  const filteredLiquidAssets = liquidAssets.filter(asset => {
    const matchesBank = liquidityBank === 'Todas' || asset.institution === liquidityBank;
    return matchesBank;
  });

  const filteredSemiLiquidAssets = semiLiquidAssets.filter(asset => {
    const matchesTag = semiLiquidityTag === 'Todos' || asset.tag === semiLiquidityTag;
    return matchesTag;
  });

  // Unique filters
  const uniqueBanks = ['Todas', ...Array.from(new Set(liquidAssets.map(a => a.institution).filter(Boolean))) as string[]];
  const uniqueTags = ['Todos', ...Array.from(new Set(semiLiquidAssets.map(a => a.tag).filter(Boolean))) as string[]];

  // Loading & Empty States
  if (!checkingData && hasData === false) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <div className="absolute inset-0 w-full h-full">
          <img src={networthIntro} alt="Net Worth Intro" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10">
          <div className="max-w-md text-center space-y-6">
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Vamos a conocernos mejor</h1>
            <p className="text-lg text-gray-600">Nutre a tu Moni AI personal con tu información y empieza a ver la diferencia</p>
            <Button
              size="lg"
              className="w-full mt-8 text-base py-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm hover:scale-105 hover:bg-white/80 active:scale-95 transition-all duration-200 font-semibold border-0 text-gray-900 animate-fade-in"
              onClick={() => navigate("/edit-assets-liabilities")}
            >
              Responder preguntas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if ((checkingData || loadingData) && hasData !== false) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!netWorthData) return null;

  const { currentNetWorth, percentageChange, totalAssets, totalLiabilities, chartData } = netWorthData;

  // Calculate period profit/change
  const startValue = chartData.length > 0 ? chartData[0].value : currentNetWorth;
  const periodProfit = currentNetWorth - startValue;

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden bg-[#F5F5F5]">
      
      {/* Brown Background Header - Portfolio Style */}
      <div className="bg-[#5D4037] pb-32 pt-6 px-6 rounded-b-[40px] shadow-lg relative z-0">
        <div className="max-w-md mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all active:scale-95 mb-4"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          
          {/* Title and value - matching portfolio style */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] text-[#D7CCC8] font-bold uppercase tracking-widest">Patrimonio Neto</p>
              <h1 className="text-3xl font-bold font-['DM_Sans'] tracking-tight text-white">
                ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Pulled up with negative margin to overlap header */}
      <div className="relative z-10 px-6 -mt-32 max-w-md mx-auto">

        {/* Main Chart Card - Portfolio Style */}
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 ring-1 ring-black/5">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rendimiento</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold tracking-tight ${periodProfit >= 0 ? 'text-[#5D4037]' : 'text-red-500'}`}>
                  {periodProfit >= 0 ? '+' : ''}${Math.abs(periodProfit).toLocaleString('es-MX', {maximumFractionDigits: 0, minimumFractionDigits: 0})}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${periodProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {periodProfit >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium">{getRangeLabel(selectedRange)}</p>
            </div>
          </div>
          
          {/* The Chart */}
          <NetWorthChart data={chartData} />
          
          {/* Time Range Selectors - Portfolio Style */}
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

        {/* Assets vs Liabilities Cards */}
        <div className="mb-4 mt-2 px-1">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Resumen</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Assets */}
            <div
              onClick={() => navigate('/assets')}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide">Activos</p>
                <p className="text-base font-bold text-emerald-700 tracking-tight leading-none mt-0.5 truncate">
                  ${(totalAssets / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>

            {/* Liabilities */}
            <div
              onClick={() => navigate('/liabilities')}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer group"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                <TrendingDown size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide">Pasivos</p>
                <p className="text-base font-bold text-red-700 tracking-tight leading-none mt-0.5 truncate">
                  ${(totalLiabilities / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LIQUIDITY SECTION */}
        <div className="relative z-20">
          <SectionHeader
            title="Liquidez"
            onFilterClick={() => setShowLiquidityFilters(!showLiquidityFilters)}
            isFilterActive={showLiquidityFilters}
          >
            <FilterDropdown
              isOpen={showLiquidityFilters}
              onClose={() => setShowLiquidityFilters(false)}
              options={uniqueBanks}
              selectedOption={liquidityBank}
              onOptionSelect={setLiquidityBank}
            />
          </SectionHeader>

          {/* Cash Available Total */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 mb-4">
            <p className="text-gray-500 font-medium text-sm mb-1">Efectivo Disponible</p>
            <p className="text-2xl font-bold text-[#5D4037] tracking-tight">
              ${totalLiquid.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Liquid Assets Scrollable List */}
          <div className="max-h-[320px] overflow-y-auto no-scrollbar pr-1 space-y-2">
            {filteredLiquidAssets.length > 0 ? (
              filteredLiquidAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  icon={asset.icon}
                  title={asset.title}
                  subtitle={asset.subtitle}
                  amount={asset.amountFormatted}
                />
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No se encontraron resultados.</p>
            )}
          </div>
        </div>

        {/* SEMI-LIQUID SECTION */}
        <div className="pb-6 relative z-10">
          <SectionHeader
            title="Activos Semi Líquidos"
            onFilterClick={() => setShowSemiLiquidityFilters(!showSemiLiquidityFilters)}
            isFilterActive={showSemiLiquidityFilters}
          >
            <FilterDropdown
              isOpen={showSemiLiquidityFilters}
              onClose={() => setShowSemiLiquidityFilters(false)}
              options={uniqueTags}
              selectedOption={semiLiquidityTag}
              onOptionSelect={setSemiLiquidityTag}
            />
          </SectionHeader>

          {/* Investments Total */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 mb-4">
            <p className="text-gray-500 font-medium text-sm mb-1">Inversiones y Por Cobrar</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">
              ${totalSemiLiquid.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Semi-Liquid Assets Scrollable List */}
          <div className="max-h-[320px] overflow-y-auto no-scrollbar pr-1 space-y-2">
            {filteredSemiLiquidAssets.length > 0 ? (
              filteredSemiLiquidAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  icon={asset.icon}
                  title={asset.title}
                  subtitle={asset.subtitle}
                  amount={asset.amountFormatted}
                />
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No se encontraron resultados.</p>
            )}
          </div>
        </div>

        {/* Download Button */}
        <div className="mb-6">
          <button
            onClick={async () => {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  toast.error("Debes iniciar sesión para descargar el reporte");
                  return;
                }

                toast.info("Generando reporte de patrimonio...");

                const { data, error } = await supabase.functions.invoke('generate-networth-pdf', {
                  body: {
                    userId: user.id,
                    timeRange: selectedRange
                  }
                });

                if (error) throw error;
                if (!data || !data.html || !data.filename) throw new Error('Datos incompletos');

                const blob = new Blob([data.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = data.filename.replace('.pdf', '.html');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast.success("Reporte descargado.");
              } catch (error: any) {
                console.error('Error:', error);
                toast.error("No se pudo generar el reporte");
              }
            }}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#D7CCC8] bg-white flex items-center justify-center gap-2 text-[#8D6E63] font-bold hover:bg-[#F8F5F2] transition-colors active:scale-[0.99]"
          >
            <Download size={18} />
            Descargar reporte PDF
          </button>
        </div>

      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => navigate('/edit-assets-liabilities')}
        className="fixed bottom-24 right-6 bg-[#5D4037] text-white w-14 h-14 rounded-full shadow-xl shadow-[#5D4037]/40 z-40 active:scale-90 transition-transform flex items-center justify-center hover:bg-[#4E342E]"
      >
        <Plus size={28} />
      </button>

      <BottomNav />
    </div>
  );
};

export default NetWorth;
