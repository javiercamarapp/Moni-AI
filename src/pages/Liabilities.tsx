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
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Pasivos</h1>
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

  const { liabilities, totalLiabilities } = netWorthData;

  // Group liabilities by category
  const liabilitiesByCategory = Object.keys(LIABILITY_CATEGORIES).reduce((acc, category) => {
    acc[category as LiabilityCategory] = liabilities.filter(l => l.categoria === category);
    return acc;
  }, {} as Record<LiabilityCategory, typeof liabilities>);

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Pasivos</h1>
              <p className="text-xs text-muted-foreground">Deudas y obligaciones</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-blue-100 p-5 rounded-[20px] shadow-xl">
          <h2 className="text-lg font-bold text-foreground mb-3">¿Qué son los Pasivos?</h2>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Son las deudas u obligaciones que debes pagar a otros. Incluyen hipotecas, préstamos 
            estudiantiles, de automóvil, personales, deudas de tarjetas de crédito y obligaciones tributarias.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Los pasivos se clasifican en corrientes (corto plazo), no corrientes (largo plazo) y contingentes</span>
          </div>
        </Card>

        {/* Total Pasivos */}
        <div className="bg-white backdrop-blur-sm rounded-[20px] p-5 border border-blue-100 shadow-xl">
          <p className="text-xs text-foreground/80 mb-1 font-medium">Total de Pasivos</p>
          <p className="text-3xl font-bold text-destructive break-words">
            ${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Gestionar Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground drop-shadow-lg">
            Categorías de Pasivos
          </h3>
          <Button
            onClick={() => navigate('/edit-assets-liabilities?tab=liabilities')}
            className="bg-white rounded-[16px] shadow-xl hover:bg-white/90 border border-blue-100 h-9 px-3"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Gestionar</span>
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
                    className="p-3 bg-white rounded-[16px] shadow-md hover:scale-[1.01] transition-all cursor-pointer border border-blue-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm leading-tight">{liability.nombre}</p>
                        {liability.subcategoria && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-[9px] px-1.5 py-0", colors.badge)}
                            >
                              {liability.subcategoria}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-destructive text-sm break-words">
                          {formatCurrency(Number(liability.valor))}
                        </p>
                        {liability.moneda !== 'MXN' && (
                          <p className="text-[10px] text-muted-foreground">{liability.moneda}</p>
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
