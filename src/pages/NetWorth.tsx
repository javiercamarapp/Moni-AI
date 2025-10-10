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

  const { data: hasData, isLoading: checkingData, refetch: refetchHasData } = useHasNetWorthData();
  const { data: netWorthData, isLoading: loadingData } = useNetWorth(timeRange);

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

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Assets Card */}
        <Card className="bg-gradient-card border-border/50 overflow-hidden">
          <div 
            className="p-6 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => setAssetsExpanded(!assetsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <h3 className="text-lg font-semibold text-foreground">Activos</h3>
                </div>
                <p className="text-3xl font-bold text-success">
                  ${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {assetsExpanded ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>

          {assetsExpanded && (
            <div className="px-6 pb-6 space-y-4 animate-accordion-down">
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {assetCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={assetFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssetFilter(cat as CategoryFilter)}
                    className="text-xs"
                  >
                    {cat === 'All' ? 'Todos' : cat}
                  </Button>
                ))}
              </div>

              {/* Account List */}
              <div className="space-y-2">
                {filteredAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay activos en esta categoría
                  </p>
                ) : (
                  filteredAssets.map((account) => {
                    const iconName = getIconForCategory(account.category);
                    const Icon = iconMap[iconName];
                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-success/10">
                            <Icon className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{account.category}</p>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-success">
                          ${Number(account.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Liabilities Card */}
        <Card className="bg-gradient-card border-border/50 overflow-hidden">
          <div 
            className="p-6 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => setLiabilitiesExpanded(!liabilitiesExpanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-5 w-5 text-danger" />
                  <h3 className="text-lg font-semibold text-foreground">Pasivos</h3>
                </div>
                <p className="text-3xl font-bold text-danger">
                  ${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {liabilitiesExpanded ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>

          {liabilitiesExpanded && (
            <div className="px-6 pb-6 space-y-4 animate-accordion-down">
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {liabilityCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={liabilityFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLiabilityFilter(cat as CategoryFilter)}
                    className="text-xs"
                  >
                    {cat === 'All' ? 'Todos' : cat}
                  </Button>
                ))}
              </div>

              {/* Account List */}
              <div className="space-y-2">
                {filteredLiabilities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay pasivos en esta categoría
                  </p>
                ) : (
                  filteredLiabilities.map((account) => {
                    const iconName = getIconForCategory(account.category);
                    const Icon = iconMap[iconName];
                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-border/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-danger/10">
                            <Icon className="h-5 w-5 text-danger" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{account.category}</p>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-danger">
                          ${Number(account.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
