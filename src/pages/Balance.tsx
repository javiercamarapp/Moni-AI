import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryBalance {
  id: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

const Balance = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'mensual' | 'anual'>('mensual');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [ingresosByCategory, setIngresosByCategory] = useState<CategoryBalance[]>([]);
  const [gastosByCategory, setGastosByCategory] = useState<CategoryBalance[]>([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [proyecciones, setProyecciones] = useState<{
    proyeccionAnual: number;
    proyeccionSemestral: number;
    confianza: string;
    insights: Array<{
      titulo: string;
      metrica: string;
      descripcion: string;
      tipo: 'positivo' | 'negativo' | 'neutral' | 'consejo';
    }>;
  } | null>(null);
  const [loadingProyecciones, setLoadingProyecciones] = useState(false);

  // Calculate balance from state
  const balance = totalIngresos - totalGastos;
  const ahorro = balance;
  const tasaAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

  useEffect(() => {
    fetchBalanceData();
  }, [currentMonth, viewMode]);

  // Fetch AI predictions when balance data changes
  useEffect(() => {
    if (totalIngresos > 0 || totalGastos > 0) {
      fetchAIProjections();
    } else {
      // No hay datos, establecer proyecciones vacías
      setProyecciones({
        proyeccionAnual: 0,
        proyeccionSemestral: 0,
        confianza: 'sin-datos',
        insights: [{
          titulo: 'Sin Datos Suficientes',
          metrica: '0 transacciones',
          descripcion: 'Aún no hay suficientes datos para hacer proyecciones. Empieza registrando tus ingresos y gastos.',
          tipo: 'neutral'
        }]
      });
      setLoadingProyecciones(false);
    }
  }, [totalIngresos, totalGastos, balance, viewMode]);

  const fetchAIProjections = async () => {
    try {
      setLoadingProyecciones(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent transactions for AI analysis
      const startDate = viewMode === 'mensual' 
        ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        : new Date(currentMonth.getFullYear(), 0, 1);
      
      const endDate = viewMode === 'mensual'
        ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
        : new Date(currentMonth.getFullYear(), 11, 31);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      const { data, error } = await supabase.functions.invoke('predict-savings', {
        body: {
          userId: user.id,
          transactions,
          totalIngresos,
          totalGastos,
          balance,
          viewMode
        }
      });

      if (error) throw error;
      setProyecciones(data);
    } catch (error) {
      console.error('Error fetching AI projections:', error);
      // Fallback to simple calculation
      setProyecciones({
        proyeccionAnual: viewMode === 'mensual' ? balance * 12 : balance,
        proyeccionSemestral: viewMode === 'mensual' ? balance * 6 : balance / 2,
        confianza: 'baja',
        insights: [{
          titulo: 'Proyección Simple',
          metrica: 'Básica',
          descripcion: 'Proyección simple basada en balance actual',
          tipo: 'neutral'
        }]
      });
    } finally {
      setLoadingProyecciones(false);
    }
  };

  const fetchBalanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Calculate date range based on view mode
      let startDate: Date, endDate: Date;
      
      if (viewMode === 'mensual') {
        startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      } else {
        startDate = new Date(currentMonth.getFullYear(), 0, 1);
        endDate = new Date(currentMonth.getFullYear(), 11, 31);
      }

      // Fetch all transactions in range
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(id, name, color, type)')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (!transactions) return;

      // Process ingresos
      const ingresosData = transactions.filter(t => t.type === 'ingreso');
      const totalIng = ingresosData.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalIngresos(totalIng);

      const ingresosCategoryMap = new Map<string, { name: string; color: string; total: number }>();
      ingresosData.forEach(t => {
        if (t.categories) {
          const existing = ingresosCategoryMap.get(t.categories.id) || { 
            name: t.categories.name, 
            color: t.categories.color, 
            total: 0 
          };
          existing.total += Number(t.amount);
          ingresosCategoryMap.set(t.categories.id, existing);
        }
      });

      const ingresosWithPercentage: CategoryBalance[] = Array.from(ingresosCategoryMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color,
        total: data.total,
        percentage: totalIng > 0 ? (data.total / totalIng) * 100 : 0
      })).sort((a, b) => b.total - a.total);

      setIngresosByCategory(ingresosWithPercentage);

      // Process gastos
      const gastosData = transactions.filter(t => t.type === 'gasto');
      const totalGast = gastosData.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalGastos(totalGast);

      const gastosCategoryMap = new Map<string, { name: string; color: string; total: number }>();
      gastosData.forEach(t => {
        if (t.categories) {
          const existing = gastosCategoryMap.get(t.categories.id) || { 
            name: t.categories.name, 
            color: t.categories.color, 
            total: 0 
          };
          existing.total += Number(t.amount);
          gastosCategoryMap.set(t.categories.id, existing);
        }
      });

      const gastosWithPercentage: CategoryBalance[] = Array.from(gastosCategoryMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color,
        total: data.total,
        percentage: totalGast > 0 ? (data.total / totalGast) * 100 : 0
      })).sort((a, b) => b.total - a.total);

      setGastosByCategory(gastosWithPercentage);

    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPeriod = () => {
    if (viewMode === 'mensual') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'mensual') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'mensual') {
      return currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    }
    return currentMonth.getFullYear().toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <p className="text-white text-lg">Cargando balance...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Balance Financiero
            </h1>
            <p className="text-sm text-white/80">Análisis de ingresos y gastos</p>
          </div>
        </div>
      </div>

      {/* Toggle Mensual/Anual */}
      <div className="px-4 mb-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'mensual' | 'anual')} className="w-full">
          <TabsList className="w-full bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="mensual" className="flex-1 data-[state=active]:bg-white/20 text-white">
              Mensual
            </TabsTrigger>
            <TabsTrigger value="anual" className="flex-1 data-[state=active]:bg-white/20 text-white">
              Anual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Período selector */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousPeriod}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white font-medium capitalize text-center">
              {getPeriodLabel()}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPeriod}
            className="text-white hover:bg-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Ahorro destacado */}
        <Card className={`p-6 card-glow animate-fade-in ${
          ahorro >= 0 
            ? 'bg-gradient-to-br from-green-600/90 to-green-800/90 border-green-500/30' 
            : 'bg-gradient-to-br from-red-600/90 to-red-800/90 border-red-500/30'
        }`} style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/90">
                Ahorro {viewMode === 'mensual' ? 'Mensual' : 'Anual'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                ${ahorro.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/90">
              <span>Tasa de ahorro:</span>
              <span className="font-semibold">{tasaAhorro.toFixed(1)}%</span>
            </div>
            <Progress value={tasaAhorro} className="h-2 bg-white/20" />
          </div>
        </Card>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card 
            className="p-4 bg-gradient-card card-glow text-center hover:scale-105 transition-transform duration-200 animate-fade-in cursor-pointer" 
            style={{ animationDelay: '100ms' }}
            onClick={() => navigate('/ingresos')}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <p className="text-sm text-white/70">Ingresos</p>
            </div>
            <p className="text-2xl font-bold text-white">
              ${totalIngresos.toLocaleString('es-MX')}
            </p>
          </Card>

          <Card 
            className="p-4 bg-gradient-card card-glow text-center hover:scale-105 transition-transform duration-200 animate-fade-in cursor-pointer" 
            style={{ animationDelay: '200ms' }}
            onClick={() => navigate('/gastos')}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <p className="text-sm text-white/70">Gastos</p>
            </div>
            <p className="text-2xl font-bold text-white">
              ${totalGastos.toLocaleString('es-MX')}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-card card-glow text-center hover:scale-105 transition-transform duration-200 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-blue-400" />
              <p className="text-sm text-white/70">Balance</p>
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${balance.toLocaleString('es-MX')}
            </p>
          </Card>
        </div>

        {/* Proyecciones con IA */}
        <Card className="p-5 bg-gradient-card card-glow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Proyecciones Inteligentes</h3>
            {proyecciones && (
              <Badge className={`whitespace-nowrap px-3 ${
                proyecciones.confianza === 'sin-datos' || proyecciones.proyeccionAnual <= 0
                  ? 'bg-red-500/20 text-red-200 border-red-500/30'
                  : proyecciones.proyeccionAnual > 0 && proyecciones.confianza === 'alta'
                  ? 'bg-green-500/20 text-green-200 border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
              }`}>
                {proyecciones.confianza === 'sin-datos' 
                  ? 'Sin datos'
                  : `Confianza ${proyecciones.confianza}`
                }
              </Badge>
            )}
          </div>

          {loadingProyecciones ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/70 mt-2 text-sm">Analizando patrones financieros...</p>
            </div>
          ) : proyecciones ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-white/70 mb-1">
                    Proyección Anual
                  </p>
                  <p className="text-xl font-bold text-white">
                    ${proyecciones.proyeccionAnual.toLocaleString('es-MX')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/70 mb-1">
                    Proyección Semestral
                  </p>
                  <p className="text-xl font-bold text-white">
                    ${proyecciones.proyeccionSemestral.toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
              
              {proyecciones.insights && proyecciones.insights.length > 0 && (
                <Carousel 
                  className="w-full"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 4000,
                    }),
                  ]}
                >
                  <CarouselContent>
                    {proyecciones.insights.map((insight, index) => (
                      <CarouselItem key={index}>
                        <div className={`bg-white/5 rounded-lg p-4 border ${
                          insight.tipo === 'positivo' 
                            ? 'border-green-500/30 bg-green-500/5'
                            : insight.tipo === 'negativo'
                            ? 'border-red-500/30 bg-red-500/5'
                            : insight.tipo === 'consejo'
                            ? 'border-blue-500/30 bg-blue-500/5'
                            : 'border-white/10'
                        }`}>
                          <div className="mb-2">
                            <h4 className="text-base font-semibold text-white">{insight.titulo}</h4>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">{insight.descripcion}</p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              )}
            </>
          ) : (
            <p className="text-white/70 text-center py-4">
              Cargando proyecciones...
            </p>
          )}
        </Card>

        {/* Ingresos por categoría */}
        <Card className="p-5 bg-gradient-card card-glow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Ingresos por Categoría</h3>
          </div>
          
          {ingresosByCategory.length === 0 ? (
            <p className="text-white/70 text-center py-4">No hay ingresos registrados</p>
          ) : (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ingresosByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {ingresosByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${120 + index * 30}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString('es-MX')}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => (
                      <span className="text-white text-xs">
                        {value}: ${entry.payload.total.toLocaleString('es-MX')}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Gastos por categoría */}
        <Card className="p-5 bg-gradient-card card-glow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Gastos por Categoría</h3>
          </div>
          
          {gastosByCategory.length === 0 ? (
            <p className="text-white/70 text-center py-4">No hay gastos registrados</p>
          ) : (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gastosByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {gastosByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${0 + index * 30}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString('es-MX')}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => (
                      <span className="text-white text-xs">
                        {value}: ${entry.payload.total.toLocaleString('es-MX')}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Resumen del balance */}
        <Card className="p-5 bg-gradient-card card-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Resumen</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Total Ingresos:</span>
              <span className="text-white font-semibold text-lg">
                ${totalIngresos.toLocaleString('es-MX')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Total Gastos:</span>
              <span className="text-white font-semibold text-lg">
                -${totalGastos.toLocaleString('es-MX')}
              </span>
            </div>
            <div className="border-t border-white/20 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Balance Final:</span>
                <span className={`font-bold text-xl ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${balance.toLocaleString('es-MX')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Balance;
