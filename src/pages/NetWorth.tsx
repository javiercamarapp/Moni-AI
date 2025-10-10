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

      {/* Liquidez Section */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Liquidez</h2>
          <button className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <div className="flex flex-col gap-0.5">
              <div className="h-0.5 w-4 bg-white/70"></div>
              <div className="h-0.5 w-4 bg-white/70"></div>
            </div>
            Sort by institution
          </button>
        </div>

        <div className="space-y-0 bg-white rounded-2xl overflow-hidden">
          {assets
            .filter(account => 
              account.category.toLowerCase().includes('check') || 
              account.category.toLowerCase().includes('saving')
            )
            .map((account, index) => {
              const iconName = getIconForCategory(account.category);
              const Icon = iconMap[iconName];
              const isLast = index === assets.filter(a => 
                a.category.toLowerCase().includes('check') || 
                a.category.toLowerCase().includes('saving')
              ).length - 1;
              
              return (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                    !isLast && "border-b border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">{account.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ${Number(account.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">Actualizado</p>
                  </div>
                </div>
              );
            })}
            
          {assets.filter(a => 
            a.category.toLowerCase().includes('check') || 
            a.category.toLowerCase().includes('saving')
          ).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No hay cuentas líquidas registradas
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
