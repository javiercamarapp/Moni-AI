import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Home, Target, MessageSquare, User, Droplets, AlertCircle, Zap, Activity, BarChart3, Shield, Trophy, Heart } from "lucide-react";
import moniAiLogo from "@/assets/moni-ai-horizontal.png";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import BottomNav from '@/components/BottomNav';
import SafeToSpendWidget from "@/components/analysis/SafeToSpendWidget";
import NetWorthWidget from "@/components/analysis/NetWorthWidget";
import ForecastWidget from "@/components/analysis/ForecastWidget";
import BudgetProgressWidget from "@/components/analysis/BudgetProgressWidget";
import DebtPaymentPlanWidget from "@/components/analysis/DebtPaymentPlanWidget";
import SubscriptionsWidget from "@/components/analysis/SubscriptionsWidget";
import UpcomingTransactionsWidget from "@/components/analysis/UpcomingTransactionsWidget";
import RiskIndicatorsWidget from "@/components/analysis/RiskIndicatorsWidget";
import EvolutionChartWidget from "@/components/analysis/EvolutionChartWidget";
import HistoricalComparisonWidget from "@/components/analysis/HistoricalComparisonWidget";
import FutureCalendarWidget from "@/components/analysis/FutureCalendarWidget";
import RecentMovementsWidget from "@/components/analysis/RecentMovementsWidget";
import AICoachInsightsWidget from "@/components/analysis/AICoachInsightsWidget";
import IncomeExpensePieWidget from "@/components/analysis/IncomeExpensePieWidget";
import CategoryBreakdownWidget from "@/components/analysis/CategoryBreakdownWidget";
import FinancialHealthPieWidget from "@/components/analysis/FinancialHealthPieWidget";
import LiquidityGaugeWidget from "@/components/analysis/LiquidityGaugeWidget";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AIAnalysisLoader } from "@/components/AIAnalysisLoader";

export default function FinancialAnalysis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Start with true to show loader initially
  const [period, setPeriod] = useState("month");
  const [user, setUser] = useState<any>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // Usar el mismo hook que el Dashboard para datos del mes actual
  const dashboardData = useDashboardData(0);
  
  // Cargar datos del caché inmediatamente para mostrar instantáneamente (con clave específica por período)
  const [quickMetrics, setQuickMetrics] = useState<any>(() => {
    const cacheKey = `financialAnalysis_quickMetrics_${period}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      savingsRate: 0,
      transactionsCount: 0
    };
  });
  const [historicalAverages, setHistoricalAverages] = useState<any>(() => {
    const cached = localStorage.getItem('financialAnalysis_historicalAverages');
    return cached ? JSON.parse(cached) : null;
  });
  const [analysis, setAnalysis] = useState<any>(() => {
    // Cargar desde caché inmediatamente para mostrar instantáneamente
    const cacheKey = `financialAnalysis_full_month_cache`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached analysis:', e);
      }
    }
    return {
      metrics: {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0
      }
    };
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_recentTransactions');
    return cached ? JSON.parse(cached) : [];
  });
  const [futureEvents, setFutureEvents] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_futureEvents');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [showSplash, setShowSplash] = useState(false);

  // Helper function to safely format values in thousands
  const formatK = (value: number | undefined | null): string => {
    if (value == null || isNaN(value)) return '0.0';
    return (value / 1000).toFixed(1);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('🔄 PERÍODO CAMBIADO A:', period);
      
      // Limpiar el estado del análisis para forzar recarga
      setAnalysis({
        metrics: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0
        }
      });
      
      // Limpiar TODOS los cachés para forzar recarga completa
      const cacheKeys = [
        `financialAnalysis_quickMetrics_${period}`,
        `financialAnalysis_full_${period}_${user.id}`,
        `financialAnalysis_full_${period}_${user.id}_time`
      ];
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      // Resetear métricas
      setQuickMetrics({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        savingsRate: 0,
        transactionsCount: 0
      });
      
      // Ejecutar cargas en background (forzar recarga sin caché)
      console.log('🚀 Iniciando carga de datos para período:', period);
      calculateQuickMetrics();
      fetchTransactionsData();
      loadAnalysis();
    }
  }, [user, period]);

  const calculateQuickMetrics = async () => {
    if (!user) return;
    
    console.log('📊 Calculating metrics for period:', period);
    
    try {
      // Calcular fechas según el período
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último día del mes
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31); // 31 de diciembre
      }
      
      console.log('📅 Date range:', { 
        period, 
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      // Obtener transacciones del período actual - SIN LÍMITES para obtener TODAS
      let allTransactions: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('transaction_date', startDate.toISOString().split('T')[0])
          .lte('transaction_date', endDate.toISOString().split('T')[0])
          .order('transaction_date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (txError) {
          console.error('Error fetching transactions:', txError);
          throw txError;
        }
        
        if (transactions && transactions.length > 0) {
          allTransactions = [...allTransactions, ...transactions];
          hasMore = transactions.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      const transactions = allTransactions;
      
      
      console.log('📅 ANÁLISIS FINANCIERO - Transacciones obtenidas:', {
        periodo: period,
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0],
        transaccionesTotales: transactions?.length || 0,
        muestraTransacciones: transactions?.slice(0, 3).map(t => ({
          fecha: t.transaction_date,
          tipo: t.type,
          monto: t.amount,
          descripcion: t.description
        }))
      });
      
      // Calcular promedios históricos: SIEMPRE últimos 12 meses + mes actual (13 meses total)
      const historicalStartDate = new Date(now);
      historicalStartDate.setMonth(historicalStartDate.getMonth() - 12); // 12 meses atrás
      
      const { data: historicalTxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', historicalStartDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });
      
      // Agrupar transacciones históricas por mes (incluye mes actual)
      const monthlyData: Record<string, { income: number; expenses: number }> = {};
      
      historicalTxs?.forEach(tx => {
        const monthKey = tx.transaction_date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        
        if (tx.type === 'income' || tx.type === 'ingreso') {
          monthlyData[monthKey].income += Number(tx.amount);
        } else if (tx.type === 'expense' || tx.type === 'gasto') {
          monthlyData[monthKey].expenses += Number(tx.amount);
        }
      });
      
      const monthsWithData = Object.keys(monthlyData).length;
      const avgMonthlyIncome = monthsWithData > 0 
        ? Object.values(monthlyData).reduce((sum, m) => sum + m.income, 0) / monthsWithData 
        : 0;
      const avgMonthlyExpenses = monthsWithData > 0 
        ? Object.values(monthlyData).reduce((sum, m) => sum + m.expenses, 0) / monthsWithData 
        : 0;
      
      console.log('📊 Historical analysis:', {
        monthsAnalyzed: monthsWithData,
        avgMonthlyIncome: Math.round(avgMonthlyIncome),
        avgMonthlyExpenses: Math.round(avgMonthlyExpenses)
      });
      
      const historicalData = {
        avgMonthlyIncome: Math.round(avgMonthlyIncome),
        avgMonthlyExpenses: Math.round(avgMonthlyExpenses),
        avgBalance: Math.round(avgMonthlyIncome - avgMonthlyExpenses),
        monthsAnalyzed: monthsWithData,
        period: 'year' // Siempre proyección anual basada en 12+1 meses
      };
      
      setHistoricalAverages(historicalData);
      localStorage.setItem('financialAnalysis_historicalAverages', JSON.stringify(historicalData));
      
      console.log('💰 Transactions found:', transactions?.length || 0);
      
      if (!transactions || transactions.length === 0) {
        const emptyMetrics = {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          savingsRate: 0,
          scoreMoni: 40
        };
        setQuickMetrics(emptyMetrics);
        const cacheKey = `financialAnalysis_quickMetrics_${period}`;
        localStorage.setItem(cacheKey, JSON.stringify(emptyMetrics));
        return;
      }
      
      const totalIncome = transactions
        .filter(t => t.type === 'income' || t.type === 'ingreso')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense' || t.type === 'gasto')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      console.log('💵 Cálculo de métricas COMPLETO:', {
        periodo: period,
        transaccionesAnalizadas: transactions.length,
        transaccionesIngreso: transactions.filter(t => t.type === 'income' || t.type === 'ingreso').length,
        transaccionesGasto: transactions.filter(t => t.type === 'expense' || t.type === 'gasto').length,
        ingresos: totalIncome,
        gastos: totalExpenses,
        balance: totalIncome - totalExpenses,
        detalleIngresos: transactions
          .filter(t => t.type === 'income' || t.type === 'ingreso')
          .slice(0, 5)
          .map(t => ({ fecha: t.transaction_date, monto: t.amount, descripcion: t.description })),
        detalleGastos: transactions
          .filter(t => t.type === 'expense' || t.type === 'gasto')
          .slice(0, 5)
          .map(t => ({ fecha: t.transaction_date, monto: t.amount, descripcion: t.description }))
      });
      
      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
      
      // Calculate additional metrics
      const fixedExpenses = transactions
        .filter(t => (t.type === 'expense' || t.type === 'gasto') && t.frequency && t.frequency !== 'once')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const variableExpenses = totalExpenses - fixedExpenses;
      const liquidityMonths = totalExpenses > 0 ? (balance / totalExpenses) : 0;
      
      // Score rápido
      let score = 40;
      if (balance > 0) score += 20;
      if (savingsRate > 20) score += 20;
      if (totalIncome > 0) score += 20;
      
      const metricsData = {
        totalIncome,
        totalExpenses,
        balance,
        savingsRate: Math.round(savingsRate * 100) / 100,
        liquidityMonths: Math.round(liquidityMonths * 100) / 100,
        cashFlowAccumulated: balance,
        fixedExpenses,
        variableExpenses,
        fixedExpensesPercentage: totalExpenses > 0 ? (fixedExpenses / totalExpenses * 100) : 0,
        variableExpensesPercentage: totalExpenses > 0 ? (variableExpenses / totalExpenses * 100) : 0,
        antExpenses: transactions.filter(t => (t.type === 'expense' || t.type === 'gasto') && Number(t.amount) < 50).reduce((sum, t) => sum + Number(t.amount), 0),
        antExpensesPercentage: totalIncome > 0 ? (transactions.filter(t => (t.type === 'expense' || t.type === 'gasto') && Number(t.amount) < 50).reduce((sum, t) => sum + Number(t.amount), 0) / totalIncome * 100) : 0,
        impulsivePurchases: transactions.filter(t => (t.type === 'expense' || t.type === 'gasto') && Number(t.amount) > 500 && (!t.frequency || t.frequency === 'once')).length,
        totalDebt: 0,
        debtRatio: 0,
        financialBurden: 0,
        debtToIncomeRatio: 0,
        interestOnIncome: 0,
        investmentRate: 0,
        personalROE: 0,
        equityGrowth: 0,
        personalROI: 0,
        avgGoalCompletion: 0,
        consistencyScore: 0,
        projectedAnnualSavings: balance * 12,
        mindfulSpendingIndex: 0,
        scoreMoni: Math.min(100, score),
        transactionsCount: transactions.length
      };
      
      console.log('💰 MÉTRICAS FINALES:', {
        ingresos: totalIncome,
        gastos: totalExpenses,
        balance: balance,
        transacciones: transactions.length
      });
      
      setQuickMetrics(metricsData);
      // Guardar con clave específica por período
      const cacheKey = `financialAnalysis_quickMetrics_${period}`;
      localStorage.setItem(cacheKey, JSON.stringify(metricsData));
    } catch (error) {
      console.error('Error calculating quick metrics:', error);
    }
  };

  const fetchTransactionsData = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      // Fetch recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentTx, error: recentError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name, color)
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // Format recent transactions
      const formattedRecent = recentTx?.map(t => ({
        date: new Date(t.transaction_date),
        type: t.type as "income" | "expense",
        description: t.description,
        amount: Number(t.amount),
        category: t.categories?.name,
        paymentMethod: t.payment_method,
        account: t.account
      })) || [];

      setRecentTransactions(formattedRecent);
      localStorage.setItem('financialAnalysis_recentTransactions', JSON.stringify(formattedRecent));

      // Fetch ALL transactions (last 6 months) to detect patterns
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: allTx, error: allError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      if (allError) throw allError;

      // AI analyzes patterns and predicts future payments
      const predicted = detectRecurringPayments(allTx || []);
      setFutureEvents(predicted);
      localStorage.setItem('financialAnalysis_futureEvents', JSON.stringify(predicted));
      
      setLoadingTransactions(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoadingTransactions(false);
    }
  };

  const detectRecurringPayments = (transactions: any[]) => {
    const today = startOfDay(new Date());
    const futurePayments: any[] = [];
    
    // Group transactions by similar descriptions (normalize text)
    const groupedByDescription: Record<string, any[]> = {};
    
    transactions.forEach(tx => {
      const normalizedDesc = tx.description
        .toLowerCase()
        .replace(/\d+/g, '') // Remove numbers
        .replace(/[^\w\s]/g, '') // Remove special chars
        .trim();
      
      if (!groupedByDescription[normalizedDesc]) {
        groupedByDescription[normalizedDesc] = [];
      }
      groupedByDescription[normalizedDesc].push(tx);
    });

    // Analyze each group for patterns
    Object.entries(groupedByDescription).forEach(([desc, txs]) => {
      if (txs.length < 2) return; // Need at least 2 occurrences

      // Sort by date
      const sortedTxs = txs.sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );

      // Calculate average interval between transactions (in days)
      const intervals: number[] = [];
      for (let i = 1; i < sortedTxs.length; i++) {
        const daysDiff = Math.round(
          (new Date(sortedTxs[i].transaction_date).getTime() - 
           new Date(sortedTxs[i-1].transaction_date).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        intervals.push(daysDiff);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const avgAmount = sortedTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) / sortedTxs.length;

      // Detect if it's a recurring pattern (weekly: ~7d, biweekly: ~15d, monthly: ~30d)
      let frequency: string | null = null;
      let predictInterval = 30; // default monthly

      if (avgInterval >= 6 && avgInterval <= 8) {
        frequency = 'Semanal';
        predictInterval = 7;
      } else if (avgInterval >= 13 && avgInterval <= 16) {
        frequency = 'Quincenal';
        predictInterval = 15;
      } else if (avgInterval >= 28 && avgInterval <= 32) {
        frequency = 'Mensual';
        predictInterval = 30;
      } else if (avgInterval >= 88 && avgInterval <= 95) {
        frequency = 'Trimestral';
        predictInterval = 90;
      } else if (avgInterval >= 360 && avgInterval <= 370) {
        frequency = 'Anual';
        predictInterval = 365;
      }

      // Only predict if we detected a clear pattern
      if (frequency) {
        const lastTx = sortedTxs[sortedTxs.length - 1];
        const lastDate = new Date(lastTx.transaction_date);
        let nextDate = addDays(lastDate, predictInterval);

        // Generate next 3 occurrences
        const nextThreeMonths = addMonths(today, 3);
        let count = 0;
        
        while (isBefore(nextDate, nextThreeMonths) && count < 3) {
          if (!isBefore(nextDate, today)) {
            futurePayments.push({
              date: new Date(nextDate),
              type: lastTx.type,
              description: `${lastTx.description} (${frequency})`,
              amount: Math.round(avgAmount),
              risk: calculatePaymentRisk(nextDate, avgAmount)
            });
            count++;
          }
          nextDate = addDays(nextDate, predictInterval);
        }
      }
    });

    return futurePayments.sort((a, b) => a.date.getTime() - b.date.getTime());
  };


  const calculatePaymentRisk = (date: Date, amount: number): "low" | "medium" | "high" => {
    const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 3 && amount > 1000) return "high";
    if (daysUntil <= 7 && amount > 500) return "medium";
    return "low";
  };
  const checkAuth = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };
  const loadAnalysis = async () => {
    if (!user?.id) {
      console.log('User not available yet, skipping analysis load');
      return;
    }
    
    // Verificar caché primero - usar datos de hasta 5 minutos
    const cacheKey = `financialAnalysis_full_${period}_${user.id}`;
    const cacheTimeKey = `${cacheKey}_time`;
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = Date.now();
    
    // Si hay caché válido, usarlo inmediatamente y ocultar loader
    if (cachedTime && (now - parseInt(cachedTime)) < 5 * 60 * 1000) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setAnalysis(data);
          setLoading(false); // Hide loader when cache is loaded
          console.log('✅ Using cached analysis data');
          return;
        } catch (e) {
          console.error('Cache parse error:', e);
        }
      }
    }
    
    // Mostrar loading mientras carga
    setLoading(true);
    try {
      console.log('🔄 Cargando análisis para:', { userId: user.id, period });
      const {
        data,
        error
      } = await supabase.functions.invoke('financial-analysis', {
        body: {
          userId: user.id,
          period
        }
      });
      
      if (error) {
        console.error('Financial analysis error:', error);
        throw error;
      }
      
      if (data) {
        console.log('📊 DATOS RECIBIDOS DE LA API:', {
          tieneAnalysis: !!data.analysis,
          tieneForecast: !!data.forecast,
          forecastData: data.forecast?.forecastData?.length || 0,
          forecastSample: data.forecast?.forecastData?.slice(0, 3)
        });
        setAnalysis(data);
        // Guardar con timestamp y caché general
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, now.toString());
        localStorage.setItem('financialAnalysis_full_month_cache', JSON.stringify(data));
        console.log('✅ Analysis data cached successfully');
      }
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      toast.error(`No se pudo cargar el análisis`);
    } finally {
      setLoading(false); // Hide loader when done
    }
  };

  return (
    <>
      {/* Show AI Analysis Loader while loading */}
      {loading && <AIAnalysisLoader />}
      
      {/* Main content - hide while loading */}
      {!loading && (
        <div className="min-h-screen animated-wave-bg pb-24">
          <div className="mx-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Análisis Financiero
            </h1>
            <p className="text-xs text-muted-foreground">
              {period === 'month' ? 'Mes actual' : 'Año completo'}
            </p>
          </div>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-10 bg-white rounded-[20px] shadow-xl border border-blue-100">
              <TabsTrigger 
                value="month" 
                className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-[16px] transition-all"
              >
                Mes
              </TabsTrigger>
              <TabsTrigger 
                value="year" 
                className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-[16px] transition-all"
              >
                Año
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mostrar métricas instantáneas (siempre disponibles del caché) */}
        {(quickMetrics || analysis) ? (
          <>
            {/* Animated Income & Expense Card */}
            <Card 
              className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 space-y-2 animate-fade-in cursor-pointer hover:scale-105 active:scale-95 transition-all" 
              style={{ animationDelay: '0ms' }}
              onClick={() => navigate('/balance')}
            >
              {(() => {
                // CRITICAL: Usar siempre la misma fuente que el Dashboard
                // - Mes: dashboardData (tiempo real del mes actual)
                // - Año: quickMetrics (calculado de TODA la BD, 1000 transacciones)
                const income = period === 'month' 
                  ? dashboardData.monthlyIncome 
                  : (quickMetrics?.totalIncome || 0);
                const expenses = period === 'month'
                  ? dashboardData.monthlyExpenses
                  : (quickMetrics?.totalExpenses || 0);
                const balance = income - expenses;
                const maxValue = Math.max(income, expenses);
                
                console.log('🎨 UI MOSTRANDO CARD (period:', period, '):', {
                  ingresos: income,
                  gastos: expenses,
                  balance: balance,
                  fuente: period === 'month' ? 'dashboardData (tiempo real)' : 'quickMetrics (TODA LA BD)',
                  dashboardIncome: dashboardData.monthlyIncome,
                  dashboardExpenses: dashboardData.monthlyExpenses,
                  quickMetricsIncome: quickMetrics?.totalIncome,
                  quickMetricsExpenses: quickMetrics?.totalExpenses
                });
                
                return (
                  <>
                    {/* Ingresos */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-success" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Ingresos</p>
                            <p className="text-xs text-muted-foreground">Período actual</p>
                          </div>
                        </div>
                        <p className="text-lg font-black text-success">
                          ${(income / 1000).toFixed(0)}k
                        </p>
                      </div>
                      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${maxValue > 0 ? (income / maxValue * 100) : 0}%`,
                            background: 'linear-gradient(90deg, #10b981, #22c55e, #10b981)',
                            backgroundSize: '200% 100%',
                            animation: 'slideIn 1.5s ease-out, gradient-shift 3s ease-in-out infinite'
                          }}
                        />
                      </div>
                    </div>

                    {/* Gastos */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Gastos</p>
                            <p className="text-xs text-muted-foreground">Período actual</p>
                          </div>
                        </div>
                        <p className="text-lg font-black text-destructive">
                          ${(expenses / 1000).toFixed(0)}k
                        </p>
                      </div>
                      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${maxValue > 0 ? (expenses / maxValue * 100) : 0}%`,
                            background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)',
                            backgroundSize: '200% 100%',
                            animation: 'slideIn 1.5s ease-out 0.3s both, gradient-shift 3s ease-in-out infinite'
                          }}
                        />
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">Balance</p>
                        <p className={`text-xl font-black ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {balance >= 0 ? '+' : ''}${(balance / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Card>

            {/* Risk Indicators */}
            <RiskIndicatorsWidget
              hasIssues={
                analysis?.riskIndicators && analysis?.riskIndicators.length > 0 &&
                analysis?.riskIndicators.some((i: any) => i.level === 'critical' || i.level === 'warning')
              }
              indicators={analysis?.riskIndicators || []}
            />

            {/* Proyección Anual removida - se moverá a página de proyecciones */}

            {/* 3. PROYECCIONES CON ESCENARIOS - Siempre mostrar con datos en caché */}
            {(() => {
              console.log('🔍 RENDERIZANDO FORECAST:', {
                hasForecast: !!analysis?.forecast,
                forecastData: analysis?.forecast?.forecastData?.length,
                forecastSample: analysis?.forecast?.forecastData?.slice(0, 2)
              });
              
              // Mostrar widget incluso si no hay datos (mostrará placeholder o datos en caché)
              const forecastProps = analysis?.forecast || {
                forecastData: [],
                goalProbability: 0,
                goalETA: 'Calculando...',
                goalInfo: null
              };
              
              return <ForecastWidget {...forecastProps} />;
            })()}

            {/* 5. PRESUPUESTO VIVO */}
            {analysis?.budgetProgress && analysis?.budgetProgress.categories && <BudgetProgressWidget {...analysis?.budgetProgress} />}

            {/* 6. DEUDA INTELIGENTE */}
            {analysis?.debtPlan && analysis?.debtPlan.debts && analysis?.debtPlan.debts.length > 0 && <DebtPaymentPlanWidget {...analysis?.debtPlan} />}

            {/* 7. SUSCRIPCIONES */}
            {analysis?.subscriptions && analysis?.subscriptions.subscriptions && analysis?.subscriptions.subscriptions.length > 0 && <SubscriptionsWidget {...analysis?.subscriptions} />}

            {/* Llamados a la Acción */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">🎯 Acciones Recomendadas</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all text-xs h-auto py-2"
                  onClick={() => navigate('/balance')}
                >
                  Ajustar presupuesto
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all text-xs h-auto py-2"
                  onClick={() => navigate('/networth')}
                >
                  Plan de deudas
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all text-xs h-auto py-2"
                  onClick={() => navigate('/new-goal')}
                >
                  ↑ Ahorro a 10%
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 hover:scale-105 active:scale-95 transition-all text-xs h-auto py-2"
                  onClick={() => navigate('/gastos')}
                >
                  Revisar subs
                </Button>
              </div>
            </div>

            {/* Liquidez - Grid Compacto Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Liquidez y Estabilidad
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Balance</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-success" />
                      {(analysis?.metrics?.balance ?? 0) >= 0 ? <span className="text-success text-xs">↑</span> : <span className="text-destructive text-xs">↓</span>}
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${(analysis?.metrics?.balance ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${formatK(analysis?.metrics?.balance)}k
                  </p>
                  <p className="text-[10px] text-muted-foreground">MoM: +2.3%</p>
                </Card>

                <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Ahorro</span>
                    <PiggyBank className="h-3 w-3 text-purple-400" />
                  </div>
                  <p className="text-lg font-bold text-purple-300">{analysis?.metrics?.savingsRate ?? 0}%</p>
                  <p className="text-[10px] text-white/60">
                    meta: {(analysis?.metrics?.liquidityMonths ?? 0) >= 3 ? '22%' : '20%'} 
                    {(analysis?.metrics?.savingsRate ?? 0) >= 20 && ' 🎯'}
                  </p>
                </Card>

                <Card className={`p-3 card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200 ${(analysis?.metrics?.liquidityMonths || 0) >= 3 ? 'bg-gradient-to-br from-emerald-600/90 to-emerald-800/90' : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 ? 'bg-gradient-to-br from-yellow-600/90 to-yellow-800/90' : 'bg-gradient-to-br from-red-600/90 to-red-800/90'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Liquidez</span>
                    <Droplets className={`h-3 w-3 ${(analysis?.metrics?.liquidityMonths || 0) >= 3 ? 'text-emerald-400' : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`} />
                  </div>
                  <p className={`text-lg font-bold ${(analysis?.metrics?.liquidityMonths || 0) >= 3 ? 'text-emerald-300' : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 ? 'text-yellow-300' : 'text-red-300'}`}>
                    {(analysis?.metrics?.liquidityMonths || 0).toFixed(1)} m
                  </p>
                  <p className="text-[10px] text-white/60">
                    {(analysis?.metrics?.liquidityMonths || 0) >= 3 ? '✅ Seguro' : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 ? '⚠️ Regular' : '🚨 Crítico'}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Cash Flow</span>
                    <TrendingUp className="h-3 w-3 text-teal-400" />
                  </div>
                  <p className="text-lg font-bold text-teal-300">
                    ${formatK(analysis?.metrics?.cashFlowAccumulated)}k
                  </p>
                  <Button variant="ghost" size="sm" className="text-[10px] text-white/60 hover:text-white p-0 h-auto hover-lift">
                    ver por semana →
                  </Button>
                </Card>
              </div>
            </div>

            {/* Control de Gastos - Compacto */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Control de Gastos
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Fijos</span>
                    <AlertCircle className="h-3 w-3 text-orange-400" />
                  </div>
                  <p className="text-lg font-bold text-orange-300">
                    ${formatK(analysis?.metrics?.fixedExpenses)}k
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">{(analysis?.metrics?.fixedExpensesPercentage || 0).toFixed(0)}% del gasto</span>
                    <span className="text-emerald-400">↓ -3%</span>
                  </div>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Variables</span>
                    <Zap className="h-3 w-3 text-violet-400" />
                  </div>
                  <p className="text-lg font-bold text-violet-300">
                    ${formatK(analysis?.metrics?.variableExpenses)}k
                  </p>
                  <p className="text-[10px] text-white/60">{(analysis?.metrics?.variableExpensesPercentage || 0).toFixed(0)}%</p>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Hormiga</span>
                    <span className="text-lg">🐜</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-300">
                    ${formatK(analysis?.metrics?.antExpenses)}k
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">{(analysis?.metrics?.antExpensesPercentage || 0).toFixed(1)}% ingreso</span>
                    <span className="text-yellow-400">↑ +5%</span>
                  </div>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Impulsivos</span>
                    <AlertCircle className="h-3 w-3 text-rose-400" />
                  </div>
                  <p className="text-lg font-bold text-rose-300">{analysis?.metrics?.impulsivePurchases ?? 0}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">compras</span>
                    <span className="text-rose-400">↑ +2</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Endeudamiento Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Endeudamiento
              </p>
              {(analysis?.metrics?.totalDebt ?? 0) > 0 ? <>
                  <div className="grid grid-cols-4 gap-2">
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">Razón</span>
                      <p className="text-sm font-bold text-red-300">{(analysis?.metrics?.debtRatio || 0).toFixed(1)}%</p>
                    </Card>
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">Carga</span>
                      <p className="text-sm font-bold text-orange-300">{(analysis?.metrics?.financialBurden || 0).toFixed(1)}%</p>
                    </Card>
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">D/I</span>
                      <p className="text-sm font-bold text-yellow-300">{(analysis?.metrics?.debtToIncomeRatio || 0).toFixed(2)}</p>
                    </Card>
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">Int.</span>
                      <p className="text-sm font-bold text-rose-300">{(analysis?.metrics?.interestOnIncome || 0).toFixed(1)}%</p>
                    </Card>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600/90 to-purple-800/90 card-glow rounded-lg p-2 border border-purple-500/30">
                    <p className="text-xs text-purple-200">
                      💡 Salís en 8 meses · Intereses este mes: $2,450
                    </p>
                  </div>
                </> : <Card className="p-3 bg-gradient-to-br from-emerald-600/90 to-emerald-800/90 card-glow border-emerald-500/30">
                  <p className="text-xs text-emerald-300 text-center">
                    🎉 Sin deudas activas - ¡Excelente!
                  </p>
                </Card>}
            </div>

            {/* Inversión y Rentabilidad Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Inversión & Rentabilidad
              </p>
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <span className="text-[10px] text-white/60">Inv.</span>
                  <p className="text-sm font-bold text-emerald-300">{(analysis?.metrics?.investmentRate || 0).toFixed(1)}%</p>
                  <span className="text-[9px] text-white/50">🟢 Bajo</span>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <span className="text-[10px] text-white/60">ROE</span>
                  <p className="text-sm font-bold text-teal-300">{(analysis?.metrics?.personalROE || 0).toFixed(1)}%</p>
                  <span className="text-[9px] text-white/50">12M</span>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <span className="text-[10px] text-white/60">Crec.</span>
                  <p className="text-sm font-bold text-green-300">{(analysis?.metrics?.equityGrowth || 0).toFixed(1)}%</p>
                  <span className="text-[9px] text-white/50">🟡 Med</span>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <span className="text-[10px] text-white/60">ROI</span>
                  <p className="text-sm font-bold text-lime-300">{(analysis?.metrics?.personalROI || 0).toFixed(1)}%</p>
                  <span className="text-[9px] text-white/50">36M</span>
                </Card>
              </div>
            </div>

            {/* Estabilidad y Metas Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <Target className="h-3 w-3" /> Estabilidad & Metas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Metas</span>
                    <Trophy className="h-3 w-3 text-yellow-400" />
                  </div>
                  <p className="text-sm font-bold text-indigo-300">{analysis?.metrics?.avgGoalCompletion ?? 0}%</p>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Consist.</span>
                    <Activity className="h-3 w-3 text-lime-400" />
                  </div>
                  <p className="text-sm font-bold text-lime-300">{analysis?.metrics?.consistencyScore ?? 0}</p>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Proy.</span>
                    <TrendingUp className="h-3 w-3 text-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-amber-300">${formatK(analysis?.metrics?.projectedAnnualSavings)}k</p>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/60">Bienestar</span>
                    <Heart className="h-3 w-3 text-pink-400" />
                  </div>
                  <p className="text-sm font-bold text-green-300">{analysis?.metrics?.mindfulSpendingIndex}</p>
                  <p className="text-[9px] text-white/50">Califícalo 1-10 →</p>
                </Card>
              </div>
            </div>

            {/* Microcopy Empático */}
            

            {/* Análisis AI */}
            <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Análisis Moni AI
              </p>
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                {analysis?.analysis}
              </div>
            </Card>

            {/* Calendario de Próximos Movimientos */}
            {loadingTransactions ? (
              <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
                <div className="text-center text-muted-foreground py-4">Cargando pagos futuros...</div>
              </Card>
            ) : futureEvents.length > 0 ? (
              <FutureCalendarWidget events={futureEvents} />
            ) : (
              <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
                <div className="text-center text-muted-foreground py-4">
                  No hay pagos recurrentes configurados
                </div>
              </Card>
            )}

            {/* Movimientos Recientes - Actualización en tiempo real */}
            <RecentMovementsWidget />

            {/* Gráficas adicionales */}
            <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100">
              <p className="text-xs font-medium text-muted-foreground mb-2">Ingresos vs Gastos</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[{
              name: 'Ing',
              total: analysis?.metrics?.totalIncome || quickMetrics?.totalIncome || 0
            }, {
              name: 'Gas',
              total: analysis?.metrics?.totalExpenses || quickMetrics?.totalExpenses || 0
            }, {
              name: 'Bal',
              total: Math.abs(analysis?.metrics?.balance || quickMetrics?.balance || 0)
            }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{
                fill: 'white',
                fontSize: 10
              }} />
                  <YAxis tick={{
                fill: 'white',
                fontSize: 10
              }} />
                  <Tooltip contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '11px'
              }} labelStyle={{
                color: 'white'
              }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {[{
                  v: 1
                }, {
                  v: 2
                }, {
                  v: 3
                }].map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : (analysis?.metrics?.balance || quickMetrics?.balance || 0) >= 0 ? '#8b5cf6' : '#f59e0b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Historical Comparison */}
            <HistoricalComparisonWidget 
              data={[
                { month: 'May', income: 15000, expenses: 12500, savings: 2500 },
                { month: 'Jun', income: 15500, expenses: 12400, savings: 3100 },
                { month: 'Jul', income: 16000, expenses: 12200, savings: 3800 },
                { month: 'Ago', income: 16200, expenses: 12000, savings: 4200 },
                { month: 'Sep', income: 16500, expenses: 11700, savings: 4800 },
                { month: 'Oct', income: 17000, expenses: 11800, savings: 5200 },
              ]}
              insight="Tu gasto promedio bajó $1,200 desde julio. Mantén la tendencia."
            />

            {/* Evolution Chart */}
            <EvolutionChartWidget 
              data={[
                { month: 'May', score: 62, savings: 2.5, balance: 8.2, income: 15, expenses: 12 },
                { month: 'Jun', score: 65, savings: 3.1, balance: 11.3, income: 15.5, expenses: 11.8 },
                { month: 'Jul', score: 68, savings: 3.8, balance: 15.1, income: 16, expenses: 11.5 },
                { month: 'Ago', score: 70, savings: 4.2, balance: 19.3, income: 16.2, expenses: 11.2 },
                { month: 'Sep', score: 73, savings: 4.8, balance: 24.1, income: 16.5, expenses: 10.9 },
                { month: 'Oct', score: 75, savings: 5.2, balance: 29.3, income: 17, expenses: 10.8 },
              ]}
              insight="Tu ahorro promedio subió 12% en 3 meses, pero tu gasto fijo sigue alto. Ajustar renta o servicios podría darte +4 pts."
            />

            {/* Additional Financial Health Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <IncomeExpensePieWidget 
                income={(analysis?.metrics?.totalIncome ?? quickMetrics?.totalIncome) || 0}
                expenses={(analysis?.metrics?.totalExpenses ?? quickMetrics?.totalExpenses) || 0}
              />
              
              <FinancialHealthPieWidget 
                savings={(analysis?.metrics?.balance ?? 0) > 0 ? (analysis?.metrics?.balance ?? 0) : 0}
                fixedExpenses={(analysis?.metrics?.totalExpenses ?? 0) * 0.6}
                variableExpenses={(analysis?.metrics?.totalExpenses ?? 0) * 0.4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CategoryBreakdownWidget 
                categories={[
                  { name: 'Vivienda', value: (analysis?.metrics?.totalExpenses ?? 0) * 0.3, color: '#8b5cf6' },
                  { name: 'Alimentación', value: (analysis?.metrics?.totalExpenses ?? 0) * 0.25, color: '#ec4899' },
                  { name: 'Transporte', value: (analysis?.metrics?.totalExpenses ?? 0) * 0.15, color: '#f59e0b' },
                  { name: 'Servicios', value: (analysis?.metrics?.totalExpenses ?? 0) * 0.12, color: '#10b981' },
                  { name: 'Entretenimiento', value: (analysis?.metrics?.totalExpenses ?? 0) * 0.10, color: '#3b82f6' },
                  { name: 'Otros', value: (analysis?.metrics?.totalExpenses ?? 0) * 0.08, color: '#ef4444' },
                ]}
              />
              
              <LiquidityGaugeWidget 
                months={analysis?.metrics?.liquidityMonths || 0}
                liquidAssets={analysis?.metrics?.totalLiquidAssets ?? 0}
                monthlyExpenses={analysis?.metrics?.totalExpenses ?? 0}
              />
            </div>
          </>
        ) : (
          <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center">
            <p className="text-muted-foreground">No hay datos disponibles para mostrar</p>
          </Card>
        )}
        </div>
        
        <BottomNav />
      </div>
      )}
    </>
  );
}