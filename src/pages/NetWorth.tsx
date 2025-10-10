import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Building2, CreditCard, Home, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";
import { useNetWorth, useHasNetWorthData, TimeRange } from "@/hooks/useNetWorth";
import NetWorthSetupForm from "@/components/NetWorthSetupForm";
import NetWorthWidget from "@/components/analysis/NetWorthWidget";
import networthIntro from "@/assets/networth-intro.jpg";
import BottomNav from "@/components/BottomNav";

type CategoryFilter = 'All' | 'Checking' | 'Savings' | 'Credit' | 'Loans' | 'Investments' | 'Property' | 'Other' | 'Mortgage';

const iconMap: Record<string, any> = {
  Building2,
  CreditCard,
  Home,
  Wallet,
  TrendingUp,
};

const getIconForCategory = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('check')) return 'Building2';
  if (lowerCategory.includes('saving')) return 'Wallet';
  if (lowerCategory.includes('investment')) return 'TrendingUp';
  if (lowerCategory.includes('property') || lowerCategory.includes('mortgage')) return 'Home';
  if (lowerCategory.includes('credit')) return 'CreditCard';
  if (lowerCategory.includes('loan')) return 'Building2';
  return 'Wallet';
};

export default function NetWorth() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const [liabilitiesExpanded, setLiabilitiesExpanded] = useState(false);
  const [assetFilter, setAssetFilter] = useState<CategoryFilter>('All');
  const [liabilityFilter, setLiabilityFilter] = useState<CategoryFilter>('All');
  const [showForm, setShowForm] = useState(false);
  const [showInstitutionFilter, setShowInstitutionFilter] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('All');

  const { data: hasData, isLoading: checkingData, refetch: refetchHasData } = useHasNetWorthData();
  const { data: netWorthData, isLoading: loadingData } = useNetWorth(timeRange);

  // Helper function to check if an asset is liquid
  const isLiquidAsset = (category: string, name?: string) => {
    const cat = category.toLowerCase();
    const accountName = name?.toLowerCase() || '';
    
    // Activos NO líquidos (tienen prioridad en la exclusión)
    const illiquidKeywords = [
      'retirement', 'pension', 'retiro', 'pensión', '401k', 'ira', 'roth',
      'property', 'real estate', 'propiedad', 'inmueble', 'edificio',
      'machinery', 'maquinaria', 'equipment', 'equipo',
      'certificate', 'certificado', 'cd', // CDs tienen penalidad
      'annuity', 'anualidad', 'plan', 'jubilación', 'jubilacion'
    ];
    
    // Verificar tanto la categoría como el nombre de la cuenta
    const hasIlliquidKeyword = illiquidKeywords.some(keyword => 
      cat.includes(keyword) || accountName.includes(keyword)
    );
    
    if (hasIlliquidKeyword) {
      return false;
    }
    
    // Activos líquidos: efectivo, depósitos bancarios, valores negociables, fondos
    const liquidKeywords = [
      'cash', 'efectivo', 'dinero',
      'checking', 'corriente', 'cuenta corriente',
      'saving', 'ahorro', 'cuenta de ahorro',
      'money market', 'mercado de dinero',
      'deposit', 'depósito', 'depósito a la vista'
    ];
    
    return liquidKeywords.some(keyword => cat.includes(keyword));
  };

  // Mostrar formulario si definitivamente no hay datos (no mientras está cargando)
  if (!checkingData && hasData === false) {
    if (!showForm) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header with back button */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-foreground hover:bg-white/5"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="h-[50vh] relative overflow-hidden">
            <img 
              src={networthIntro} 
              alt="Net Worth Intro" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 -mt-20 relative z-10">
            <div className="max-w-md text-center space-y-6">
              <h1 className="text-4xl font-bold text-foreground">
                Vamos a conocernos mejor
              </h1>
              <p className="text-lg text-muted-foreground">
                Nutre a tu Moni AI personal con tu información y empieza a ver la diferencia
              </p>
              <Button 
                size="lg"
                className="w-full mt-8 text-lg py-6 bg-gradient-to-r from-primary via-primary to-accent shadow-glow hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 hover:scale-105 font-semibold animate-fade-in"
                onClick={() => setShowForm(true)}
              >
                Responder preguntas
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return <NetWorthSetupForm onComplete={() => refetchHasData()} onBack={() => setShowForm(false)} />;
  }

  // Mostrar skeleton/placeholder mientras carga pero solo si ya sabemos que hay datos
  if ((checkingData || loadingData) && hasData !== false) {
    return (
      <div className="min-h-screen animated-wave-bg pb-20">
        {/* Header */}
        <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Patrimonio Neto</h1>
                <p className="text-xs text-white/70">Evolución de tu riqueza</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Skeleton del contenido principal */}
          <Card className="p-6 bg-gradient-card border-border/50 animate-pulse">
            <div className="h-80 bg-muted/20 rounded"></div>
          </Card>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (!netWorthData) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center pb-20">
        <p className="text-white">Error cargando datos</p>
        <BottomNav />
      </div>
    );
  }

  const { 
    currentNetWorth, 
    totalAssets, 
    totalLiabilities, 
    assets, 
    liabilities, 
    chartData, 
    percentageChange,
    highPoint,
    lowPoint
  } = netWorthData;

  const isPositiveChange = percentageChange >= 0;

  const filteredAssets = assetFilter === 'All' 
    ? assets 
    : assets.filter(a => a.category === assetFilter);

  const filteredLiabilities = liabilityFilter === 'All'
    ? liabilities
    : liabilities.filter(l => l.category === liabilityFilter);

  const assetCategories = ['All', ...Array.from(new Set(assets.map(a => a.category)))];
  const liabilityCategories = ['All', ...Array.from(new Set(liabilities.map(l => l.category)))];

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Patrimonio Neto</h1>
              <p className="text-xs text-white/70">Evolución de tu riqueza</p>
            </div>
          </div>
        </div>
      </div>

      {/* Widget de Evolución del Patrimonio sin escala adicional */}
      <div className="max-w-7xl mx-auto">
        <NetWorthWidget />
      </div>

      {/* Liquidez Section */}
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-white">Liquidez</h2>
          <div className="relative">
            <button 
              onClick={() => setShowInstitutionFilter(!showInstitutionFilter)}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <div className="h-0.5 w-4 bg-white/70"></div>
                <div className="h-0.5 w-4 bg-white/70"></div>
              </div>
              Filtrar por institución
            </button>
            
            {showInstitutionFilter && (
              <div className="absolute right-0 top-full mt-2 animated-wave-bg backdrop-blur-md rounded-xl shadow-2xl border border-white/20 py-2 min-w-[200px] z-50">
                <button
                  onClick={() => {
                    setSelectedInstitution('All');
                    setShowInstitutionFilter(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors rounded-lg",
                    selectedInstitution === 'All' ? "bg-white/20 text-white font-semibold" : "text-white/80"
                  )}
                >
                  Todas las instituciones
                </button>
                {Array.from(new Set(
                  assets
                    .filter(a => isLiquidAsset(a.category, a.name))
                    .map(a => a.name.split(' ')[0]) // Get first word as institution name
                )).map((institution) => (
                  <button
                    key={institution}
                    onClick={() => {
                      setSelectedInstitution(institution);
                      setShowInstitutionFilter(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors rounded-lg",
                      selectedInstitution === institution ? "bg-white/20 text-white font-semibold" : "text-white/80"
                    )}
                  >
                    {institution}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total Líquido */}
        <div className="mb-4 bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-sm rounded-xl p-3 border border-blue-500/30">
          <p className="text-[10px] text-white/70 mb-0.5">Efectivo Disponible</p>
          <p className="text-base font-bold text-white break-words">
            ${assets
              .filter(a => isLiquidAsset(a.category, a.name))
              .filter(a => selectedInstitution === 'All' || a.name.startsWith(selectedInstitution))
              .reduce((sum, a) => sum + Number(a.value), 0)
              .toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="space-y-2">
          {assets
            .filter(account => isLiquidAsset(account.category, account.name))
            .filter(account => selectedInstitution === 'All' || account.name.startsWith(selectedInstitution))
            .map((account) => {
              const iconName = getIconForCategory(account.category);
              const Icon = iconMap[iconName];
              
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{account.name}</p>
                      <p className="text-xs text-white/60">{account.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-sm break-words">
                      ${Number(account.value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
            
          {assets.filter(a => isLiquidAsset(a.category, a.name)).filter(a => selectedInstitution === 'All' || a.name.startsWith(selectedInstitution)).length === 0 && (
            <div className="p-8 text-center text-white/60 bg-white/5 rounded-xl border border-white/10">
              {selectedInstitution === 'All' 
                ? 'No hay cuentas líquidas registradas'
                : `No hay cuentas líquidas de ${selectedInstitution}`}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
