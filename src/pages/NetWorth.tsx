import { useState, useRef, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Building2, CreditCard, Home, Wallet, Download } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [showSemiLiquidFilter, setShowSemiLiquidFilter] = useState(false);
  const [selectedSemiLiquidType, setSelectedSemiLiquidType] = useState<string>('All');
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const semiLiquidButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showSemiLiquidFilter && semiLiquidButtonRef.current) {
      const rect = semiLiquidButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Si hay menos de 300px abajo, mostrar arriba
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [showSemiLiquidFilter]);

  const { data: hasData, isLoading: checkingData, refetch: refetchHasData } = useHasNetWorthData();
  const { data: netWorthData, isLoading: loadingData } = useNetWorth(timeRange);

  // Helper function to check if an asset is liquid (solo efectivo disponible)
  const isLiquidAsset = (categoria: string) => {
    return categoria === 'Activos líquidos';
  };

  // Helper function to check if an asset is semi-liquid
  const isSemiLiquidAsset = (categoria: string) => {
    return categoria === 'Activos financieros' || categoria === 'Activos por cobrar';
  };

  // Mostrar formulario si definitivamente no hay datos (no mientras está cargando)
  if (!checkingData && hasData === false) {
    if (!showForm) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header with back button */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
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
              <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
                Vamos a conocernos mejor
              </h1>
              <p className="text-lg text-gray-600">
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
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Patrimonio Neto</h1>
                <p className="text-sm text-gray-500">Evolución de tu riqueza</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Skeleton del contenido principal */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 animate-pulse rounded-3xl shadow-sm">
            <div className="h-80 bg-gray-100 rounded-2xl"></div>
          </Card>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (!netWorthData) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center pb-20">
        <p className="text-foreground font-semibold text-lg">Error cargando datos</p>
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
    : assets.filter(a => a.categoria === assetFilter);

  const filteredLiabilities = liabilityFilter === 'All'
    ? liabilities
    : liabilities.filter(l => l.categoria === liabilityFilter);

  const assetCategories = ['All', ...Array.from(new Set(assets.map(a => a.categoria)))];
  const liabilityCategories = ['All', ...Array.from(new Set(liabilities.map(l => l.categoria)))];

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Patrimonio Neto</h1>
              <p className="text-sm text-gray-500">Evolución de tu riqueza</p>
            </div>
          </div>
        </div>
      </div>

      {/* Widget de Evolución del Patrimonio sin escala adicional */}
      <div className="max-w-7xl mx-auto">
        <NetWorthWidget />
      </div>

      {/* Botón de descarga de PDF */}
      <div className="px-4 mt-4">
        <Button 
          variant="ghost" 
          className="w-full bg-white/80 backdrop-blur-sm hover:bg-white rounded-3xl shadow-sm hover:shadow-md transition-all h-auto py-3 px-4 text-xs font-medium flex items-center justify-center border-0"
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
                  timeRange
                }
              });

              if (error) {
                console.error('Error al generar reporte:', error);
                throw error;
              }

              if (!data || !data.html || !data.filename) {
                throw new Error('Datos incompletos en la respuesta');
              }

              // Crear blob con el HTML
              const blob = new Blob([data.html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);

              // Crear link temporal y hacer click
              const link = document.createElement('a');
              link.href = url;
              link.download = data.filename.replace('.pdf', '.html');
              document.body.appendChild(link);
              link.click();

              // Limpiar
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              toast.success("Reporte descargado. Abre el archivo HTML y usa Ctrl+P (Cmd+P en Mac) para guardarlo como PDF.");
            } catch (error: any) {
              console.error('Error al generar reporte:', error);
              toast.error(error.message || "No se pudo generar el reporte");
            }
          }}
        >
          <Download className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
          <span className="whitespace-nowrap">Descargar Reporte de Patrimonio en PDF</span>
        </Button>
      </div>

      {/* Liquidez Section */}
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Liquidez</h2>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstitutionFilter(!showInstitutionFilter)}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-9 px-3 gap-2"
            >
              <div className="flex flex-col gap-0.5">
                <div className="h-0.5 w-3 bg-gray-700"></div>
                <div className="h-0.5 w-3 bg-gray-700"></div>
              </div>
              <span className="text-xs font-medium text-gray-700">Filtrar</span>
            </Button>
            
            {showInstitutionFilter && (
              <div className="absolute right-0 top-full mt-2 bg-white backdrop-blur-md rounded-2xl shadow-sm border-0 py-2 min-w-[200px] z-50">
                <button
                  onClick={() => {
                    setSelectedInstitution('All');
                    setShowInstitutionFilter(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors font-medium",
                    selectedInstitution === 'All' ? "bg-gray-100 text-gray-900" : "text-gray-600"
                  )}
                >
                  Todas las instituciones
                </button>
                {Array.from(new Set(
                  assets
                    .filter(a => isLiquidAsset(a.categoria))
                    .map(a => a.nombre.split(' ')[0]) // Get first word as institution name
                )).map((institution) => (
                  <button
                    key={institution}
                    onClick={() => {
                      setSelectedInstitution(institution);
                      setShowInstitutionFilter(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors font-medium",
                      selectedInstitution === institution ? "bg-gray-100 text-gray-900" : "text-gray-600"
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
        <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-3xl p-4 border-0 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 font-medium">Efectivo Disponible</p>
          <p className="text-2xl font-semibold text-blue-900 break-words tracking-tight">
            ${assets
              .filter(a => isLiquidAsset(a.categoria))
              .filter(a => selectedInstitution === 'All' || a.nombre.startsWith(selectedInstitution))
              .reduce((sum, a) => sum + Number(a.valor), 0)
              .toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="space-y-3">
          {assets
            .filter(account => isLiquidAsset(account.categoria))
            .filter(account => selectedInstitution === 'All' || account.nombre.startsWith(selectedInstitution))
            .map((account) => {
              const iconName = getIconForCategory(account.categoria);
              const Icon = iconMap[iconName];
              
              return (
                <div
                  key={account.id}
                  className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0 animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/40 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{account.nombre}</p>
                        <p className="text-xs text-gray-500 leading-tight">{account.categoria}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm break-words">
                        ${Number(account.valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
          {assets.filter(a => isLiquidAsset(a.categoria)).filter(a => selectedInstitution === 'All' || a.nombre.startsWith(selectedInstitution)).length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-white rounded-3xl border-0 shadow-sm">
              {selectedInstitution === 'All' 
                ? 'No hay cuentas líquidas registradas'
                : `No hay cuentas líquidas de ${selectedInstitution}`}
            </div>
          )}
        </div>
      </div>

      {/* Activos Semi Líquidos Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Activos Semi Líquidos</h2>
          <div className="relative">
            <Button
              ref={semiLiquidButtonRef}
              variant="ghost"
              size="sm"
              onClick={() => setShowSemiLiquidFilter(!showSemiLiquidFilter)}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-9 px-3 gap-2"
            >
              <div className="flex flex-col gap-0.5">
                <div className="h-0.5 w-3 bg-gray-700"></div>
                <div className="h-0.5 w-3 bg-gray-700"></div>
              </div>
              <span className="text-xs font-medium text-gray-700">Filtrar</span>
            </Button>
            
            {showSemiLiquidFilter && (
              <div className={cn(
                "absolute right-0 bg-white backdrop-blur-md rounded-2xl shadow-sm border-0 py-2 min-w-[200px] z-50",
                dropdownPosition === 'bottom' ? "top-full mt-2" : "bottom-full mb-2"
              )}>
                <button
                  onClick={() => {
                    setSelectedSemiLiquidType('All');
                    setShowSemiLiquidFilter(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors font-medium",
                    selectedSemiLiquidType === 'All' ? "bg-gray-100 text-gray-900" : "text-gray-600"
                  )}
                >
                  Todos los tipos
                </button>
                {Array.from(new Set(
                  assets
                    .filter(a => isSemiLiquidAsset(a.categoria))
                    .map(a => a.subcategoria)
                    .filter(Boolean)
                )).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedSemiLiquidType(type!);
                      setShowSemiLiquidFilter(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors font-medium",
                      selectedSemiLiquidType === type ? "bg-gray-100 text-gray-900" : "text-gray-600"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total Semi Líquido */}
        <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-3xl p-4 border-0 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 font-medium">Inversiones y Por Cobrar</p>
          <p className="text-2xl font-semibold text-emerald-700 break-words tracking-tight">
            ${assets
              .filter(a => isSemiLiquidAsset(a.categoria))
              .filter(a => selectedSemiLiquidType === 'All' || a.subcategoria === selectedSemiLiquidType)
              .reduce((sum, a) => sum + Number(a.valor), 0)
              .toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="space-y-3">
          {assets
            .filter(account => isSemiLiquidAsset(account.categoria))
            .filter(account => selectedSemiLiquidType === 'All' || account.subcategoria === selectedSemiLiquidType)
            .map((account) => {
              const iconName = getIconForCategory(account.categoria);
              const Icon = iconMap[iconName];
              
              return (
                <div
                  key={account.id}
                  className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0 animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/40 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{account.nombre}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 leading-tight">{account.categoria}</p>
                          {account.subcategoria && (
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 border-emerald-500/40 text-emerald-600 bg-emerald-50 whitespace-nowrap">
                              {account.subcategoria}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm break-words">
                        ${Number(account.valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
          {assets.filter(a => isSemiLiquidAsset(a.categoria)).filter(a => selectedSemiLiquidType === 'All' || a.subcategoria === selectedSemiLiquidType).length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-white rounded-3xl border-0 shadow-sm">
              {selectedSemiLiquidType === 'All' 
                ? 'No hay activos semi líquidos registrados'
                : `No hay activos de tipo ${selectedSemiLiquidType}`}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
