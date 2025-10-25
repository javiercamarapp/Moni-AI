import { ArrowLeft, CreditCard, Home, AlertTriangle, Plus, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetWorth } from "@/hooks/useNetWorth";
import BottomNav from "@/components/BottomNav";
import { CategorySection } from "@/components/networth/CategorySection";
import { LIABILITY_CATEGORIES, getLiabilityCategoryColors, type LiabilityCategory } from "@/lib/categoryDefinitions";

const iconMap = {
  'Pasivos corrientes (corto plazo)': CreditCard,
  'Pasivos no corrientes (largo plazo)': Home,
  'Pasivos contingentes o legales': AlertTriangle,
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

export default function Liabilities() {
  const navigate = useNavigate();
  const { data: netWorthData, isLoading } = useNetWorth('1Y');

  if (isLoading || !netWorthData) {
    return (
      <div className="min-h-screen animated-wave-bg pb-20">
        <div className="sticky top-0 z-40">
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
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Pasivos</h1>
                <p className="text-sm text-gray-500">Cargando...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 animate-pulse rounded-3xl shadow-sm">
            <div className="h-80 bg-gray-100 rounded-2xl"></div>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { liabilities, totalLiabilities } = netWorthData;

  // Group liabilities by category
  const liabilitiesByCategory = Object.keys(LIABILITY_CATEGORIES).reduce((acc, category) => {
    acc[category as LiabilityCategory] = liabilities.filter(l => l.categoria === category);
    return acc;
  }, {} as Record<LiabilityCategory, typeof liabilities>);

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Pasivos</h1>
              <p className="text-xs text-gray-500">Deudas y obligaciones</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 p-5 rounded-3xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">¿Qué son los Pasivos?</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Son las deudas u obligaciones que debes pagar a otros. Incluyen hipotecas, préstamos 
            estudiantiles, de automóvil, personales, deudas de tarjetas de crédito y obligaciones tributarias.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span>Los pasivos se clasifican en corrientes (corto plazo), no corrientes (largo plazo) y contingentes</span>
          </div>
        </Card>

        {/* Total Pasivos */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border-0 shadow-sm">
          <p className="text-xs text-gray-500 mb-1 font-medium">Total de Pasivos</p>
          <p className="text-3xl font-semibold text-destructive break-words tracking-tight">
            ${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Gestionar Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
            Categorías de Pasivos
          </h3>
          <Button
            onClick={() => navigate('/edit-assets-liabilities?tab=liabilities')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md border-0 h-9 px-3 transition-all"
            variant="ghost"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium text-gray-700">Gestionar</span>
          </Button>
        </div>

        {/* Category Sections */}
        <div className="space-y-3">
          {(Object.keys(LIABILITY_CATEGORIES) as LiabilityCategory[]).map((category) => {
            const categoryLiabilities = liabilitiesByCategory[category] || [];
            const total = categoryLiabilities.reduce((sum, l) => sum + Number(l.valor), 0);
            const colors = getLiabilityCategoryColors(category);
            const Icon = iconMap[category];

            return (
              <CategorySection
                key={category}
                title={category}
                total={total}
                count={categoryLiabilities.length}
                icon={<Icon className={cn("h-5 w-5", colors.iconColor)} />}
                iconBgColor={colors.iconBg}
                iconColor={colors.iconColor}
                badgeColor={colors.badge}
                isEmpty={categoryLiabilities.length === 0}
              >
                {categoryLiabilities.map((liability) => (
                  <div
                    key={liability.id}
                    className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{liability.nombre}</p>
                        {liability.subcategoria && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-[8px] px-1.5 py-0.5 whitespace-nowrap", colors.badge)}
                            >
                              {liability.subcategoria}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-destructive text-sm break-words">
                          {formatCurrency(Number(liability.valor))}
                        </p>
                        {liability.moneda !== 'MXN' && (
                          <p className="text-[10px] text-gray-500">{liability.moneda}</p>
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
