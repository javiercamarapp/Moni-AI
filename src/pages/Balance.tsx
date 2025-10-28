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
import { LoadingScreen } from '@/components/LoadingScreen';
import WeeklyIncomeExpenseWidget from '@/components/analysis/WeeklyIncomeExpenseWidget';
import CategoryBreakdownWidget from '@/components/analysis/CategoryBreakdownWidget';

interface CategoryBalance {
  id: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

interface DayData {
  day: string;
  dayFull: string;
  income: number;
  expense: number;
  net: number;
}

// Colores vibrantes para categorías de gastos (gráfica de pie)
const expenseCategoryColors: string[] = [
  'hsl(0, 70%, 55%)',     // Rojo vibrante
  'hsl(30, 75%, 55%)',    // Naranja
  'hsl(45, 80%, 55%)',    // Amarillo dorado
  'hsl(150, 60%, 45%)',   // Verde
  'hsl(200, 70%, 50%)',   // Azul cielo
  'hsl(260, 65%, 55%)',   // Púrpura
  'hsl(340, 70%, 55%)',   // Rosa
  'hsl(180, 60%, 45%)',   // Turquesa
  'hsl(280, 60%, 50%)',   // Violeta
  'hsl(20, 75%, 55%)',    // Naranja rojizo
  'hsl(90, 55%, 45%)',    // Verde lima
  'hsl(220, 65%, 55%)',   // Azul royal
];

const getExpenseCategoryColor = (index: number): string => {
  return expenseCategoryColors[index % expenseCategoryColors.length];
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(() => {
    // Verificar si hay datos en caché
    const hasIngresos = localStorage.getItem('balance_ingresos');
    const hasGastos = localStorage.getItem('balance_gastos');
    return !!(hasIngresos && hasGastos);
  });
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
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [weeklyInsight, setWeeklyInsight] = useState<string>('');

  // Extract year and month for PDF generation
  const selectedYear = currentMonth.getFullYear();
  const selectedMonth = currentMonth.getMonth() + 1;

  // Calculate balance from state
  const balance = totalIngresos - totalGastos;
  const ahorro = balance;
  const tasaAhorro = totalIngresos > 0 ? ahorro / totalIngresos * 100 : 0;
  useEffect(() => {
    fetchBalanceData();
    fetchWeeklyData();
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

      // Get transactions for the specific period (for insights) with pagination
      const startDate = viewMode === 'mensual' ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) : new Date(currentMonth.getFullYear(), 0, 1);
      const endDate = viewMode === 'mensual' ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0) : new Date(currentMonth.getFullYear(), 11, 31);
      
      let periodTransactions: any[] = [];
      let hasMorePeriod = true;
      let lastIdPeriod: string | null = null;
      
      while (hasMorePeriod) {
        let queryPeriod = supabase
          .from('transactions')
          .select('*, categories(name)')
          .eq('user_id', user.id)
          .gte('transaction_date', startDate.toISOString().split('T')[0])
          .lte('transaction_date', endDate.toISOString().split('T')[0])
          .order('id', { ascending: true })
          .limit(10000);
        
        if (lastIdPeriod) {
          queryPeriod = queryPeriod.gt('id', lastIdPeriod);
        }
        
        const { data: pageData } = await queryPeriod;
        
        if (!pageData || pageData.length === 0) {
          hasMorePeriod = false;
          break;
        }
        
        periodTransactions = [...periodTransactions, ...pageData];
        lastIdPeriod = pageData[pageData.length - 1].id;
        hasMorePeriod = pageData.length === 10000;
      }
      
      periodTransactions.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      // Get todas las transacciones históricas with pagination
      let allTransactions: any[] = [];
      let hasMoreAll = true;
      let lastIdAll: string | null = null;
      
      while (hasMoreAll) {
        let queryAll = supabase
          .from('transactions')
          .select('*, categories(name)')
          .eq('user_id', user.id)
          .order('id', { ascending: true })
          .limit(10000);
        
        if (lastIdAll) {
          queryAll = queryAll.gt('id', lastIdAll);
        }
        
        const { data: pageData } = await queryAll;
        
        if (!pageData || pageData.length === 0) {
          hasMoreAll = false;
          break;
        }
        
        allTransactions = [...allTransactions, ...pageData];
        lastIdAll = pageData[pageData.length - 1].id;
        hasMoreAll = pageData.length === 10000;
      }
      
      allTransactions.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
      const periodLabel = getPeriodLabel();
      const {
        data,
        error
      } = await supabase.functions.invoke('predict-savings', {
        body: {
          userId: user.id,
          transactions: periodTransactions, // Período específico para insights
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

  const fetchWeeklyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current date
      const today = new Date();
      const currentDayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
      
      // Calculate start of current week (always Monday)
      const startOfWeek = new Date(today);
      if (currentDayOfWeek === 0) {
        // If Sunday, go back 6 days to Monday
        startOfWeek.setDate(today.getDate() - 6);
      } else {
        // For other days, go back to Monday
        startOfWeek.setDate(today.getDate() - (currentDayOfWeek - 1));
      }
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Calculate end (today at end of day)
      const endOfWeek = new Date(today);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('📅 Semana actual:', {
        inicio: startOfWeek.toISOString().split('T')[0],
        fin: endOfWeek.toISOString().split('T')[0],
        diaActual: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][currentDayOfWeek],
        currentDayOfWeek
      });

      // Fetch transactions for current week only
      const { data: weekTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startOfWeek.toISOString().split('T')[0])
        .lte('transaction_date', endOfWeek.toISOString().split('T')[0]);

      console.log('📊 Transacciones de la semana:', weekTransactions?.length || 0);

      // Initialize all days of the week that have passed (including today)
      const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const dayMap = new Map<string, { income: number; expense: number; count: number }>();
      
      // Determine how many days to show based on current day
      let daysToShowCount = currentDayOfWeek === 0 ? 7 : currentDayOfWeek; // If Sunday, show all 7 days
      
      for (let i = 0; i < daysToShowCount; i++) {
        const dayName = dayNames[i];
        dayMap.set(dayName, { income: 0, expense: 0, count: 0 });
      }

      console.log('📅 Días a mostrar:', Array.from(dayMap.keys()));

      // Process transactions
      if (weekTransactions) {
        weekTransactions.forEach(t => {
          const date = new Date(t.transaction_date + 'T00:00:00');
          const dayIndex = date.getDay();
          // Convert Sunday (0) to 6, Monday (1) to 0, etc.
          const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          const dayName = dayNames[adjustedIndex];
          
          console.log(`📝 Transacción ${t.transaction_date}: ${dayName}, tipo: ${t.type}, monto: ${t.amount}`);
          
          if (dayMap.has(dayName)) {
            const data = dayMap.get(dayName)!;
            
            if (t.type === 'ingreso') {
              data.income += Number(t.amount);
            } else {
              data.expense += Number(t.amount);
            }
            data.count++;
          }
        });
      }

      // Convert to array format for chart
      const weeklyDataArray: DayData[] = Array.from(dayMap.entries()).map(([dayName, data]) => ({
        day: dayName.substring(0, 3),
        dayFull: dayName,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense
      }));

      console.log('📈 Datos procesados:', weeklyDataArray);

      setWeeklyData(weeklyDataArray);

      // Generate insight using AI
      const { data: aiData } = await supabase.functions.invoke('financial-analysis', {
        body: {
          analysisType: 'weekly-pattern',
          data: weeklyDataArray,
          transactions: weekTransactions || [],
          currentWeek: {
            start: startOfWeek.toISOString().split('T')[0],
            end: endOfWeek.toISOString().split('T')[0],
            currentDay: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][currentDayOfWeek]
          }
        }
      });

      if (aiData?.insight) {
        setWeeklyInsight(aiData.insight);
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    }
  };

  const fetchBalanceData = async () => {
    // Evitar llamadas concurrentes
    if (isProcessing) {
      console.log('⏳ Ya hay un proceso en curso, ignorando llamada');
      return;
    }
    
    setIsProcessing(true);
    // Solo mostrar loading si NO hay datos iniciales
    if (!hasInitialData) {
      setLoading(true);
    }
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

      // Fetch ALL categories to build parent-child relationships
      const { data: allCategories } = await supabase
        .from('categories')
        .select('id, name, color, type, parent_id')
        .eq('user_id', user.id);

      // Create a map for quick category lookup
      const categoryMap = new Map(allCategories?.map(cat => [cat.id, cat]) || []);

      // Fetch ALL transactions with proper pagination (Supabase max is 1000 per query)
      let allTransactions: any[] = [];
      let hasMore = true;
      let lastId: string | null = null;
      let pageCount = 0;
      const PAGE_SIZE = 1000; // Supabase default max
      
      while (hasMore) {
        let query = supabase
          .from('transactions')
          .select('*, categories(id, name, color, type, parent_id)')
          .eq('user_id', user.id)
          .gte('transaction_date', startDate.toISOString().split('T')[0])
          .lte('transaction_date', endDate.toISOString().split('T')[0])
          .order('id', { ascending: true })
          .limit(PAGE_SIZE);
        
        // Use cursor-based pagination
        if (lastId) {
          query = query.gt('id', lastId);
        }
        
        const { data: pageData, error: txError } = await query;
        
        if (txError) {
          console.error('Error fetching transactions:', txError);
          break;
        }
        
        if (!pageData || pageData.length === 0) {
          hasMore = false;
          break;
        }
        
        allTransactions = [...allTransactions, ...pageData];
        lastId = pageData[pageData.length - 1].id;
        hasMore = pageData.length === PAGE_SIZE; // Continue if we got full page
        pageCount++;
        console.log(`📄 Page ${pageCount}: ${pageData.length} transactions (total: ${allTransactions.length})`);
      }
      
      const transactions = allTransactions;
      console.log('📊 Total transactions loaded:', transactions.length);
      if (!transactions) return;
      console.log('=== BALANCE PAGE CALCULATIONS ===');
      console.log('View mode:', viewMode);
      console.log('Date range:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      console.log('Total transactions fetched:', transactions.length);

      // Process ingresos - usar AI para categorizar correctamente
      const ingresosData = transactions.filter(t => t.type === 'ingreso');
      const totalIng = ingresosData.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalIngresos(totalIng);
      localStorage.setItem('balance_totalIngresos', totalIng.toString());
      
      console.log('Ingresos count:', ingresosData.length);
      console.log('Total Ingresos:', totalIng);
      
      // Categorizar ingresos con AI para identificar todas las categorías (freelance, inversiones, etc.)
      let ingresosWithPercentage: CategoryBalance[] = [];
      
      if (ingresosData.length > 0) {
        try {
          const { data: categorizedData, error: categorizeError } = await supabase.functions.invoke('categorize-income-statement', {
            body: {
              transactions: ingresosData.map(t => ({
                description: t.description,
                amount: Number(t.amount),
                type: 'ingreso'
              }))
            }
          });

          if (categorizeError) throw categorizeError;

          console.log('📊 Datos categorizados de ingresos:', categorizedData);

          // Verificar que tenemos datos válidos
          if (categorizedData && categorizedData.ingresos && Array.isArray(categorizedData.ingresos)) {
            ingresosWithPercentage = categorizedData.ingresos.map((cat: any, index: number) => ({
              id: cat.categoria,
              name: cat.categoria,
              color: getIncomeCategoryColor(index),
              total: cat.monto,
              percentage: totalIng > 0 ? (cat.monto / totalIng) * 100 : 0
            })).sort((a, b) => b.total - a.total);
          } else {
            throw new Error('Estructura de datos inválida');
          }

        } catch (error) {
          console.error('Error categorizando ingresos:', error);
          // Fallback: usar categorías de la BD
          const categorizedIncome = ingresosData.map(t => ({
            ...t,
            category: t.categories?.name || '💼 Salario / Sueldo'
          }));
          
          const ingresosCategoryMap = new Map<string, {
            name: string;
            color: string;
            total: number;
          }>();
          
          categorizedIncome.forEach((t, index) => {
            const categoryName = t.category;
            const existing = ingresosCategoryMap.get(categoryName) || {
              name: categoryName,
              color: getIncomeCategoryColor(index),
              total: 0
            };
            existing.total += Number(t.amount);
            ingresosCategoryMap.set(categoryName, existing);
          });
          
          ingresosWithPercentage = Array.from(ingresosCategoryMap.entries()).map(([name, data], index) => ({
            id: name,
            name: data.name,
            color: getIncomeCategoryColor(index),
            total: data.total,
            percentage: totalIng > 0 ? data.total / totalIng * 100 : 0
          })).sort((a, b) => b.total - a.total);
        }
      }
      
      setIngresosByCategory(ingresosWithPercentage);
      localStorage.setItem('balance_ingresos', JSON.stringify(ingresosWithPercentage));

      // Process gastos with database category hierarchy
      const gastosData = transactions.filter(t => t.type === 'gasto');
      const totalGast = gastosData.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalGastos(totalGast);
      localStorage.setItem('balance_totalGastos', totalGast.toString());
      
      console.log('Gastos count:', gastosData.length);
      console.log('Total Gastos:', totalGast);
      console.log('Balance:', totalIng - totalGast);
      console.log('Tasa Ahorro:', totalIng > 0 ? (totalIng - totalGast) / totalIng * 100 : 0);
      console.log('==================================');
      
      // Group by parent category if exists, otherwise by category itself
      const gastosGroupMap = new Map<string, {
        name: string;
        color: string;
        total: number;
      }>();
      
      gastosData.forEach(t => {
        if (t.categories) {
          const category = t.categories;
          let groupId: string;
          let groupName: string;
          let groupColor: string;
          
          // If category has a parent, use parent for grouping
          if (category.parent_id && categoryMap.has(category.parent_id)) {
            const parentCategory = categoryMap.get(category.parent_id)!;
            groupId = parentCategory.id;
            groupName = parentCategory.name;
            groupColor = parentCategory.color;
          } else {
            // Otherwise, use the category itself
            groupId = category.id;
            groupName = category.name;
            groupColor = category.color;
          }
          
          const existing = gastosGroupMap.get(groupId) || {
            name: groupName,
            color: groupColor,
            total: 0
          };
          existing.total += Number(t.amount);
          gastosGroupMap.set(groupId, existing);
        }
      });
      
      const gastosWithPercentage: CategoryBalance[] = Array.from(gastosGroupMap.entries()).map(([id, data], index) => ({
        id,
        name: data.name,
        color: getExpenseCategoryColor(index), // Usar colores vibrantes para la gráfica
        total: data.total,
        percentage: totalGast > 0 ? data.total / totalGast * 100 : 0
      })).sort((a, b) => b.total - a.total);
      setGastosByCategory(gastosWithPercentage);
      localStorage.setItem('balance_gastos', JSON.stringify(gastosWithPercentage));
      setHasInitialData(true);
    } catch (error) {
      console.error('Error fetching balance data:', error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
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
  // Solo mostrar pantalla de carga si no hay datos iniciales
  if (loading && !hasInitialData) {
    return <LoadingScreen />;
  }
  return <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Análisis de Balance</h1>
              <p className="text-xs text-gray-500">Ingresos y Gastos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Mensual/Anual */}
      <div className="px-4 mb-4">
        <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'mensual' | 'anual')} className="w-full">
          <TabsList className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-0 rounded-2xl">
            <TabsTrigger value="mensual" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900 transition-all rounded-xl">
              Mensual
            </TabsTrigger>
            <TabsTrigger value="anual" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900 transition-all rounded-xl">
              Anual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Período selector */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePreviousPeriod} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white transition-all h-10 w-10">
            <ChevronLeft className="h-5 w-5 text-gray-900" />
          </Button>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm px-4 py-2">
            <p className="text-gray-900 font-semibold tracking-tight capitalize text-center">
              {getPeriodLabel()}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={handleNextPeriod} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white transition-all h-10 w-10">
            <ChevronRight className="h-5 w-5 text-gray-900" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Ahorro destacado */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${ahorro >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <Wallet className={`h-6 w-6 ${ahorro >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1 font-medium">
                Ahorro {viewMode === 'mensual' ? 'Mensual' : 'Anual'}
              </p>
              <p className={`text-3xl sm:text-4xl font-semibold tracking-tight leading-tight break-words ${ahorro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${ahorro.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tasa de ahorro:</span>
              <span className="text-lg font-semibold tracking-tight text-gray-900">{tasaAhorro.toFixed(1)}%</span>
            </div>
            <Progress 
              value={tasaAhorro} 
              className="h-2.5 bg-transparent" 
              indicatorClassName={ahorro >= 0 ? "bg-emerald-600" : "bg-red-600"}
            />
          </div>
          
          {/* Botón de descarga de PDF */}
          <div>
            <Button variant="ghost" className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-900 transition-all h-auto py-3 px-4 text-xs font-semibold tracking-tight flex items-center justify-center" onClick={async () => {
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
              <Download className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Descargar movimientos del {viewMode === 'mensual' ? 'mes' : 'año'} en PDF</span>
            </Button>
          </div>
        </Card>

        {/* Ingresos y Gastos en línea horizontal */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center hover:scale-105 transition-all animate-fade-in cursor-pointer active:scale-95" style={{
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

          <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center hover:scale-105 transition-all animate-fade-in cursor-pointer active:scale-95" style={{
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

        {/* Widget de análisis semanal */}
        {weeklyData.length > 0 && (
          <WeeklyIncomeExpenseWidget data={weeklyData} insight={weeklyInsight} />
        )}

        {/* Category Breakdown Widget para Ingresos */}
        {ingresosByCategory.length > 0 && (
          <CategoryBreakdownWidget 
            title="💰 Ingresos por Categoría"
            categories={ingresosByCategory.map(cat => ({
              name: cat.name,
              value: cat.total,
              color: cat.color
            }))}
            period={viewMode === 'mensual' ? 'month' : 'year'}
            onPeriodChange={(value) => {
              setViewMode(value === 'month' ? 'mensual' : 'anual');
            }}
          />
        )}

        {/* Category Breakdown Widget para Gastos */}
        {gastosByCategory.length > 0 && (
          <CategoryBreakdownWidget 
            title="📊 Gastos por Categoría"
            categories={gastosByCategory.map(cat => ({
              name: cat.name,
              value: cat.total,
              color: cat.color
            }))}
            period={viewMode === 'mensual' ? 'month' : 'year'}
            onPeriodChange={(value) => {
              setViewMode(value === 'month' ? 'mensual' : 'anual');
            }}
          />
        )}
      </div>
      
      <BottomNav />
    </div>;
};
export default Balance;