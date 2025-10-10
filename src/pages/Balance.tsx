import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Progress } from '@/components/ui/progress';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
interface CategoryBalance {
  id: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

// Mapeo de categorías a grupos
const categoryGroupMapping: Record<string, string> = {
  // Comidas
  'restaurante': 'Comidas',
  'restaurantes': 'Comidas',
  'comida': 'Comidas',
  'alimentos': 'Comidas',
  'supermercado': 'Comidas',
  'despensa': 'Comidas',
  'cafetería': 'Comidas',
  // Entretenimiento
  'entretenimiento': 'Entretenimiento',
  'cine': 'Entretenimiento',
  'teatro': 'Entretenimiento',
  'concierto': 'Entretenimiento',
  'museo': 'Entretenimiento',
  'videojuegos': 'Entretenimiento',
  // Salidas nocturnas
  'bar': 'Salidas Nocturnas',
  'bares': 'Salidas Nocturnas',
  'antro': 'Salidas Nocturnas',
  'discoteca': 'Salidas Nocturnas',
  'fiesta': 'Salidas Nocturnas',
  // Servicios
  'servicios': 'Servicios',
  'electricidad': 'Servicios',
  'agua': 'Servicios',
  'gas': 'Servicios',
  'internet': 'Servicios',
  'teléfono': 'Servicios',
  // Streaming
  'streaming': 'Streaming',
  'netflix': 'Streaming',
  'spotify': 'Streaming',
  'disney': 'Streaming',
  'prime': 'Streaming',
  'hbo': 'Streaming',
  // Auto
  'auto': 'Auto',
  'gasolina': 'Auto',
  'combustible': 'Auto',
  'mecánico': 'Auto',
  'reparación': 'Auto',
  'estacionamiento': 'Auto',
  'uber': 'Auto',
  'taxi': 'Auto'
};

// Colores metálicos oscuros para grupos de gastos
const groupColors: Record<string, string> = {
  'Comidas': 'hsl(25, 60%, 35%)',
  // Bronce
  'Entretenimiento': 'hsl(280, 50%, 32%)',
  // Morado metálico
  'Salidas Nocturnas': 'hsl(340, 55%, 30%)',
  // Rojo metálico
  'Servicios': 'hsl(200, 55%, 32%)',
  // Azul metálico
  'Streaming': 'hsl(145, 45%, 30%)',
  // Verde metálico
  'Auto': 'hsl(45, 60%, 35%)',
  // Dorado oscuro
  'Otros': 'hsl(220, 45%, 28%)' // Azul acero
};

// Colores metálicos oscuros para categorías de ingresos
const incomeCategoryColors: string[] = ['hsl(210, 55%, 35%)',
// Azul acero
'hsl(150, 50%, 32%)',
// Verde esmeralda
'hsl(280, 52%, 33%)',
// Morado metálico
'hsl(30, 58%, 36%)',
// Cobre
'hsl(190, 53%, 34%)',
// Turquesa metálico
'hsl(45, 55%, 38%)',
// Oro viejo
'hsl(0, 50%, 35%)',
// Rojo hierro
'hsl(260, 48%, 30%)' // Índigo metálico
];
const getIncomeCategoryColor = (index: number): string => {
  return incomeCategoryColors[index % incomeCategoryColors.length];
};
const getCategoryGroup = (categoryName: string): string => {
  const lowerName = categoryName.toLowerCase();
  for (const [key, group] of Object.entries(categoryGroupMapping)) {
    if (lowerName.includes(key)) {
      return group;
    }
  }
  return 'Otros';
};
const Balance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const [viewMode, setViewMode] = useState<'mensual' | 'anual'>(() => {
    // Primero verificar si hay un parámetro en la URL
    const urlPeriod = searchParams.get('period');
    if (urlPeriod === 'year') return 'anual';
    if (urlPeriod === 'month') return 'mensual';
    
    // Si no hay parámetro, usar localStorage
    const saved = localStorage.getItem('balanceViewMode');
    return saved as 'mensual' | 'anual' || 'mensual';
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Guardar viewMode en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('balanceViewMode', viewMode);
  }, [viewMode]);
  const [ingresosByCategory, setIngresosByCategory] = useState<CategoryBalance[]>(() => {
    try {
      const cached = localStorage.getItem('balance_ingresos');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [gastosByCategory, setGastosByCategory] = useState<CategoryBalance[]>(() => {
    try {
      const cached = localStorage.getItem('balance_gastos');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [totalIngresos, setTotalIngresos] = useState(() => {
    const cached = localStorage.getItem('balance_totalIngresos');
    return cached ? parseFloat(cached) : 0;
  });
  const [totalGastos, setTotalGastos] = useState(() => {
    const cached = localStorage.getItem('balance_totalGastos');
    return cached ? parseFloat(cached) : 0;
  });
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
  } | null>(() => {
    try {
      const cached = localStorage.getItem('balance_proyecciones');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loadingProyecciones, setLoadingProyecciones] = useState(false);
  const [isUpdatingProjections, setIsUpdatingProjections] = useState(false);

  // Extract year and month for PDF generation
  const selectedYear = currentMonth.getFullYear();
  const selectedMonth = currentMonth.getMonth() + 1;

  // Calculate balance from state
  const balance = totalIngresos - totalGastos;
  const ahorro = balance;
  const tasaAhorro = totalIngresos > 0 ? ahorro / totalIngresos * 100 : 0;
  useEffect(() => {
    fetchBalanceData();
  }, [currentMonth, viewMode]);

  // Fetch AI predictions ONCE when component loads or when actual data changes
  // Prevent multiple simultaneous calls
  useEffect(() => {
    if (isUpdatingProjections) return; // Prevent concurrent calls

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
  }, [totalIngresos, totalGastos]);
  const fetchAIProjections = async () => {
    if (isUpdatingProjections) return; // Prevent concurrent calls

    // Verificar caché primero - usar datos de hasta 10 minutos
    const cacheKey = `balance_proyecciones_${viewMode}_${currentMonth.toISOString()}`;
    const cacheTimeKey = `${cacheKey}_time`;
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = Date.now();
    
    if (cachedTime && (now - parseInt(cachedTime)) < 10 * 60 * 1000) {
      console.log('✅ Using cached projections');
      return; // Ya tenemos datos frescos en caché
    }

    try {
      setIsUpdatingProjections(true);
      setLoadingProyecciones(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get transactions for the specific period (for insights)
      const startDate = viewMode === 'mensual' ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) : new Date(currentMonth.getFullYear(), 0, 1);
      const endDate = viewMode === 'mensual' ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0) : new Date(currentMonth.getFullYear(), 11, 31);
      const {
        data: transactions
      } = await supabase.from('transactions').select('*, categories(name)').eq('user_id', user.id).gte('transaction_date', startDate.toISOString().split('T')[0]).lte('transaction_date', endDate.toISOString().split('T')[0]).order('transaction_date', {
        ascending: false
      });

      // Get todas las transacciones históricas
      const {
        data: allTransactions
      } = await supabase.from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });
      const periodLabel = getPeriodLabel();
      const {
        data,
        error
      } = await supabase.functions.invoke('predict-savings', {
        body: {
          userId: user.id,
          transactions,
          // Período específico para insights
          allTransactions,
          // Todo el historial para proyecciones
          totalIngresos,
          totalGastos,
          balance,
          viewMode,
          periodLabel
        }
      });
      if (error) throw error;
      setProyecciones(data);
      // Guardar en caché con timestamp
      localStorage.setItem('balance_proyecciones', JSON.stringify(data));
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheTimeKey, now.toString());
      console.log('✅ Projections cached successfully');
    } catch (error) {
      console.error('Error fetching AI projections:', error);
      // Fallback: calculate based on all historical data, not current period
      setProyecciones({
        proyeccionAnual: balance * 12,
        proyeccionSemestral: balance * 6,
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
      setIsUpdatingProjections(false);
    }
  };
  const fetchBalanceData = async () => {
    setLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
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

      // Fetch ALL transactions using pagination (Supabase has 1000 record default limit)
      let allTransactions: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const {
          data: pageData
        } = await supabase.from('transactions').select('*, categories(id, name, color, type)').eq('user_id', user.id).gte('transaction_date', startDate.toISOString().split('T')[0]).lte('transaction_date', endDate.toISOString().split('T')[0]).range(page * pageSize, (page + 1) * pageSize - 1);
        if (pageData && pageData.length > 0) {
          allTransactions = [...allTransactions, ...pageData];
          hasMore = pageData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      const transactions = allTransactions;
      if (!transactions) return;
      console.log('=== BALANCE PAGE CALCULATIONS ===');
      console.log('View mode:', viewMode);
      console.log('Date range:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      console.log('Total transactions fetched:', transactions.length);

      // Process ingresos
      const ingresosData = transactions.filter(t => t.type === 'ingreso');
      const totalIng = ingresosData.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalIngresos(totalIng);
      localStorage.setItem('balance_totalIngresos', totalIng.toString());
      
      console.log('Ingresos count:', ingresosData.length);
      console.log('Total Ingresos:', totalIng);
      const ingresosCategoryMap = new Map<string, {
        name: string;
        color: string;
        total: number;
      }>();
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
      const ingresosWithPercentage: CategoryBalance[] = Array.from(ingresosCategoryMap.entries()).map(([id, data], index) => ({
        id,
        name: data.name,
        color: getIncomeCategoryColor(index),
        total: data.total,
        percentage: totalIng > 0 ? data.total / totalIng * 100 : 0
      })).sort((a, b) => b.total - a.total);
      setIngresosByCategory(ingresosWithPercentage);
      localStorage.setItem('balance_ingresos', JSON.stringify(ingresosWithPercentage));

      // Process gastos with grouping
      const gastosData = transactions.filter(t => t.type === 'gasto');
      const totalGast = gastosData.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalGastos(totalGast);
      localStorage.setItem('balance_totalGastos', totalGast.toString());
      
      console.log('Gastos count:', gastosData.length);
      console.log('Total Gastos:', totalGast);
      console.log('Balance:', totalIng - totalGast);
      console.log('Tasa Ahorro:', totalIng > 0 ? (totalIng - totalGast) / totalIng * 100 : 0);
      console.log('==================================');
      const gastosGroupMap = new Map<string, {
        name: string;
        color: string;
        total: number;
      }>();
      gastosData.forEach(t => {
        if (t.categories) {
          const groupName = getCategoryGroup(t.categories.name);
          const groupColor = groupColors[groupName] || groupColors['Otros'];
          const existing = gastosGroupMap.get(groupName) || {
            name: groupName,
            color: groupColor,
            total: 0
          };
          existing.total += Number(t.amount);
          gastosGroupMap.set(groupName, existing);
        }
      });
      const gastosWithPercentage: CategoryBalance[] = Array.from(gastosGroupMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color,
        total: data.total,
        percentage: totalGast > 0 ? data.total / totalGast * 100 : 0
      })).sort((a, b) => b.total - a.total);
      setGastosByCategory(gastosWithPercentage);
      localStorage.setItem('balance_gastos', JSON.stringify(gastosWithPercentage));
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
      return currentMonth.toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric'
      });
    }
    return currentMonth.getFullYear().toString();
  };
  if (loading) {
    return <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <p className="text-white text-lg">Cargando balance...</p>
      </div>;
  }
  return <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-foreground hover:bg-accent/50 transition-all hover:scale-105">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Análisis de Ingresos y Gastos</h1>
            <p className="text-sm text-muted-foreground">Visualiza todos los movimientos entre tus cuentas</p>
          </div>
        </div>
      </div>

      {/* Toggle Mensual/Anual */}
      <div className="px-4 mb-4">
        <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'mensual' | 'anual')} className="w-full">
          <TabsList className="w-full bg-card/70 backdrop-blur-sm border border-border/30">
            <TabsTrigger value="mensual" className="flex-1 data-[state=active]:bg-accent text-foreground transition-all">
              Mensual
            </TabsTrigger>
            <TabsTrigger value="anual" className="flex-1 data-[state=active]:bg-accent text-foreground transition-all">
              Anual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Período selector */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePreviousPeriod} className="text-foreground hover:bg-accent/50 transition-all hover:scale-105">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="bg-card/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/30 shadow-card">
            <p className="text-foreground font-medium capitalize text-center">
              {getPeriodLabel()}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={handleNextPeriod} className="text-foreground hover:bg-accent/50 transition-all hover:scale-105">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Ahorro destacado */}
        <Card className="p-6 bg-gradient-to-br from-[hsl(145,45%,30%)] to-[hsl(145,55%,25%)] border-[hsl(145,50%,35%)]/50 card-glow animate-fade-in shadow-elegant" style={{
        animationDelay: '0ms'
      }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-card/40 backdrop-blur-sm rounded-full border border-border/30">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/90">
                Ahorro {viewMode === 'mensual' ? 'Mensual' : 'Anual'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                ${ahorro.toLocaleString('es-MX', {
                minimumFractionDigits: 2
              })}
              </h2>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/90">
              <span>Tasa de ahorro:</span>
              <span className="font-semibold">{tasaAhorro.toFixed(1)}%</span>
            </div>
            <Progress value={tasaAhorro} className="h-2 bg-card/30" />
          </div>
          
          {/* Botón de descarga de PDF */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <Button variant="ghost" className="w-full bg-card/40 backdrop-blur-sm border border-border/30 text-white hover:bg-card/60 transition-all duration-300 h-auto py-2.5 px-4 text-xs sm:text-sm leading-tight" onClick={async () => {
            try {
              // Get current user
              const {
                data: {
                  user
                }
              } = await supabase.auth.getUser();
              if (!user) {
                toast({
                  title: "Error",
                  description: "Debes iniciar sesión para descargar el reporte",
                  variant: "destructive"
                });
                return;
              }
              console.log('🔵 Iniciando descarga de reporte...');
              toast({
                title: "Generando reporte",
                description: "Preparando tu reporte de movimientos..."
              });
              const {
                data,
                error
              } = await supabase.functions.invoke('generate-statement-pdf', {
                body: {
                  viewMode,
                  year: selectedYear,
                  month: selectedMonth,
                  userId: user.id
                }
              });
              console.log('🔵 Respuesta recibida:', {
                hasData: !!data,
                hasError: !!error,
                dataKeys: data ? Object.keys(data) : []
              });
              if (error) {
                console.error('🔴 Error del edge function:', error);
                throw error;
              }
              if (!data || !data.html || !data.filename) {
                console.error('🔴 Datos incompletos:', {
                  hasData: !!data,
                  hasHtml: !!data?.html,
                  hasFilename: !!data?.filename
                });
                throw new Error('Datos incompletos en la respuesta');
              }
              console.log('🔵 Creando blob y descargando...', {
                htmlLength: data.html.length
              });

              // Crear blob con el HTML
              const blob = new Blob([data.html], {
                type: 'text/html'
              });
              const url = URL.createObjectURL(blob);

              // Crear link temporal y hacer click
              const link = document.createElement('a');
              link.href = url;
              link.download = data.filename.replace('.pdf', '.html');
              document.body.appendChild(link);
              link.click();

              // Limpiar
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              console.log('✅ Descarga iniciada');
              toast({
                title: "Reporte descargado",
                description: "Abre el archivo HTML descargado y usa Ctrl+P (Cmd+P en Mac) para guardarlo como PDF."
              });
            } catch (error: any) {
              console.error('🔴 Error al generar reporte:', error);
              toast({
                title: "Error",
                description: error.message || "No se pudo generar el reporte",
                variant: "destructive"
              });
            }
          }}>
              <Download className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="break-words whitespace-normal">Descargar movimientos del {viewMode === 'mensual' ? 'mes' : 'año'} en PDF</span>
            </Button>
          </div>
        </Card>

        {/* Ingresos y Gastos en línea horizontal */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-card card-glow text-center hover-lift shadow-card border border-border/30 animate-fade-in cursor-pointer" style={{
          animationDelay: '100ms'
        }} onClick={() => navigate('/ingresos')}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <p className="text-sm text-muted-foreground">Ingresos</p>
            </div>
            <p className="text-base font-bold text-foreground break-words leading-tight overflow-hidden">
              ${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-card card-glow text-center hover-lift shadow-card border border-border/30 animate-fade-in cursor-pointer" style={{
          animationDelay: '200ms'
        }} onClick={() => navigate('/gastos')}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Gastos</p>
            </div>
            <p className="text-base font-bold text-foreground break-words leading-tight overflow-hidden">
              ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Balance abajo */}
        <Card className={`p-4 card-glow text-center hover-lift shadow-elegant border animate-fade-in transition-all duration-300 ${balance >= 0 ? 'bg-gradient-to-br from-[hsl(145,45%,30%)] to-[hsl(145,55%,25%)] border-[hsl(145,50%,35%)]/50' : 'bg-gradient-to-br from-[hsl(0,50%,30%)] to-[hsl(0,55%,25%)] border-[hsl(0,50%,35%)]/50'}`} style={{
          animationDelay: '300ms'
        }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wallet className={`h-5 w-5 ${balance >= 0 ? 'text-green-200' : 'text-red-200'}`} />
            <p className="text-sm text-white/90">Balance</p>
          </div>
          <p className="text-base font-bold text-white break-words leading-tight overflow-hidden">
            ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>

        {/* Ingresos por categoría */}
        <Card className="p-5 bg-gradient-card card-glow shadow-elegant border border-border/30 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <h3 className="text-lg font-semibold text-card-foreground">Ingresos por Categoría</h3>
          </div>
          
          {ingresosByCategory.length === 0 ? <p className="text-card-foreground/70 text-center py-4">No hay ingresos registrados</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfica */}
              <div className="w-full h-[280px] md:h-[320px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ingresosByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="hsl(var(--primary))" dataKey="total">
                      {ingresosByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={({
                  active,
                  payload
                }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return <div className="bg-white border-2 border-gray-800 rounded-lg p-3 shadow-2xl">
                              <p className="font-bold text-gray-900 text-base">{data.name}</p>
                              <p className="text-sm text-gray-700 font-medium mt-1">
                                ${data.total.toLocaleString('es-MX', {
                          minimumFractionDigits: 2
                        })}
                              </p>
                              <p className="text-xs text-gray-600 font-semibold">
                                {data.percentage.toFixed(1)}% del total
                              </p>
                            </div>;
                  }
                  return null;
                }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Categorías */}
              <div className="flex flex-col justify-center space-y-3 py-2">
                {ingresosByCategory.map((category, index) => <div key={index} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{
                backgroundColor: category.color
              }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${category.total.toLocaleString('es-MX', {
                    minimumFractionDigits: 2
                  })} ({category.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>)}
              </div>
            </div>}
        </Card>

        {/* Gastos por categoría */}
        <Card className="p-5 bg-gradient-card card-glow shadow-elegant border border-border/30 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold text-card-foreground">Gastos por Categoría</h3>
          </div>
          
          {gastosByCategory.length === 0 ? <p className="text-card-foreground/70 text-center py-4">No hay gastos registrados</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfica */}
              <div className="w-full h-[280px] md:h-[320px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gastosByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="hsl(var(--destructive))" dataKey="total">
                      {gastosByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={({
                  active,
                  payload
                }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return <div className="bg-white border-2 border-gray-800 rounded-lg p-3 shadow-2xl">
                              <p className="font-bold text-gray-900 text-base">{data.name}</p>
                              <p className="text-sm text-gray-700 font-medium mt-1">
                                ${data.total.toLocaleString('es-MX', {
                          minimumFractionDigits: 2
                        })}
                              </p>
                              <p className="text-xs text-gray-600 font-semibold">
                                {data.percentage.toFixed(1)}% del total
                              </p>
                            </div>;
                  }
                  return null;
                }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Categorías */}
              <div className="flex flex-col justify-center space-y-3 py-2">
                {gastosByCategory.map((category, index) => <div key={index} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{
                backgroundColor: category.color
              }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${category.total.toLocaleString('es-MX', {
                    minimumFractionDigits: 2
                  })} ({category.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>)}
              </div>
            </div>}
        </Card>
      </div>
      
      <BottomNav />
    </div>;
};
export default Balance;