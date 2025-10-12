import { useState } from "react";
import { ArrowLeft, Building2, CreditCard, Home, Wallet, TrendingUp, Droplet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetWorth } from "@/hooks/useNetWorth";
import BottomNav from "@/components/BottomNav";

type CategoryFilter = 'All' | 'Liquid' | 'Fixed';

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

export default function Assets() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CategoryFilter>('All');
  const { data: netWorthData, isLoading } = useNetWorth('1Y');

  // Helper function to check if an asset is liquid
  const isLiquidAsset = (category: string, name?: string) => {
    const cat = category.toLowerCase();
    const accountName = name?.toLowerCase() || '';
    
    // Activos NO líquidos (tienen prioridad en la exclusión)
    const illiquidKeywords = [
      'retirement', 'pension', 'retiro', 'pensión', '401k', 'ira', 'roth',
      'property', 'real estate', 'propiedad', 'inmueble', 'edificio',
      'machinery', 'maquinaria', 'equipment', 'equipo',
      'certificate', 'certificado', 'cd',
      'annuity', 'anualidad', 'plan', 'jubilación', 'jubilacion',
      'vehicle', 'vehiculo', 'auto', 'carro', 'coche',
      'jewelry', 'joyeria', 'art', 'arte', 'collection', 'colección'
    ];
    
    const hasIlliquidKeyword = illiquidKeywords.some(keyword => 
      cat.includes(keyword) || accountName.includes(keyword)
    );
    
    if (hasIlliquidKeyword) {
      return false;
    }
    
    // Activos líquidos
    const liquidKeywords = [
      'cash', 'efectivo', 'dinero',
      'checking', 'corriente', 'cuenta corriente',
      'saving', 'ahorro', 'cuenta de ahorro',
      'money market', 'mercado de dinero',
      'deposit', 'depósito', 'depósito a la vista'
    ];
    
    return liquidKeywords.some(keyword => cat.includes(keyword));
  };

  if (isLoading || !netWorthData) {
    return (
      <div className="min-h-screen animated-wave-bg pb-20">
        <div className="bg-white/95 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-12 w-12 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Activos</h1>
                <p className="text-sm text-foreground/80 font-medium">Cargando...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="p-6 bg-white border-blue-100 animate-pulse rounded-[20px] shadow-xl">
            <div className="h-80 bg-primary/10 rounded-[20px]"></div>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { assets, totalAssets } = netWorthData;

  const liquidAssets = assets.filter(a => isLiquidAsset(a.category, a.name));
  const fixedAssets = assets.filter(a => !isLiquidAsset(a.category, a.name));

  const totalLiquid = liquidAssets.reduce((sum, a) => sum + Number(a.value), 0);
  const totalFixed = fixedAssets.reduce((sum, a) => sum + Number(a.value), 0);

  const displayAssets = 
    filter === 'Liquid' ? liquidAssets :
    filter === 'Fixed' ? fixedAssets :
    [...liquidAssets, ...fixedAssets]; // Primero líquidos, después fijos

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/net-worth')}
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-12 w-12 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Activos</h1>
              <p className="text-sm text-foreground/80 font-medium">Recursos que posees</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-blue-100 p-5 rounded-[20px] shadow-xl">
          <h2 className="text-lg font-bold text-foreground mb-3">¿Qué son los Activos?</h2>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Son los recursos que posees y que se pueden convertir en dinero. Incluyen bienes raíces, 
            dinero en efectivo, inversiones, vehículos, joyas, arte y cuentas de jubilación.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Droplet className="h-4 w-4" />
            <span>Los activos se clasifican en líquidos (fácil conversión) y fijos (conversión lenta)</span>
          </div>
        </Card>

        {/* Total Activos */}
        <div className="bg-white backdrop-blur-sm rounded-[20px] p-5 border border-blue-100 shadow-xl">
          <p className="text-xs text-foreground/80 mb-1 font-medium">Total de Activos</p>
          <p className="text-3xl font-bold text-emerald-700 break-words">
            ${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('All')}
            className={cn(
              "flex-1 transition-all rounded-[20px] shadow-lg font-semibold border border-blue-100 h-9",
              filter === 'All'
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                : "bg-white text-foreground hover:bg-primary/10 hover:scale-105"
            )}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'Liquid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Liquid')}
            className={cn(
              "flex-1 transition-all rounded-[20px] shadow-lg font-semibold border border-blue-100 h-9",
              filter === 'Liquid'
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                : "bg-white text-foreground hover:bg-primary/10 hover:scale-105"
            )}
          >
            Líquidos
          </Button>
          <Button
            variant={filter === 'Fixed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Fixed')}
            className={cn(
              "flex-1 transition-all rounded-[20px] shadow-lg font-semibold border border-blue-100 h-9",
              filter === 'Fixed'
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                : "bg-white text-foreground hover:bg-primary/10 hover:scale-105"
            )}
          >
            Fijos
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white backdrop-blur-sm rounded-[20px] p-4 border border-blue-100 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                <Droplet className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-foreground/80 font-medium">Activos Líquidos</p>
            </div>
            <p className="text-lg font-bold text-foreground break-words">
              ${totalLiquid >= 100000 
                ? `${(totalLiquid / 1000).toFixed(0)}k` 
                : totalLiquid.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {liquidAssets.length} cuenta{liquidAssets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white backdrop-blur-sm rounded-[20px] p-4 border border-blue-100 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                <Home className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xs text-foreground/80 font-medium">Activos Fijos</p>
            </div>
            <p className="text-lg font-bold text-foreground break-words">
              ${totalFixed >= 100000 
                ? `${(totalFixed / 1000).toFixed(0)}k` 
                : totalFixed.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {fixedAssets.length} bien{fixedAssets.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        {/* Assets List */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground mb-3 drop-shadow-lg">
            {filter === 'Liquid' ? 'Activos Líquidos' : 
             filter === 'Fixed' ? 'Activos Fijos' : 
             'Todos los Activos'}
          </h3>
          {displayAssets.map((asset) => {
            const iconName = getIconForCategory(asset.category);
            const Icon = iconMap[iconName];
            const isLiquid = isLiquidAsset(asset.category, asset.name);
            
            return (
              <div
                key={asset.id}
                className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-[1.02] transition-all cursor-pointer border border-blue-100 animate-fade-in"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isLiquid 
                        ? "bg-blue-500/30" 
                        : "bg-amber-500/30"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isLiquid ? "text-blue-600" : "text-amber-600"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-sm leading-tight">{asset.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-foreground/70 leading-tight">{asset.category}</p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] px-1.5 py-0",
                            isLiquid 
                              ? "border-blue-500/40 text-blue-600 bg-blue-50" 
                              : "border-amber-500/40 text-amber-600 bg-amber-50"
                          )}
                        >
                          {isLiquid ? 'Líquido' : 'Fijo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-emerald-700 text-sm break-words">
                      ${Number(asset.value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {displayAssets.length === 0 && (
            <div className="p-8 text-center text-muted-foreground bg-white rounded-[20px] border border-blue-100 shadow-xl">
              No hay activos en esta categoría
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
