import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, ChevronRight } from 'lucide-react';

interface Activo {
  id: string;
  nombre: string;
  valor: number | null;
  categoria: string;
  tasa_rendimiento: number | null;
}

export const PortfolioWidget: React.FC = () => {
  const navigate = useNavigate();

  const { data: activos = [], isLoading } = useQuery({
    queryKey: ['portfolio-assets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('activos')
        .select('id, nombre, valor, categoria, tasa_rendimiento')
        .eq('user_id', user.id)
        .order('valor', { ascending: false });

      if (error) throw error;
      return data as Activo[];
    }
  });

  const totalValue = activos.reduce((sum, a) => sum + (a.valor || 0), 0);

  // Sort by performance for top/bottom 3
  const sortedByPerformance = [...activos]
    .filter(a => a.tasa_rendimiento !== null)
    .sort((a, b) => (b.tasa_rendimiento || 0) - (a.tasa_rendimiento || 0));

  const topPerformers = sortedByPerformance.slice(0, 2);
  const bottomPerformers = sortedByPerformance.slice(-2).reverse();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '--';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card rounded-3xl shadow-lg">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activos.length === 0) {
    return (
      <Card 
        className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
        onClick={() => navigate('/portfolio')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5D4037]/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#5D4037]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Portafolio</h3>
                <p className="text-sm text-muted-foreground">Configura tus activos</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
      onClick={() => navigate('/portfolio')}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#5D4037]" />
            <span className="text-sm font-medium text-muted-foreground">Portafolio</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex gap-4">
          {/* Left - Total Value */}
          <div className="flex-1 border-r border-border pr-4">
            <p className="text-xs text-muted-foreground mb-1">Valor total</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{activos.length} activos</p>
          </div>

          {/* Right - Top/Bottom Performers */}
          <div className="flex-1 space-y-2">
            {/* Top Performers */}
            {topPerformers.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-[#5D4037]" />
                  <span className="text-[10px] text-muted-foreground uppercase">Mejores</span>
                </div>
                <div className="space-y-1">
                  {topPerformers.slice(0, 2).map(asset => (
                    <div key={asset.id} className="flex items-center justify-between">
                      <span className="text-xs text-foreground truncate max-w-[80px]">{asset.nombre}</span>
                      <span className="text-xs font-medium text-[#5D4037]">
                        {formatPercent(asset.tasa_rendimiento)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Performers */}
            {bottomPerformers.length > 0 && bottomPerformers[0]?.tasa_rendimiento !== topPerformers[0]?.tasa_rendimiento && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-[#A1887F]" />
                  <span className="text-[10px] text-muted-foreground uppercase">Menores</span>
                </div>
                <div className="space-y-1">
                  {bottomPerformers.slice(0, 1).map(asset => (
                    <div key={asset.id} className="flex items-center justify-between">
                      <span className="text-xs text-foreground truncate max-w-[80px]">{asset.nombre}</span>
                      <span className={`text-xs font-medium ${(asset.tasa_rendimiento || 0) < 0 ? 'text-[#8D6E63]' : 'text-muted-foreground'}`}>
                        {formatPercent(asset.tasa_rendimiento)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
