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
import { MoniLoader } from "@/components/MoniLoader";

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
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <MoniLoader size="lg" />
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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/net-worth')}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Activos</h1>
              <p className="text-xs text-gray-500">Recursos que posees</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 p-5 rounded-3xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">¿Qué son los Activos?</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Son los recursos que posees y que se pueden convertir en dinero. Incluyen bienes raíces, 
            dinero en efectivo, inversiones, vehículos, joyas, arte y cuentas de jubilación.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span>Los activos se clasifican en líquidos, fijos, financieros, por cobrar e intangibles</span>
          </div>
        </Card>

        {/* Total Activos */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border-0 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 font-medium">Total de Activos</p>
          <p className="text-3xl font-semibold text-emerald-700 break-words tracking-tight">
            ${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Gestionar Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
            Categorías de Activos
          </h3>
          <Button
            onClick={() => navigate('/edit-assets-liabilities')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md border-0 h-9 px-3 transition-all"
            variant="ghost"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium text-gray-700">Gestionar</span>
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
                    className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{asset.nombre}</p>
                        {asset.subcategoria && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-[8px] px-1.5 py-0.5 whitespace-nowrap", colors.badge)}
                            >
                              {asset.subcategoria}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-emerald-700 text-sm break-words">
                          {formatCurrency(Number(asset.valor))}
                        </p>
                        {asset.moneda !== 'MXN' && (
                          <p className="text-[10px] text-gray-500">{asset.moneda}</p>
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
