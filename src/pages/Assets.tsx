import { ArrowLeft, Wallet, Home, TrendingUp, FileText, Sparkles, Plus, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetWorth } from "@/hooks/useNetWorth";
import BottomNav from "@/components/BottomNav";
import { CategorySection } from "@/components/networth/CategorySection";
import { ASSET_CATEGORIES, getAssetCategoryColors, type AssetCategory } from "@/lib/categoryDefinitions";

const iconMap = {
  'Activos líquidos': Wallet,
  'Activos fijos': Home,
  'Activos financieros': TrendingUp,
  'Activos por cobrar': FileText,
  'Activos intangibles': Sparkles,
};

// Helper function to format large numbers
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 100000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function Assets() {
  const navigate = useNavigate();
  const { data: netWorthData, isLoading } = useNetWorth('1Y');

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

  // Group assets by category
  const assetsByCategory = Object.keys(ASSET_CATEGORIES).reduce((acc, category) => {
    acc[category as AssetCategory] = assets.filter(a => a.categoria === category);
    return acc;
  }, {} as Record<AssetCategory, typeof assets>);

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/net-worth')}
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Activos</h1>
              <p className="text-xs text-muted-foreground">Recursos que posees</p>
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
            <AlertCircle className="h-4 w-4" />
            <span>Los activos se clasifican en líquidos, fijos, financieros, por cobrar e intangibles</span>
          </div>
        </Card>

        {/* Total Activos */}
        <div className="bg-white backdrop-blur-sm rounded-[20px] p-5 border border-blue-100 shadow-xl">
          <p className="text-xs text-foreground/80 mb-1 font-medium">Total de Activos</p>
          <p className="text-3xl font-bold text-emerald-700 break-words">
            ${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Gestionar Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground drop-shadow-lg">
            Categorías de Activos
          </h3>
          <Button
            onClick={() => navigate('/edit-assets-liabilities')}
            className="bg-white rounded-[16px] shadow-xl hover:bg-white/90 border border-blue-100 h-9 px-3"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Gestionar</span>
          </Button>
        </div>

        {/* Category Sections */}
        <div className="space-y-3">
          {(Object.keys(ASSET_CATEGORIES) as AssetCategory[]).map((category) => {
            const categoryAssets = assetsByCategory[category] || [];
            const total = categoryAssets.reduce((sum, a) => sum + Number(a.valor), 0);
            const colors = getAssetCategoryColors(category);
            const Icon = iconMap[category];

            return (
              <CategorySection
                key={category}
                title={category}
                total={total}
                count={categoryAssets.length}
                icon={<Icon className={cn("h-5 w-5", colors.iconColor)} />}
                iconBgColor={colors.iconBg}
                iconColor={colors.iconColor}
                badgeColor={colors.badge}
                isEmpty={categoryAssets.length === 0}
              >
                {categoryAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3 bg-white rounded-[16px] shadow-md hover:scale-[1.01] transition-all cursor-pointer border border-blue-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm leading-tight">{asset.nombre}</p>
                        {asset.subcategoria && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-[9px] px-1.5 py-0", colors.badge)}
                            >
                              {asset.subcategoria}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-emerald-700 text-sm break-words">
                          {formatCurrency(Number(asset.valor))}
                        </p>
                        {asset.moneda !== 'MXN' && (
                          <p className="text-[10px] text-muted-foreground">{asset.moneda}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CategorySection>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
