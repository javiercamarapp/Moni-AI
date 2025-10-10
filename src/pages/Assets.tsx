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
        <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Activos</h1>
                <p className="text-xs text-white/70">Cargando...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="p-6 bg-gradient-card border-border/50 animate-pulse">
            <div className="h-80 bg-muted/20 rounded"></div>
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
    assets;

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Activos</h1>
              <p className="text-xs text-white/70">Recursos que posees</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 backdrop-blur-sm border-emerald-500/30 p-6">
          <h2 className="text-lg font-bold text-white mb-3">¿Qué son los Activos?</h2>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            Son los recursos que posees y que se pueden convertir en dinero. Incluyen bienes raíces, 
            dinero en efectivo, inversiones, vehículos, joyas, arte y cuentas de jubilación.
          </p>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Droplet className="h-4 w-4" />
            <span>Los activos se clasifican en líquidos (fácil conversión) y fijos (conversión lenta)</span>
          </div>
        </Card>

        {/* Total Activos */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/30">
          <p className="text-xs text-white/70 mb-1">Total de Activos</p>
          <p className="text-3xl font-bold text-white break-words">
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
              "flex-1 transition-all",
              filter === 'All'
                ? "bg-white/20 text-white border-white/30"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            )}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'Liquid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Liquid')}
            className={cn(
              "flex-1 transition-all",
              filter === 'Liquid'
                ? "bg-blue-500/30 text-white border-blue-500/40"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            )}
          >
            Líquidos
          </Button>
          <Button
            variant={filter === 'Fixed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Fixed')}
            className={cn(
              "flex-1 transition-all",
              filter === 'Fixed'
                ? "bg-amber-500/30 text-white border-amber-500/40"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            )}
          >
            Fijos
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-3 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Droplet className="h-4 w-4 text-blue-400" />
              <p className="text-[10px] text-white/70">Activos Líquidos</p>
            </div>
            <p className="text-sm font-bold text-blue-300 break-words">
              ${totalLiquid.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-white/50 mt-1">
              {liquidAssets.length} cuenta{liquidAssets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-3 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-amber-400" />
              <p className="text-[10px] text-white/70">Activos Fijos</p>
            </div>
            <p className="text-sm font-bold text-amber-300 break-words">
              ${totalFixed.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-white/50 mt-1">
              {fixedAssets.length} bien{fixedAssets.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        {/* Assets List */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white mb-3">
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
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    isLiquid 
                      ? "bg-gradient-to-br from-blue-500 to-blue-700" 
                      : "bg-gradient-to-br from-amber-500 to-amber-700"
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{asset.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-white/60">{asset.category}</p>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] px-1.5 py-0",
                          isLiquid 
                            ? "border-blue-500/40 text-blue-300" 
                            : "border-amber-500/40 text-amber-300"
                        )}
                      >
                        {isLiquid ? 'Líquido' : 'Fijo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-bold text-emerald-300 text-sm break-words">
                    ${Number(asset.value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
          
          {displayAssets.length === 0 && (
            <div className="p-8 text-center text-white/60 bg-white/5 rounded-xl border border-white/10">
              No hay activos en esta categoría
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
