import { useState } from "react";
import { ArrowLeft, CreditCard, Home, Building2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetWorth } from "@/hooks/useNetWorth";
import BottomNav from "@/components/BottomNav";
import { FloatingPathsBackground } from "@/components/ui/floating-paths";

type CategoryFilter = 'All' | 'Current' | 'NonCurrent';

const iconMap: Record<string, any> = {
  CreditCard,
  Home,
  Building2,
};

const getIconForCategory = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('mortgage') || lowerCategory.includes('hipoteca')) return 'Home';
  if (lowerCategory.includes('credit') || lowerCategory.includes('tarjeta')) return 'CreditCard';
  if (lowerCategory.includes('loan') || lowerCategory.includes('préstamo')) return 'Building2';
  return 'CreditCard';
};

export default function Liabilities() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CategoryFilter>('All');
  const { data: netWorthData, isLoading } = useNetWorth('1Y');

  // Helper function to determine if a liability is current (short-term)
  const isCurrentLiability = (category: string, name?: string) => {
    const cat = category.toLowerCase();
    const accountName = name?.toLowerCase() || '';
    
    // Pasivos corrientes (corto plazo - menos de 1 año)
    const currentKeywords = [
      'credit card', 'tarjeta', 'credito',
      'short', 'corto plazo',
      'payable', 'por pagar'
    ];
    
    return currentKeywords.some(keyword => 
      cat.includes(keyword) || accountName.includes(keyword)
    );
  };

  if (isLoading || !netWorthData) {
    return (
      <div className="min-h-screen animated-wave-bg pb-20 relative overflow-hidden">
        <FloatingPathsBackground />
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

  const currentLiabilities = liabilities.filter(l => isCurrentLiability(l.category, l.name));
  const nonCurrentLiabilities = liabilities.filter(l => !isCurrentLiability(l.category, l.name));

  const totalCurrent = currentLiabilities.reduce((sum, l) => sum + Number(l.value), 0);
  const totalNonCurrent = nonCurrentLiabilities.reduce((sum, l) => sum + Number(l.value), 0);

  const displayLiabilities = 
    filter === 'Current' ? currentLiabilities :
    filter === 'NonCurrent' ? nonCurrentLiabilities :
    liabilities;

  return (
    <div className="min-h-screen animated-wave-bg pb-20 relative overflow-hidden">
      <FloatingPathsBackground />
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-40">
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
              <p className="text-sm text-foreground/80 font-medium">Deudas y obligaciones</p>
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
            <span>Los pasivos se clasifican en corrientes (corto plazo) y no corrientes (largo plazo)</span>
          </div>
        </Card>

        {/* Total Pasivos */}
        <div className="bg-white backdrop-blur-sm rounded-[20px] p-5 border border-blue-100 shadow-xl">
          <p className="text-xs text-foreground/80 mb-1 font-medium">Total de Pasivos</p>
          <p className="text-3xl font-bold text-destructive break-words">
            ${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            variant={filter === 'Current' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Current')}
            className={cn(
              "flex-1 transition-all rounded-[20px] shadow-lg font-semibold border border-blue-100 h-9",
              filter === 'Current'
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                : "bg-white text-foreground hover:bg-primary/10 hover:scale-105"
            )}
          >
            Corrientes
          </Button>
          <Button
            variant={filter === 'NonCurrent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('NonCurrent')}
            className={cn(
              "flex-1 transition-all rounded-[20px] shadow-lg font-semibold border border-blue-100 h-9",
              filter === 'NonCurrent'
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                : "bg-white text-foreground hover:bg-primary/10 hover:scale-105"
            )}
          >
            No Corrientes
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white backdrop-blur-sm rounded-[20px] p-4 border border-blue-100 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/30 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-xs text-foreground/80 font-medium">Pasivos Corrientes</p>
            </div>
            <p className="text-lg font-bold text-foreground break-words">
              ${totalCurrent >= 100000 
                ? `${(totalCurrent / 1000).toFixed(0)}k` 
                : totalCurrent.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Corto plazo ({currentLiabilities.length})
            </p>
          </div>
          <div className="bg-white backdrop-blur-sm rounded-[20px] p-4 border border-blue-100 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                <Home className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xs text-foreground/80 font-medium">Pasivos No Corrientes</p>
            </div>
            <p className="text-lg font-bold text-foreground break-words">
              ${totalNonCurrent >= 100000 
                ? `${(totalNonCurrent / 1000).toFixed(0)}k` 
                : totalNonCurrent.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Largo plazo ({nonCurrentLiabilities.length})
            </p>
          </div>
        </div>

        {/* Liabilities List */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground mb-3 drop-shadow-lg">
            {filter === 'Current' ? 'Pasivos Corrientes' : 
             filter === 'NonCurrent' ? 'Pasivos No Corrientes' : 
             'Todos los Pasivos'}
          </h3>
          {displayLiabilities.map((liability) => {
            const iconName = getIconForCategory(liability.category);
            const Icon = iconMap[iconName];
            const isCurrent = isCurrentLiability(liability.category, liability.name);
            
            return (
              <div
                key={liability.id}
                className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-[1.02] transition-all cursor-pointer border border-blue-100 animate-fade-in"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isCurrent 
                        ? "bg-orange-500/30" 
                        : "bg-purple-500/30"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isCurrent ? "text-orange-600" : "text-purple-600"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-sm leading-tight">{liability.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-foreground/70 leading-tight">{liability.category}</p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] px-1.5 py-0",
                            isCurrent 
                              ? "border-orange-500/40 text-orange-600 bg-orange-50" 
                              : "border-purple-500/40 text-purple-600 bg-purple-50"
                          )}
                        >
                          {isCurrent ? 'Corriente' : 'No Corriente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-destructive text-sm break-words">
                      ${Number(liability.value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {displayLiabilities.length === 0 && (
            <div className="p-8 text-center text-muted-foreground bg-white rounded-[20px] border border-blue-100 shadow-xl">
              No hay pasivos en esta categoría
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
