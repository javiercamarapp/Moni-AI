import { useState } from "react";
import { ArrowLeft, CreditCard, Home, Building2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetWorth } from "@/hooks/useNetWorth";
import BottomNav from "@/components/BottomNav";

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
                <h1 className="text-xl font-bold text-white">Pasivos</h1>
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
              <h1 className="text-xl font-bold text-white">Pasivos</h1>
              <p className="text-xs text-white/70">Deudas y obligaciones</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-br from-red-500/20 to-red-700/20 backdrop-blur-sm border-red-500/30 p-6">
          <h2 className="text-lg font-bold text-white mb-3">¿Qué son los Pasivos?</h2>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            Son las deudas u obligaciones que debes pagar a otros. Incluyen hipotecas, préstamos 
            estudiantiles, de automóvil, personales, deudas de tarjetas de crédito y obligaciones tributarias.
          </p>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <AlertCircle className="h-4 w-4" />
            <span>Los pasivos se clasifican en corrientes (corto plazo) y no corrientes (largo plazo)</span>
          </div>
        </Card>

        {/* Total Pasivos */}
        <div className="bg-gradient-to-br from-red-500/20 to-red-700/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
          <p className="text-xs text-white/70 mb-1">Total de Pasivos</p>
          <p className="text-3xl font-bold text-white break-words">
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
              "flex-1 transition-all",
              filter === 'All'
                ? "bg-white/20 text-white border-white/30"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            )}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'Current' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Current')}
            className={cn(
              "flex-1 transition-all",
              filter === 'Current'
                ? "bg-orange-500/30 text-white border-orange-500/40"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            )}
          >
            Corrientes
          </Button>
          <Button
            variant={filter === 'NonCurrent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('NonCurrent')}
            className={cn(
              "flex-1 transition-all",
              filter === 'NonCurrent'
                ? "bg-purple-500/30 text-white border-purple-500/40"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            )}
          >
            No Corrientes
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-500/10 backdrop-blur-sm rounded-xl p-3 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-orange-400" />
              <p className="text-[10px] text-white/70">Pasivos Corrientes</p>
            </div>
            <p className="text-sm font-bold text-orange-300 break-words">
              ${totalCurrent.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-white/50 mt-1">
              Corto plazo ({currentLiabilities.length})
            </p>
          </div>
          <div className="bg-purple-500/10 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-purple-400" />
              <p className="text-[10px] text-white/70">Pasivos No Corrientes</p>
            </div>
            <p className="text-sm font-bold text-purple-300 break-words">
              ${totalNonCurrent.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-white/50 mt-1">
              Largo plazo ({nonCurrentLiabilities.length})
            </p>
          </div>
        </div>

        {/* Liabilities List */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white mb-3">
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
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    isCurrent 
                      ? "bg-gradient-to-br from-orange-500 to-orange-700" 
                      : "bg-gradient-to-br from-purple-500 to-purple-700"
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{liability.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-white/60">{liability.category}</p>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] px-1.5 py-0",
                          isCurrent 
                            ? "border-orange-500/40 text-orange-300" 
                            : "border-purple-500/40 text-purple-300"
                        )}
                      >
                        {isCurrent ? 'Corriente' : 'No Corriente'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-bold text-red-300 text-sm break-words">
                    ${Number(liability.value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
          
          {displayLiabilities.length === 0 && (
            <div className="p-8 text-center text-white/60 bg-white/5 rounded-xl border border-white/10">
              No hay pasivos en esta categoría
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
