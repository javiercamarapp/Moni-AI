import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { headingPage } from '@/styles/typography';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { SectionLoader } from '@/components/SectionLoader';
import BalanceCard from '@/components/balance/BalanceCard';
import StatCard from '@/components/balance/StatCard';
import BalanceCategoryBreakdown from '@/components/balance/BalanceCategoryBreakdown';
import BreakdownCarousel from '@/components/balance/BreakdownCarousel';
import BalanceInsights from '@/components/balance/BalanceInsights';
import BalanceEvolutionChart from '@/components/balance/BalanceEvolutionChart';
import ExpenseBreakdownWidget from '@/components/dashboard/ExpenseBreakdownWidget';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';

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
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
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

  // Estados para el widget de Ingresos vs Gastos (independientes del viewMode)
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [yearlyIncome, setYearlyIncome] = useState(0);
  const [yearlyExpenses, setYearlyExpenses] = useState(0);
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
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<any[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<Array<{ name: string, amount: number, icon: string }>>([]);

  // Extract year and month for PDF generation
  const selectedYear = currentMonth.getFullYear();
  const selectedMonth = currentMonth.getMonth() + 1;

  // Calculate balance from state
  const balance = totalIngresos - totalGastos;
  const ahorro = balance;
  const tasaAhorro = totalIngresos > 0 ? ahorro / totalIngresos * 100 : 0;
  useEffect(() => {
    fetchBalanceData();
    fetchEvolutionData();
    fetchSubscriptionsAndDailyExpenses();
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

  const fetchEvolutionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: Date;
      let endDate: Date;
      let dataPoints: { key: string; label: string; fullLabel: string }[] = [];

      if (viewMode === 'mensual') {
        // Monthly view: show each day of the selected month
        startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Generate all days of the month
        const daysInMonth = endDate.getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const dateStr = date.toISOString().split('T')[0];
          dataPoints.push({
            key: dateStr,
            label: day.toString(),
            fullLabel: date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
          });
        }
      } else {
        // Annual view: show each month of the selected year
        startDate = new Date(currentMonth.getFullYear(), 0, 1);
        endDate = new Date(currentMonth.getFullYear(), 11, 31);
        
        // Generate all months
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        for (let month = 0; month < 12; month++) {
          dataPoints.push({
            key: `${currentMonth.getFullYear()}-${String(month + 1).padStart(2, '0')}`,
            label: monthNames[month],
            fullLabel: `${monthNames[month]} ${currentMonth.getFullYear()}`
          });
        }
      }

      console.log('📅 Período seleccionado:', {
        modo: viewMode,
        inicio: startDate.toISOString().split('T')[0],
        fin: endDate.toISOString().split('T')[0],
        puntos: dataPoints.length
      });

      // Fetch transactions for the period
      const { data: periodTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      console.log('📊 Transacciones del período:', periodTransactions?.length || 0);

      // Create a map for all data points
      const dataMap = new Map<string, { income: number; expense: number }>();
      
      // Initialize all data points
      dataPoints.forEach(point => {
        dataMap.set(point.key, { income: 0, expense: 0 });
      });

      // Process transactions
      if (periodTransactions) {
        periodTransactions.forEach(t => {
          let key: string;
          
          if (viewMode === 'mensual') {
            // For monthly view, use the exact date
            key = t.transaction_date;
          } else {
            // For annual view, use year-month
            const date = new Date(t.transaction_date);
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }

          if (dataMap.has(key)) {
            const data = dataMap.get(key)!;
            if (t.type === 'ingreso') {
              data.income += Number(t.amount);
            } else {
              data.expense += Number(t.amount);
            }
          }
        });
      }

      // Convert to array format for chart
      const evolutionDataArray: DayData[] = dataPoints.map(point => {
        const data = dataMap.get(point.key) || { income: 0, expense: 0 };
        return {
          day: point.label,
          dayFull: point.fullLabel,
          income: data.income,
          expense: data.expense,
          net: data.income - data.expense
        };
      });

      console.log('📈 Datos procesados:', evolutionDataArray.length, 'puntos');

      setWeeklyData(evolutionDataArray);

      // Generate insight using AI
      const { data: aiData } = await supabase.functions.invoke('financial-analysis', {
        body: {
          analysisType: viewMode === 'mensual' ? 'monthly-pattern' : 'yearly-pattern',
          data: evolutionDataArray,
          transactions: periodTransactions || [],
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          }
        }
      });

      if (aiData?.insight) {
        setWeeklyInsight(aiData.insight);
      }
    } catch (error) {
      console.error('Error fetching evolution data:', error);
    }
  };

  const fetchSubscriptionsAndDailyExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscriptions
      const { data: subscriptionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .in('frequency', ['mensual', 'monthly', 'anual', 'annual'])
        .order('amount', { ascending: false });

      setUpcomingSubscriptions(subscriptionsData || []);

      // Calculate daily expenses for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: dailyExpensesData } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .lte('transaction_date', endOfMonth.toISOString().split('T')[0])
        .order('amount', { ascending: false });

      if (dailyExpensesData && dailyExpensesData.length > 0) {
        const categoryMap = new Map<string, { name: string, total: number, icon: string }>();

        dailyExpensesData.forEach((transaction) => {
          const categoryName = transaction.categories?.name || transaction.description || 'Otros';
          const icon = '💸';

          if (categoryMap.has(categoryName)) {
            const existing = categoryMap.get(categoryName)!;
            existing.total += Number(transaction.amount);
          } else {
            categoryMap.set(categoryName, {
              name: categoryName,
              total: Number(transaction.amount),
              icon
            });
          }
        });

        const expensesArray = Array.from(categoryMap.values())
          .map(cat => ({
            name: cat.name,
            amount: cat.total,
            icon: cat.icon
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        setDailyExpenses(expensesArray);
      }
    } catch (error) {
      console.error('Error fetching subscriptions and daily expenses:', error);
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

      // Calcular totales mensuales y anuales para el widget independiente
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthNum = now.getMonth();

      // Calcular totales del mes actual
      const monthStart = new Date(currentYear, currentMonthNum, 1);
      const monthEnd = new Date(currentYear, currentMonthNum + 1, 0);
      const monthTransactions = allTransactions.filter(t => {
        const txDate = new Date(t.transaction_date);
        return txDate >= monthStart && txDate <= monthEnd;
      });
      const monthInc = monthTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
      const monthExp = monthTransactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + Number(t.amount), 0);
      setMonthlyIncome(monthInc);
      setMonthlyExpenses(monthExp);

      // Calcular totales del año actual
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);
      const yearTransactions = allTransactions.filter(t => {
        const txDate = new Date(t.transaction_date);
        return txDate >= yearStart && txDate <= yearEnd;
      });
      const yearInc = yearTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + Number(t.amount), 0);
      const yearExp = yearTransactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + Number(t.amount), 0);
      setYearlyIncome(yearInc);
      setYearlyExpenses(yearExp);
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

  // STRICT CHECK: Never show loading screen if we have cached data
  // We check localStorage directly to avoid any state synchronization issues
  const hasCachedData = localStorage.getItem('balance_ingresos') && localStorage.getItem('balance_gastos');

  // Only show loading if we are loading AND have no data at all
  if (loading && !hasInitialData && !hasCachedData) {
    return (
      <div className="page-standard min-h-screen pb-20 flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
    );
  }

  // Determine status label based on savings rate
  const getStatusLabel = () => {
    if (tasaAhorro >= 60) return 'EXCELENTE';
    if (tasaAhorro >= 40) return 'BUENO';
    if (tasaAhorro >= 20) return 'MEDIO';
    if (tasaAhorro >= 0) return 'BAJO';
    return 'NEGATIVO';
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para descargar el reporte",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Generando reporte",
        description: "Preparando tu reporte de movimientos..."
      });

      const { data, error } = await supabase.functions.invoke('generate-statement-pdf', {
        body: {
          viewMode,
          year: selectedYear,
          month: selectedMonth,
          userId: user.id
        }
      });

      if (error) throw error;

      if (!data || !data.html || !data.filename) {
        throw new Error('Datos incompletos en la respuesta');
      }

      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename.replace('.pdf', '.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Reporte descargado",
        description: "Abre el archivo HTML descargado y usa Ctrl+P (Cmd+P en Mac) para guardarlo como PDF."
      });
    } catch (error: any) {
      console.error('Error al generar reporte:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el reporte",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="page-standard min-h-screen pb-20">

      <main className="page-container pt-6 space-y-4">

        {/* Header Row */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 text-[#5D4037]/70"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Resumen de balance</h1>

              {/* Date Selector */}
              <div className="flex items-center gap-2 text-gray-500">
                <button
                  onClick={handlePreviousPeriod}
                  className="hover:text-[#5D4037] transition-colors p-1 active:scale-95"
                  aria-label="Período anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold min-w-[100px] text-center select-none capitalize">
                  {getPeriodLabel()}
                </span>
                <button
                  onClick={handleNextPeriod}
                  className="hover:text-[#5D4037] transition-colors p-1 active:scale-95"
                  aria-label="Período siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="bg-white p-1 rounded-xl flex shadow-sm border border-gray-100/50">
            <button
              onClick={() => setViewMode('mensual')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 ${viewMode === 'mensual'
                ? 'bg-[#8D6E63] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('anual')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 ${viewMode === 'anual'
                ? 'bg-[#8D6E63] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              Año
            </button>
          </div>
        </header>

        {/* 1. Balance Hero */}
        <BalanceCard
          amount={ahorro}
          rate={Math.max(0, Math.min(100, tasaAhorro))}
          label={viewMode === 'mensual' ? 'Ahorro Mensual' : 'Ahorro Anual'}
          statusLabel={getStatusLabel()}
          onDownloadPDF={handleDownloadPDF}
        />

        {/* 2. Stats Grid (Income/Expenses) */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            type="income" 
            amount={totalIngresos} 
            onClick={() => navigate('/ingresos', { state: { from: 'balance' } })} 
          />
          <StatCard 
            type="expense" 
            amount={totalGastos} 
            onClick={() => navigate('/gastos', { state: { from: 'balance' } })} 
          />
        </div>

        {/* Add Transaction Modals */}
        <AddTransactionModal
          isOpen={isAddIncomeOpen}
          onClose={() => setIsAddIncomeOpen(false)}
          mode="income"
          onSuccess={fetchBalanceData}
        />
        <AddTransactionModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          mode="expense"
          onSuccess={fetchBalanceData}
        />

        {/* 3. Insights Carousel */}
        {proyecciones && proyecciones.insights && proyecciones.insights.length > 0 && (
          <BalanceInsights insights={proyecciones.insights.map((insight, idx) => ({
            id: `insight-${idx}`,
            title: insight.titulo,
            description: insight.descripcion,
            type: insight.tipo
          }))} />
        )}

        {/* 4. Evolution Chart (Trend) */}
        {weeklyData.length > 0 && (
          <BalanceEvolutionChart data={weeklyData} />
        )}

        {/* 4.5 Expense Breakdown - Subscriptions & Daily Expenses */}
        <ExpenseBreakdownWidget
          subscriptionsTotal={upcomingSubscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0)}
          subscriptionsCount={upcomingSubscriptions.length}
          dailyExpenses={dailyExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)}
        />

        {/* 5. Breakdown Charts Carousel */}
        {(ingresosByCategory.length > 0 || gastosByCategory.length > 0) && (
          <BreakdownCarousel 
            ingresosByCategory={ingresosByCategory}
            gastosByCategory={gastosByCategory}
          />
        )}

      </main>

      <BottomNav />
    </div>
  );
};
export default Balance;