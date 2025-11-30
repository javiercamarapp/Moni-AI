import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Download, ListFilter, Wallet, Bitcoin, ChevronRight, Check, Search } from '@/components/networth/new-ui/Icons';
import { headingPage, headingSection, kpiNumberPrimary } from '@/styles/typography';
import { EvolutionChart } from '@/components/networth/new-ui/EvolutionChart';
import { FilterDropdown } from '@/components/networth/new-ui/FilterDropdown';
import { AssetCard } from '@/components/networth/new-ui/AssetCard';
import { useNavigate } from 'react-router-dom';
import { useNetWorth, useHasNetWorthData, TimeRange, ChartDataPoint } from '@/hooks/useNetWorth';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import networthIntro from "@/assets/networth-coins-bg.png";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

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

  // Derived Data
  const liquidAssets = useMemo(() => {
    if (!netWorthData) return [];
    return netWorthData.assets.filter(a => a.categoria === 'Activos líquidos').map(a => ({
      id: a.id,
      icon: Wallet,
      title: a.nombre,
      subtitle: a.categoria,
      amountFormatted: `$${Number(a.valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      institution: a.nombre.split(' ')[0], // Simple heuristic for institution
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
      <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-[#faf9f8] text-[#5D4037] pb-24 font-sans selection:bg-[#8D6E63] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#faf9f8]/95 backdrop-blur-sm px-6 pt-6 pb-2">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white p-3.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all active:scale-95 duration-200 border border-white"
          >
            <ArrowLeft size={20} className="text-[#5D4037]" />
          </button>
          <div className="flex flex-col">
            <h1 className={headingPage}>Patrimonio Neto</h1>
            <p className="text-sm text-gray-500 font-medium">Evolución de tu riqueza</p>
          </div>
        </div>
      </header>

      <main className="px-6 mt-6 max-w-5xl mx-auto w-full">

        {/* Main Net Worth Value */}
        <div className="space-y-2 animate-[fadeIn_0.6s_ease-out]">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span className="font-semibold text-xs uppercase tracking-wider">Patrimonio Neto</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`${kpiNumberPrimary} text-[2.5rem]`}>
                ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <span className={`font-medium text-sm ${percentageChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                </span>
                <span className="text-gray-400 text-sm">último periodo</span>
              </div>
            </div>
            <div className={`p-2 rounded-xl ${percentageChange >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              {percentageChange >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="relative animate-[fadeIn_0.8s_ease-out] mt-6">
          <div className="w-full">
            <EvolutionChart data={chartData} />
          </div>

          {/* Time Range Selectors */}
          <div className="flex justify-between mt-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`
                  px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300
                  ${selectedRange === range
                    ? 'bg-[#8D6E63] text-white shadow-md transform scale-105'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                `}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Assets vs Liabilities Cards */}
        <div className="grid grid-cols-2 gap-4 animate-[slideUp_0.8s_ease-out] mt-6">
          {/* Assets */}
          <div
            onClick={() => navigate('/assets')}
            className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] cursor-pointer group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide">Activos</p>
              <p className="text-lg font-bold text-emerald-700 tracking-tight leading-none mt-0.5 truncate">
                ${(totalAssets / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>

          {/* Liabilities */}
          <div
            onClick={() => navigate('/liabilities')}
            className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] cursor-pointer group"
          >
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0 group-hover:scale-105 transition-transform">
              <TrendingDown size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide">Pasivos</p>
              <p className="text-lg font-bold text-red-700 tracking-tight leading-none mt-0.5 truncate">
                ${(totalLiabilities / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-6 animate-[slideUp_0.9s_ease-out]">
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
            className="w-full py-3 rounded-2xl border border-[#5D4037] bg-[#5D4037] text-white flex items-center justify-center gap-2 transition-all duration-500 ease-spring hover:bg-white hover:text-[#5D4037] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(93,64,55,0.3)] cursor-pointer group shadow-md active:scale-95 active:shadow-sm"
          >
            <Download size={18} className="text-white transition-colors duration-300 group-hover:text-[#5D4037]" strokeWidth={2.5} />
            <span className="font-bold text-sm tracking-tight">Descargar reporte financiero en PDF</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-8 animate-[slideUp_0.95s_ease-out]">
          <div className="bg-white p-4 rounded-2xl flex items-start gap-3 border border-gray-100 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8D6E63] flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <p className="text-xs leading-relaxed text-gray-600 font-medium">
              Al conectar tus cuentas de banco, la liquidez y el efectivo disponible se actualizarán automáticamente con la información de tus cuentas bancarias y de inversión.
            </p>
          </div>
        </div>

        {/* LIQUIDITY SECTION */}
        <div className="animate-[slideUp_1s_ease-out] relative z-20">
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
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-4">
            <p className="text-gray-500 font-medium text-sm mb-1">Efectivo Disponible</p>
            <p className="text-3xl font-bold text-[#5D4037] tracking-tight">
              ${totalLiquid.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Liquid Assets Scrollable List */}
          <div className="max-h-[480px] overflow-y-auto no-scrollbar pr-1">
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
        <div className="animate-[slideUp_1.1s_ease-out] pb-6 relative z-10">
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
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-4">
            <p className="text-gray-500 font-medium text-sm mb-1">Inversiones y Por Cobrar</p>
            <p className="text-3xl font-bold text-emerald-600 tracking-tight">
              ${totalSemiLiquid.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Semi-Liquid Assets Scrollable List */}
          <div className="max-h-[480px] overflow-y-auto no-scrollbar pr-1">
            {filteredSemiLiquidAssets.length > 0 ? (
              filteredSemiLiquidAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  icon={asset.icon}
                  title={asset.title}
                  subtitle={asset.subtitle}
                  tag={asset.tag}
                  amount={asset.amountFormatted}
                  isCrypto={asset.isCrypto}
                />
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No se encontraron resultados.</p>
            )}
          </div>
        </div>

      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <BottomNav />
    </div>
  );
};

export default NetWorth;
