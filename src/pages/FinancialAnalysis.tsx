import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Home, Target, MessageSquare, User, Droplets, AlertCircle, Zap, Activity, BarChart3, Shield, Trophy, Heart, ArrowLeft } from "lucide-react";
import moniAiLogo from "@/assets/moni-ai-horizontal.png";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import BottomNav from '@/components/BottomNav';
import { LoadingScreen } from '@/components/LoadingScreen';
import SafeToSpendWidget from "@/components/analysis/SafeToSpendWidget";
import NetWorthWidget from "@/components/analysis/NetWorthWidget";
import ForecastWidget from "@/components/analysis/ForecastWidget";
import BudgetProgressWidget from "@/components/analysis/BudgetProgressWidget";
import DebtPaymentPlanWidget from "@/components/analysis/DebtPaymentPlanWidget";
import UpcomingTransactionsWidget from "@/components/analysis/UpcomingTransactionsWidget";
import RiskIndicatorsWidget from "@/components/analysis/RiskIndicatorsWidget";
import EvolutionChartWidget from "@/components/analysis/EvolutionChartWidget";
import HistoricalComparisonWidget from "@/components/analysis/HistoricalComparisonWidget";

import YearOverYearWidget from "@/components/analysis/YearOverYearWidget";
import SeasonalTrendsWidget from "@/components/analysis/SeasonalTrendsWidget";
import BurnRateWidget from "@/components/analysis/BurnRateWidget";
import NetWorthEvolutionWidget from "@/components/analysis/NetWorthEvolutionWidget";
import WeeklySpendingPatternWidget from "@/components/analysis/WeeklySpendingPatternWidget";
import AICoachInsightsWidget from "@/components/analysis/AICoachInsightsWidget";
import FinancialHealthPieWidget from "@/components/analysis/FinancialHealthPieWidget";
import LiquidityGaugeWidget from "@/components/analysis/LiquidityGaugeWidget";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AIAnalysisLoader } from "@/components/AIAnalysisLoader";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinancialAnalysis() {
  const navigate = useNavigate();
  
  // Check if we have cached data to avoid showing loader unnecessarily
  const hasCachedData = (() => {
    const cacheKey = `financialAnalysis_full_month_cache`;
    const cached = localStorage.getItem(cacheKey);
    return !!cached;
  })();
  
  const [loading, setLoading] = useState(!hasCachedData); // Only show loader if no cache
  const [period, setPeriod] = useState("month");
  const [user, setUser] = useState<any>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [chartsPeriod, setChartsPeriod] = useState<'month' | 'year'>('month');
  
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
  const [momGrowth, setMomGrowth] = useState<number | null>(null); // Month over Month growth
  const [showLiquidityDialog, setShowLiquidityDialog] = useState(false); // Dialog for liquidity explanation
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showSavingsDialog, setShowSavingsDialog] = useState(false);
  const [showCashFlowDialog, setShowCashFlowDialog] = useState(false); // Liquidez y Estabilidad
  
  const [showSplash, setShowSplash] = useState(false);
  const [historicalMonthlyData, setHistoricalMonthlyData] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_evolutionData');
    return cached ? JSON.parse(cached) : [];
  });
  const [yearOverYearData, setYearOverYearData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_yearOverYearData');
    return cached ? JSON.parse(cached) : [];
  });
  const [seasonalData, setSeasonalData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_seasonalData');
    return cached ? JSON.parse(cached) : [];
  });
  const [categoryHeatmapData, setCategoryHeatmapData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_categoryHeatmapData');
    return cached ? JSON.parse(cached) : [];
  });
  const [burnRateData, setBurnRateData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_burnRateData');
    return cached ? JSON.parse(cached) : [];
  });
  const [netWorthEvolutionData, setNetWorthEvolutionData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_netWorthEvolutionData');
    return cached ? JSON.parse(cached) : [];
  });
  const [weeklySpendingData, setWeeklySpendingData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_weeklySpendingData');
    return cached ? JSON.parse(cached) : [];
  });
  const [expensePatterns, setExpensePatterns] = useState<any>(() => {
    const cached = localStorage.getItem('financialAnalysis_expensePatterns');
    return cached ? JSON.parse(cached) : null;
  });
  const [categoryBreakdownData, setCategoryBreakdownData] = useState<any[]>(() => {
    const cached = localStorage.getItem('financialAnalysis_categoryBreakdownData');
    return cached ? JSON.parse(cached) : [];
  });
  const [chartsData, setChartsData] = useState<{
    income: number;
    expenses: number;
    fixed: number;
    variable: number;
  }>({ 
    income: dashboardData.monthlyIncome, 
    expenses: dashboardData.monthlyExpenses, 
    fixed: dashboardData.fixedExpenses, 
    variable: dashboardData.monthlyExpenses - dashboardData.fixedExpenses 
  });

  // Helper function to safely format values in thousands
  const formatK = (value: number | undefined | null): string => {
    if (value == null || isNaN(value)) return '0.0';
    return (value / 1000).toFixed(1);
  };

  // Helper function to clean markdown from text
  const cleanMarkdown = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('🔄 Cargando datos iniciales');
      
      // Ejecutar cargas en background para datos anuales
      console.log('🚀 Iniciando carga de datos anuales');
      calculateQuickMetrics();
      fetchTransactionsData();
      loadAnalysis();
      loadExpensePatterns();
      
      // Cargar datos de ingresos/gastos para el período actual
      calculateIncomeExpensesByPeriod(chartsPeriod).then(data => {
        setChartsData(data);
      });
    }
  }, [user]);

  // Efecto para actualizar cuando cambie el período de las gráficas
  useEffect(() => {
    if (user && chartsPeriod) {
      console.log(`🔄 Actualizando gráficas para período: ${chartsPeriod}`);
      calculateIncomeExpensesByPeriod(chartsPeriod).then(data => {
        console.log(`📊 Datos calculados para ${chartsPeriod}:`, data);
        setChartsData(data);
      });
    }
  }, [chartsPeriod, user]);

  const calculateQuickMetrics = async () => {
    if (!user) return;
    
    console.log('📊 Calculating metrics for year');
    
    try {
      // Calcular fechas para el año completo
      const now = new Date();
      const startDate = new Date(now.getFullYear(), 0, 1);
      const endDate = new Date(now.getFullYear(), 11, 31); // 31 de diciembre
      
      console.log('📅 Date range:', { 
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
      
      // Convertir monthlyData a array para el widget histórico (últimos 6 meses)
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const sortedMonths = Object.keys(monthlyData).sort();
      const last6Months = sortedMonths.slice(-6);
      const historicalDataArray = last6Months.map(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const data = monthlyData[monthKey];
        return {
          month: monthNames[monthIndex],
          income: Math.round(data.income),
          expenses: Math.round(data.expenses),
          savings: Math.round(data.income - data.expenses)
        };
      });
      
      setHistoricalMonthlyData(historicalDataArray);
      console.log('📊 Historical monthly data:', historicalDataArray);
      
      // Calcular datos de evolución con balance acumulado y score estimado
      let accumulatedBalance = 0;
      const evolutionDataArray = historicalDataArray.map((month, index) => {
        accumulatedBalance += month.savings;
        
        // Calcular un score estimado basado en tasa de ahorro y consistencia
        const savingsRate = month.income > 0 ? (month.savings / month.income) * 100 : 0;
        let scoreEstimate = 40; // Base
        if (month.savings > 0) scoreEstimate += 20;
        if (savingsRate > 20) scoreEstimate += 20;
        if (savingsRate > 10) scoreEstimate += 10;
        if (month.income > 0) scoreEstimate += 10;
        
        return {
          month: month.month,
          score: Math.min(100, scoreEstimate),
          savings: month.savings / 1000, // En miles
          balance: accumulatedBalance / 1000, // En miles
          income: month.income / 1000, // En miles
          expenses: month.expenses / 1000 // En miles
        };
      });
      
      setEvolutionData(evolutionDataArray);
      localStorage.setItem('financialAnalysis_evolutionData', JSON.stringify(evolutionDataArray));
      localStorage.setItem('financialAnalysis_historicalMonthlyData', JSON.stringify(historicalDataArray));
      
      // Calcular Year-over-Year (comparar mismo mes de diferentes años)
      const yearOverYearMap: Record<string, Record<string, number>> = {};
      historicalTxs?.forEach(tx => {
        const date = new Date(tx.transaction_date);
        const year = date.getFullYear().toString();
        const month = monthNames[date.getMonth()];
        
        if (!yearOverYearMap[month]) {
          yearOverYearMap[month] = {};
        }
        if (!yearOverYearMap[month][year]) {
          yearOverYearMap[month][year] = 0;
        }
        
        if (tx.type === 'expense' || tx.type === 'gasto') {
          yearOverYearMap[month][year] += Number(tx.amount);
        }
      });
      
      const yearOverYearArray = Object.keys(yearOverYearMap)
        .map(month => ({
          month,
          ...yearOverYearMap[month]
        }))
        .filter(item => Object.keys(item).length > 2); // Al menos 1 año de datos
      
      setYearOverYearData(yearOverYearArray);
      localStorage.setItem('financialAnalysis_yearOverYearData', JSON.stringify(yearOverYearArray));
      
      // Calcular Seasonal Trends (por trimestre)
      const quarterMap: Record<string, { income: number; expenses: number; savings: number }> = {
        'Q1 (Ene-Mar)': { income: 0, expenses: 0, savings: 0 },
        'Q2 (Abr-Jun)': { income: 0, expenses: 0, savings: 0 },
        'Q3 (Jul-Sep)': { income: 0, expenses: 0, savings: 0 },
        'Q4 (Oct-Dic)': { income: 0, expenses: 0, savings: 0 }
      };
      
      historicalTxs?.forEach(tx => {
        const month = new Date(tx.transaction_date).getMonth();
        let quarter: string;
        if (month < 3) quarter = 'Q1 (Ene-Mar)';
        else if (month < 6) quarter = 'Q2 (Abr-Jun)';
        else if (month < 9) quarter = 'Q3 (Jul-Sep)';
        else quarter = 'Q4 (Oct-Dic)';
        
        const amount = Number(tx.amount);
        if (tx.type === 'income' || tx.type === 'ingreso') {
          quarterMap[quarter].income += amount;
        } else if (tx.type === 'expense' || tx.type === 'gasto') {
          quarterMap[quarter].expenses += amount;
        }
      });
      
      const seasonalArray = Object.keys(quarterMap).map(quarter => ({
        quarter,
        income: Math.round(quarterMap[quarter].income),
        expenses: Math.round(quarterMap[quarter].expenses),
        savings: Math.round(quarterMap[quarter].income - quarterMap[quarter].expenses)
      }));
      
      setSeasonalData(seasonalArray);
      localStorage.setItem('financialAnalysis_seasonalData', JSON.stringify(seasonalArray));
      
      // Calcular Category Heatmap (gastos por categoría a lo largo de los meses)
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense');
      
      const categoryMonthMap: Record<string, Record<string, number>> = {};
      
      historicalTxs?.forEach(tx => {
        if (tx.type === 'expense' || tx.type === 'gasto') {
          const monthKey = tx.transaction_date.substring(0, 7); // YYYY-MM
          const [year, month] = monthKey.split('-');
          const monthIndex = parseInt(month) - 1;
          const monthLabel = monthNames[monthIndex];
          
          // Find category name
          const category = categories?.find(c => c.id === tx.category_id);
          const categoryName = category?.name || 'Sin categoría';
          
          if (!categoryMonthMap[categoryName]) {
            categoryMonthMap[categoryName] = {};
          }
          if (!categoryMonthMap[categoryName][monthLabel]) {
            categoryMonthMap[categoryName][monthLabel] = 0;
          }
          
          categoryMonthMap[categoryName][monthLabel] += Number(tx.amount);
        }
      });
      
      const categoryHeatmapArray = Object.keys(categoryMonthMap)
        .map(category => ({
          category,
          months: categoryMonthMap[category]
        }))
        .sort((a, b) => {
          const sumA = Object.values(a.months).reduce((sum, val) => sum + val, 0);
          const sumB = Object.values(b.months).reduce((sum, val) => sum + val, 0);
          return sumB - sumA;
        });
      
      setCategoryHeatmapData(categoryHeatmapArray);
      localStorage.setItem('financialAnalysis_categoryHeatmapData', JSON.stringify(categoryHeatmapArray));
      
      // Calcular Net Worth Evolution (evolución patrimonial)
      const { data: netWorthSnapshots } = await supabase
        .from('net_worth_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: true })
        .limit(12);
      
      const netWorthEvolutionArray = netWorthSnapshots?.map(snapshot => {
        const date = new Date(snapshot.snapshot_date);
        const monthIndex = date.getMonth();
        
        return {
          month: monthNames[monthIndex],
          netWorth: Number(snapshot.net_worth),
          assets: Number(snapshot.total_assets),
          liabilities: Number(snapshot.total_liabilities)
        };
      }) || [];
      
      setNetWorthEvolutionData(netWorthEvolutionArray);
      localStorage.setItem('financialAnalysis_netWorthEvolutionData', JSON.stringify(netWorthEvolutionArray));
      
      // Calcular Weekly Spending Pattern del mes actual (gastos por día de la semana en el mes)
      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const weeklySpendingMap: Record<string, { amount: number; count: number }> = {
        'Lun': { amount: 0, count: 0 },
        'Mar': { amount: 0, count: 0 },
        'Mié': { amount: 0, count: 0 },
        'Jue': { amount: 0, count: 0 },
        'Vie': { amount: 0, count: 0 },
        'Sáb': { amount: 0, count: 0 },
        'Dom': { amount: 0, count: 0 }
      };
      
      // Obtener el mes actual
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Filtrar solo transacciones del mes actual
      historicalTxs?.forEach(tx => {
        const txDate = new Date(tx.transaction_date);
        if (tx.type === 'expense' || tx.type === 'gasto') {
          // Solo incluir si está en el mes actual
          if (txDate >= currentMonthStart && txDate <= currentMonthEnd) {
            const dayOfWeek = txDate.getDay(); // 0=Domingo, 1=Lunes, etc.
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir a índice 0=Lun, 6=Dom
            const dayName = dayNames[dayIndex];
            
            weeklySpendingMap[dayName].amount += Number(tx.amount);
            weeklySpendingMap[dayName].count += 1;
          }
        }
      });
      
      const weeklySpendingArray = Object.keys(weeklySpendingMap).map(day => ({
        day,
        amount: Math.round(weeklySpendingMap[day].amount),
        transactionCount: weeklySpendingMap[day].count
      }));
      
      setWeeklySpendingData(weeklySpendingArray);
      localStorage.setItem('financialAnalysis_weeklySpendingData', JSON.stringify(weeklySpendingArray));
      
      
      // Calculate MoM (Month over Month) growth
      const monthKeys = Object.keys(monthlyData).sort();
      if (monthKeys.length >= 2) {
        const currentMonth = monthKeys[monthKeys.length - 1];
        const previousMonth = monthKeys[monthKeys.length - 2];
        
        const currentBalance = monthlyData[currentMonth].income - monthlyData[currentMonth].expenses;
        const previousBalance = monthlyData[previousMonth].income - monthlyData[previousMonth].expenses;
        
        if (previousBalance !== 0) {
          const momPercentage = ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100;
          setMomGrowth(momPercentage);
          console.log('📈 MoM Growth:', {
            currentMonth,
            previousMonth,
            currentBalance,
            previousBalance,
            momPercentage: momPercentage.toFixed(1) + '%'
          });
        }
      }
      
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
      
      // Calculate additional metrics - Get fixed expenses from configuration
      const { data: fixedExpensesConfig } = await supabase
        .from('fixed_expenses_config')
        .select('monthly_amount')
        .eq('user_id', user.id);
      
      console.log('💰 Configuración de gastos fijos (calculateQuickMetrics):', fixedExpensesConfig);
      
      const fixedExpenses = fixedExpensesConfig
        ?.reduce((sum, config) => sum + Number(config.monthly_amount), 0) || 0;
      
      console.log(`💰 Total gastos fijos: $${fixedExpenses}`);
      
      const variableExpenses = totalExpenses - fixedExpenses;
      
      console.log(`💰 Gastos variables: $${variableExpenses} (Total: $${totalExpenses} - Fijos: $${fixedExpenses})`);
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
      
      // Calcular Burn Rate (ahorro/déficit mensual y acumulado)
      let ahorroAcumulado = 0;
      const burnRateArray = historicalDataArray.map((month, index) => {
        const ahorroMensual = month.income - month.expenses; // Positivo = ahorro, negativo = déficit
        ahorroAcumulado += ahorroMensual; // Sumar al acumulado
        
        return {
          month: month.month,
          ahorro: Math.round(ahorroMensual), // Ahorro o déficit del mes
          ahorroAcumulado: Math.round(ahorroAcumulado) // Total acumulado
        };
      });
      
      setBurnRateData(burnRateArray);
      localStorage.setItem('financialAnalysis_burnRateData', JSON.stringify(burnRateArray));
      
      setQuickMetrics(metricsData);
      // Guardar con clave para datos anuales
      const cacheKey = `financialAnalysis_quickMetrics_year`;
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
      
      setLoadingTransactions(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoadingTransactions(false);
    }
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
        
        // Handle payment required error
        if (error.message?.includes('402') || data?.error === 'PAYMENT_REQUIRED') {
          toast.error('No hay créditos suficientes en Lovable AI', {
            description: 'Ve a Settings → Workspace → Usage para recargar créditos.',
            duration: 8000,
          });
          setLoading(false);
          return;
        }
        
        // Handle rate limit error  
        if (error.message?.includes('429') || data?.error === 'RATE_LIMIT') {
          toast.error('Demasiadas solicitudes', {
            description: 'Por favor, espera unos momentos antes de intentar nuevamente.',
            duration: 5000,
          });
          setLoading(false);
          return;
        }
        
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

  const loadExpensePatterns = async () => {
    if (!user?.id) {
      console.log('User not available yet, skipping expense patterns load');
      return;
    }
    
    // Verificar caché primero - usar datos de hasta 10 minutos
    const cacheKey = `financialAnalysis_expensePatterns_${user.id}`;
    const cacheTimeKey = `${cacheKey}_time`;
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = Date.now();
    
    // Si hay caché válido, usarlo
    if (cachedTime && (now - parseInt(cachedTime)) < 10 * 60 * 1000) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setExpensePatterns(data);
          console.log('✅ Using cached expense patterns data');
          return;
        } catch (e) {
          console.error('Cache parse error:', e);
        }
      }
    }
    
    try {
      console.log('🔄 Detectando patrones de gastos para userId:', user.id);
      
      const { data, error } = await supabase.functions.invoke('detect-expense-patterns', {
        body: { userId: user.id }
      });
      
      console.log('📥 Response from edge function:', { data, error });
      
      if (error) {
        console.error('Expense patterns error:', error);
        throw error;
      }
      
      if (data) {
        console.log('📊 Patrones de gastos detectados:', {
          fijos: { total: data.fixed?.total, count: data.fixed?.count },
          variables: { total: data.variable?.total, count: data.variable?.count },
          hormiga: { total: data.ant?.total, count: data.ant?.count },
          impulsivos: { total: data.impulsive?.total, count: data.impulsive?.count }
        });
        setExpensePatterns(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, now.toString());
        localStorage.setItem('financialAnalysis_expensePatterns', JSON.stringify(data));
        console.log('✅ Expense patterns cached successfully');
      }
    } catch (error: any) {
      console.error("Error loading expense patterns:", error);
      // No mostrar toast para no molestar al usuario, solo log
    }
  };

  const calculateCategoryBreakdown = async (periodType: 'month' | 'year' = 'month') => {
    if (!user?.id) {
      console.log('User not available yet, skipping category breakdown');
      return;
    }
    
    // Verificar caché primero
    const cacheKey = `financialAnalysis_categoryBreakdownData_${periodType}_${user.id}`;
    const cacheTimeKey = `${cacheKey}_time`;
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = Date.now();
    
    // Si hay caché válido, usarlo
    if (cachedTime && (now - parseInt(cachedTime)) < 10 * 60 * 1000) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setCategoryBreakdownData(data);
          console.log('✅ Using cached category breakdown data');
          return data;
        } catch (e) {
          console.error('Cache parse error:', e);
        }
      }
    }
    
    try {
      console.log(`🔄 Calculating category breakdown for ${periodType.toUpperCase()}`);
      
      const nowDate = new Date();
      let startDate: Date;
      let endDate: Date;
      
      if (periodType === 'month') {
        // MES ACTUAL
        startDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
        endDate = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
      } else {
        // AÑO ACTUAL
        startDate = new Date(nowDate.getFullYear(), 0, 1);
        endDate = new Date(nowDate.getFullYear(), 11, 31);
      }
      
      console.log('📅 Fechas para category breakdown:', {
        periodo: periodType,
        inicio: startDate.toISOString().split('T')[0],
        fin: endDate.toISOString().split('T')[0]
      });
      
      // Obtener todas las transacciones de gastos del período
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .in('type', ['gasto', 'expense'])
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);
      
      if (txError) throw txError;
      
      console.log(`📊 Transacciones del ${periodType} obtenidas:`, transactions?.length || 0);
      
      // Agrupar por categoría
      const categoryMap: Record<string, { name: string; value: number; color: string }> = {};
      
      transactions?.forEach(tx => {
        const categoryName = tx.categories?.name || 'Sin categoría';
        const categoryColor = tx.categories?.color || '#9ca3af';
        
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = { name: categoryName, value: 0, color: categoryColor };
        }
        
        categoryMap[categoryName].value += Number(tx.amount);
      });
      
      // Convertir a array y ordenar por valor (mayor a menor)
      const categoryArray = Object.values(categoryMap)
        .filter(cat => cat.value > 0)
        .sort((a, b) => b.value - a.value);
      
      console.log(`📊 Category breakdown calculated (${periodType.toUpperCase()}):`, categoryArray);
      
      setCategoryBreakdownData(categoryArray);
      localStorage.setItem(cacheKey, JSON.stringify(categoryArray));
      localStorage.setItem(cacheTimeKey, now.toString());
      
      return categoryArray;
    } catch (error) {
      console.error('Error calculating category breakdown:', error);
      return [];
    }
  };

  const calculateIncomeExpensesByPeriod = async (periodType: 'month' | 'year' = 'month') => {
    if (!user?.id) return { income: 0, expenses: 0, fixed: 0, variable: 0 };
    
    try {
      console.log(`📊 Calculando ingresos/gastos para período: ${periodType}`);
      const nowDate = new Date();
      let startDate: Date;
      let endDate: Date;
      
      if (periodType === 'month') {
        startDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
        endDate = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
      } else {
        startDate = new Date(nowDate.getFullYear(), 0, 1);
        endDate = new Date(nowDate.getFullYear(), 11, 31);
      }
      
      console.log(`📅 Rango de fechas: ${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`);
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);
      
      console.log(`💰 Transacciones encontradas: ${transactions?.length || 0}`);
      
      const income = transactions
        ?.filter(t => t.type === 'income' || t.type === 'ingreso')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const expenses = transactions
        ?.filter(t => t.type === 'expense' || t.type === 'gasto')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      // Get fixed expenses from configuration
      const { data: fixedExpensesConfig } = await supabase
        .from('fixed_expenses_config')
        .select('monthly_amount')
        .eq('user_id', user.id);
      
      console.log('💰 Configuración de gastos fijos:', fixedExpensesConfig);
      
      const fixedExpenses = fixedExpensesConfig
        ?.reduce((sum, config) => sum + Number(config.monthly_amount), 0) || 0;
      
      console.log(`💰 Total gastos fijos configurados: $${fixedExpenses}`);
      
      // For year period, multiply by 12
      const actualFixedExpenses = periodType === 'year' ? fixedExpenses * 12 : fixedExpenses;
      
      console.log(`💰 Gastos fijos para período ${periodType}: $${actualFixedExpenses}`);
      
      const variableExpenses = expenses - actualFixedExpenses;
      
      const result = { income, expenses, fixed: actualFixedExpenses, variable: variableExpenses };
      console.log(`✅ Resultado del cálculo (período: ${periodType}):`, result);
      
      return result;
    } catch (error) {
      console.error('Error calculating income/expenses:', error);
      return { income: 0, expenses: 0, fixed: 0, variable: 0 };
    }
  };

  return (
    <>
      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="min-h-screen pb-24 animate-fade-in">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  Análisis Financiero
                </h1>
                <p className="text-xs text-gray-600">
                  Desliza para ver mes y año
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>

            {/* Mostrar métricas instantáneas (siempre disponibles del caché) */}
            {(quickMetrics || analysis) ? (
          <>
            {/* Animated Income & Expense Card with Carousel */}
            <div className="relative">
              <div 
                ref={scrollContainerRef}
                className="overflow-x-scroll snap-x snap-mandatory flex gap-4 pb-2 -mx-4 px-4 scroll-smooth" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const slideIndex = Math.round(container.scrollLeft / container.offsetWidth);
                  setCurrentSlide(slideIndex);
                }}
              >
              {/* Card Mensual */}
              <Card
                className="min-w-full snap-center p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 space-y-2 animate-fade-in cursor-pointer flex-shrink-0"
                style={{ animationDelay: '0ms' }}
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem('balanceViewMode', 'mensual');
                  navigate('/balance');
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-primary">📅 Mes Actual</p>
                </div>
                {(() => {
                  const income = dashboardData.monthlyIncome;
                  const expenses = dashboardData.monthlyExpenses;
                  const balance = income - expenses;
                  const maxValue = Math.max(income, expenses);
                  
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
                              <p className="text-xs text-muted-foreground">Mes actual</p>
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
                              <p className="text-xs text-muted-foreground">Mes actual</p>
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

              {/* Card Anual */}
              <Card 
                className="min-w-full snap-center p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 space-y-2 animate-fade-in cursor-pointer transition-all flex-shrink-0" 
                style={{ animationDelay: '100ms' }}
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem('balanceViewMode', 'anual');
                  navigate('/balance');
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-purple-600">📊 Año Completo</p>
                </div>
                {(() => {
                  const income = quickMetrics?.totalIncome || 0;
                  const expenses = quickMetrics?.totalExpenses || 0;
                  const balance = income - expenses;
                  const maxValue = Math.max(income, expenses);
                  
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
                              <p className="text-xs text-muted-foreground">Año completo</p>
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
                              <p className="text-xs text-muted-foreground">Año completo</p>
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
              </div>
              
              {/* Indicadores de navegación */}
              <div className="flex justify-center gap-2 mt-3">
                {[0, 1].map((index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const container = scrollContainerRef.current;
                      if (container) {
                        container.scrollTo({
                          left: index * container.offsetWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === index 
                        ? 'w-8 bg-primary' 
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                    aria-label={`Ir a slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Risk Indicators */}
            <RiskIndicatorsWidget
              hasIssues={
                analysis?.riskIndicators && analysis?.riskIndicators.length > 0 &&
                analysis?.riskIndicators.some((i: any) => i.level === 'critical' || i.level === 'warning')
              }
              indicators={analysis?.riskIndicators || []}
            />

            {/* Liquidez de Emergencia */}
            <LiquidityGaugeWidget 
              months={analysis?.metrics?.liquidityMonths || 0}
              liquidAssets={analysis?.metrics?.totalLiquidAssets ?? 0}
              monthlyExpenses={analysis?.metrics?.totalExpenses ?? 0}
            />

            {/* Proyección Anual removida - se moverá a página de proyecciones */}

            {/* Análisis AI */}
            <Dialog>
              <DialogTrigger asChild>
                <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                  <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> Análisis Moni AI
                  </p>
                  <div className="text-xs text-foreground leading-relaxed line-clamp-3">
                    {cleanMarkdown(analysis?.analysis)}
                  </div>
                  <p className="text-xs text-primary mt-2 font-medium">Ver análisis completo →</p>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-[280px] bg-white/95 backdrop-blur-xl border border-blue-100 shadow-2xl rounded-[20px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground text-sm">
                    <BarChart3 className="h-4 w-4" />
                    Análisis Completo Moni AI
                  </DialogTitle>
                </DialogHeader>
                <div className="text-sm text-foreground leading-snug whitespace-pre-line max-h-[60vh] overflow-y-auto p-2 rounded-[20px] bg-white/50 space-y-1">
                  {cleanMarkdown(analysis?.analysis)}
                </div>
              </DialogContent>
            </Dialog>

            {/* Liquidez - Grid Compacto Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Liquidez y Estabilidad
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
                  <DialogTrigger asChild>
                    <Card className={`p-3 rounded-[20px] shadow-xl border cursor-pointer ${
                      (analysis?.metrics?.balance ?? 0) >= 0 
                        ? 'border-green-200 bg-green-50/50 hover:bg-green-100/50' 
                        : 'border-red-200 bg-red-50/50 hover:bg-red-100/50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Balance</span>
                        <DollarSign className={`h-3 w-3 ${(analysis?.metrics?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <p className={`text-lg font-bold ${(analysis?.metrics?.balance ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${formatK(analysis?.metrics?.balance)}k
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        MoM: {momGrowth !== null 
                          ? `${momGrowth > 0 ? '+' : ''}${momGrowth.toFixed(1)}%` 
                          : 'Calculando...'}
                      </p>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-3xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <DollarSign className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <span className="font-bold">Balance</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2.5 text-sm">
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Tu balance es la diferencia entre tus ingresos y gastos totales.
                      </p>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-2xl space-y-1.5 border border-green-100">
                        <p className="text-[10px] font-medium text-muted-foreground">Tu balance actual</p>
                        <p className={`text-2xl font-bold ${(analysis?.metrics?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${formatK(analysis?.metrics?.balance)}k
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(analysis?.metrics?.balance ?? 0) >= 0 ? '✅ Superávit' : '🚨 Déficit'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-foreground">Cálculo</p>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-mono text-center text-muted-foreground">
                            Ingresos - Gastos
                          </p>
                          <p className="text-[10px] text-center text-muted-foreground mt-0.5">
                            ${formatK(analysis?.metrics?.totalIncome)}k - ${formatK(analysis?.metrics?.totalExpenses)}k
                          </p>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-100 p-2 rounded-xl">
                        <p className="text-[10px] text-green-900">
                          <strong>💡 Tip:</strong> Un balance positivo significa que estás ahorrando.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showSavingsDialog} onOpenChange={setShowSavingsDialog}>
                  <DialogTrigger asChild>
                    <Card className={`p-3 rounded-[20px] shadow-xl border cursor-pointer ${
                      (analysis?.metrics?.savingsRate ?? 0) >= 20 
                        ? 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/50' 
                        : (analysis?.metrics?.savingsRate ?? 0) >= 10 
                        ? 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100/50' 
                        : 'border-red-200 bg-red-50/50 hover:bg-red-100/50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Ahorro</span>
                        <PiggyBank className={`h-3 w-3 ${
                          (analysis?.metrics?.savingsRate ?? 0) >= 20 
                            ? 'text-purple-600' 
                            : (analysis?.metrics?.savingsRate ?? 0) >= 10 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`} />
                      </div>
                      <p className={`text-lg font-bold ${
                        (analysis?.metrics?.savingsRate ?? 0) >= 20 
                          ? 'text-purple-700' 
                          : (analysis?.metrics?.savingsRate ?? 0) >= 10 
                          ? 'text-yellow-700' 
                          : 'text-red-700'
                      }`}>
                        {analysis?.metrics?.savingsRate ?? 0}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        meta: {(analysis?.metrics?.liquidityMonths ?? 0) >= 3 ? '22%' : '20%'} 
                        {(analysis?.metrics?.savingsRate ?? 0) >= 20 && ' 🎯'}
                      </p>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-3xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <PiggyBank className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <span className="font-bold">Tasa de Ahorro</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2.5 text-sm">
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Porcentaje de tus ingresos que logras ahorrar cada mes.
                      </p>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-2xl space-y-1.5 border border-purple-100">
                        <p className="text-[10px] font-medium text-muted-foreground">Tu tasa de ahorro</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {analysis?.metrics?.savingsRate ?? 0}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(analysis?.metrics?.savingsRate ?? 0) >= 20 
                            ? '✅ Excelente' 
                            : (analysis?.metrics?.savingsRate ?? 0) >= 10 
                            ? '⚠️ Bien, mejora más' 
                            : '🚨 Necesita mejorar'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-foreground">Cálculo</p>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-mono text-center text-muted-foreground">
                            (Balance ÷ Ingresos) × 100
                          </p>
                          <p className="text-[10px] text-center text-muted-foreground mt-0.5">
                            (${formatK(analysis?.metrics?.balance)}k ÷ ${formatK(analysis?.metrics?.totalIncome)}k) × 100
                          </p>
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-100 p-2 rounded-xl">
                        <p className="text-[10px] text-purple-900">
                          <strong>💡 Tip:</strong> Meta: 20% o más de tus ingresos.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showLiquidityDialog} onOpenChange={setShowLiquidityDialog}>
                  <DialogTrigger asChild>
                    <Card 
                      className={`p-3 rounded-[20px] shadow-xl border cursor-pointer ${
                        (analysis?.metrics?.liquidityMonths || 0) >= 3 
                          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50' 
                          : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 
                          ? 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100/50' 
                          : 'border-red-200 bg-red-50/50 hover:bg-red-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Liquidez</span>
                        <Droplets className={`h-3 w-3 ${(analysis?.metrics?.liquidityMonths || 0) >= 3 ? 'text-emerald-600' : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 ? 'text-yellow-600' : 'text-red-600'}`} />
                      </div>
                      <p className={`text-lg font-bold ${(analysis?.metrics?.liquidityMonths || 0) >= 3 ? 'text-emerald-700' : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {(analysis?.metrics?.liquidityMonths || 0).toFixed(1)} m
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(analysis?.metrics?.liquidityMonths || 0) >= 3 ? '✅ Seguro' : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 ? '⚠️ Regular' : '🚨 Crítico'}
                      </p>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-3xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Droplets className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="font-bold">Liquidez</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2.5 text-sm">
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Mide cuántos meses podrías mantener tu estilo de vida sin ingresos.
                      </p>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-2xl space-y-1.5 border border-blue-100">
                        <p className="text-[10px] font-medium text-muted-foreground">Tu liquidez actual</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {(analysis?.metrics?.liquidityMonths || 0).toFixed(1)} meses
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(analysis?.metrics?.liquidityMonths || 0) >= 3 
                            ? '✅ Colchón saludable' 
                            : (analysis?.metrics?.liquidityMonths || 0) >= 1.5 
                            ? '⚠️ Aumenta tu fondo' 
                            : '🚨 Mejora urgentemente'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-foreground">Cálculo</p>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-mono text-center text-muted-foreground">
                            Balance ÷ Gastos mensuales
                          </p>
                          <p className="text-[10px] text-center text-muted-foreground mt-0.5">
                            ${formatK(analysis?.metrics?.balance)}k ÷ ${formatK((analysis?.metrics?.totalExpenses || 0) / 12)}k/mes
                          </p>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                        <p className="text-[10px] text-amber-900">
                          <strong>💡 Tip:</strong> Ideal: 3-6 meses de gastos.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCashFlowDialog} onOpenChange={setShowCashFlowDialog}>
                  <DialogTrigger asChild>
                    <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-teal-100 cursor-pointer hover:bg-teal-50/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Liquidez y Estabilidad</span>
                        <TrendingUp className="h-3 w-3 text-teal-500" />
                      </div>
                      <p className="text-lg font-bold text-teal-600">
                        {(() => {
                          const liquidityMonths = analysis?.metrics?.liquidityMonths || 0;
                          const stabilityRatio = (analysis?.metrics?.balance || 0) / ((analysis?.metrics?.totalExpenses || 1) / 30);
                          const stabilityIndex = ((liquidityMonths * 30) + stabilityRatio) / 30;
                          return stabilityIndex.toFixed(1);
                        })()}x
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        índice de estabilidad
                      </p>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-3xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-teal-100 rounded-lg">
                          <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <span className="font-bold">Liquidez y Estabilidad</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2.5 text-sm">
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Mide tu capacidad de mantener tu nivel de vida actual y responder a imprevistos.
                      </p>
                      
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-3 rounded-2xl space-y-1.5 border border-teal-100">
                        <p className="text-[10px] font-medium text-muted-foreground">Tu índice</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                          {(() => {
                            const liquidityMonths = analysis?.metrics?.liquidityMonths || 0;
                            const stabilityRatio = (analysis?.metrics?.balance || 0) / ((analysis?.metrics?.totalExpenses || 1) / 30);
                            const stabilityIndex = ((liquidityMonths * 30) + stabilityRatio) / 30;
                            return stabilityIndex.toFixed(1);
                          })()}x
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(() => {
                            const liquidityMonths = analysis?.metrics?.liquidityMonths || 0;
                            const stabilityRatio = (analysis?.metrics?.balance || 0) / ((analysis?.metrics?.totalExpenses || 1) / 30);
                            const stabilityIndex = ((liquidityMonths * 30) + stabilityRatio) / 30;
                            return stabilityIndex >= 3 ? '💪 Estabilidad sólida' : stabilityIndex >= 1.5 ? '👍 Estabilidad moderada' : '⚠️ Baja estabilidad';
                          })()}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-foreground">Cálculo</p>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-mono text-center text-muted-foreground">
                            (Meses de Liquidez × 30 + Balance/Gasto Diario) ÷ 30
                          </p>
                          <p className="text-[10px] text-center text-muted-foreground mt-0.5">
                            ({(analysis?.metrics?.liquidityMonths || 0).toFixed(1)} × 30 + ${formatK(analysis?.metrics?.balance)}k / ${formatK((analysis?.metrics?.totalExpenses || 1) / 30)}k) ÷ 30
                          </p>
                        </div>
                      </div>

                      <div className="bg-teal-50 border border-teal-100 p-2 rounded-xl">
                        <p className="text-[10px] text-teal-900">
                          <strong>💡 Tip:</strong> Un índice mayor a 3x indica excelente estabilidad financiera y capacidad de ahorro.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

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
            <BudgetProgressWidget {...(analysis?.budgetProgress || {})} isLoading={loading} />

            {/* 6. DEUDA INTELIGENTE */}
            {analysis?.debtPlan && analysis?.debtPlan.debts && analysis?.debtPlan.debts.length > 0 && <DebtPaymentPlanWidget {...analysis?.debtPlan} />}

            {/* Llamados a la Acción */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">🎯 Acciones Recomendadas</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 text-xs h-auto py-2"
                  onClick={() => navigate('/subscriptions')}
                >
                  Administrar suscripciones
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 text-xs h-auto py-2"
                  onClick={() => navigate('/edit-budgets')}
                >
                  Ajustar presupuesto
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 text-xs h-auto py-2"
                  onClick={() => navigate('/networth')}
                >
                  Plan de deudas
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-white rounded-[20px] shadow-xl border border-blue-100 hover:bg-white/90 text-xs h-auto py-2"
                  onClick={() => navigate('/saving-simulation')}
                >
                  Simulación de ahorro por IA
                </Button>
              </div>
            </div>

            {/* Control de Gastos - Compacto */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Control de Gastos
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card 
                  className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer"
                  onClick={() => navigate('/fixed-expenses')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Fijos</span>
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    ${formatK(expensePatterns?.fixed?.total || 0)}k
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{expensePatterns?.fixed?.count || 0} gastos</span>
                    <span className="text-muted-foreground">{expensePatterns?.fixed?.percentage?.toFixed(0) || 0}% del gasto</span>
                  </div>
                </Card>

                <Card 
                  className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer"
                  onClick={() => navigate('/variable-expenses')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Variables</span>
                    <Zap className="h-3 w-3 text-violet-500" />
                  </div>
                  <p className="text-lg font-bold text-violet-600">
                    ${formatK(expensePatterns?.variable?.total || 0)}k
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{expensePatterns?.variable?.count || 0} gastos</span>
                    <span className="text-muted-foreground">{expensePatterns?.variable?.percentage?.toFixed(0) || 0}% del gasto</span>
                  </div>
                </Card>

                <Card 
                  className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer"
                  onClick={() => navigate('/ant-expenses')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Hormiga</span>
                    <span className="text-lg">🐜</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-600">
                    ${formatK(expensePatterns?.ant?.total || 0)}k
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{expensePatterns?.ant?.count || 0} gastos</span>
                    <span className="text-muted-foreground">{expensePatterns?.ant?.percentage?.toFixed(1) || 0}% del gasto</span>
                  </div>
                </Card>

                <Card 
                  className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer"
                  onClick={() => navigate('/impulsive-expenses')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Impulsivos</span>
                    <AlertCircle className="h-3 w-3 text-rose-500" />
                  </div>
                  <p className="text-lg font-bold text-rose-600">{expensePatterns?.impulsive?.count || 0}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">compras</span>
                    <span className="text-muted-foreground">${formatK(expensePatterns?.impulsive?.total || 0)}k</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Endeudamiento Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" /> Endeudamiento
              </p>
              {(analysis?.metrics?.totalDebt ?? 0) > 0 ? <>
                  <div className="grid grid-cols-4 gap-2">
                    <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                      <span className="text-[10px] text-muted-foreground">Razón</span>
                      <p className="text-sm font-bold text-red-600">{(analysis?.metrics?.debtRatio || 0).toFixed(1)}%</p>
                    </Card>
                    <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                      <span className="text-[10px] text-muted-foreground">Carga</span>
                      <p className="text-sm font-bold text-orange-600">{(analysis?.metrics?.financialBurden || 0).toFixed(1)}%</p>
                    </Card>
                    <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                      <span className="text-[10px] text-muted-foreground">D/I</span>
                      <p className="text-sm font-bold text-yellow-600">{(analysis?.metrics?.debtToIncomeRatio || 0).toFixed(2)}</p>
                    </Card>
                    <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                      <span className="text-[10px] text-muted-foreground">Int.</span>
                      <p className="text-sm font-bold text-rose-600">{(analysis?.metrics?.interestOnIncome || 0).toFixed(1)}%</p>
                    </Card>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                    <p className="text-xs text-purple-700">
                      💡 Salís en 8 meses · Intereses este mes: $2,450
                    </p>
                  </div>
                </> : <Card className="p-3 bg-emerald-50 rounded-[20px] shadow-xl border border-emerald-200">
                  <p className="text-xs text-emerald-700 text-center">
                    🎉 Sin deudas activas - ¡Excelente!
                  </p>
                </Card>}
            </div>

            {/* Estabilidad y Metas Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Estabilidad & Metas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Metas</span>
                    <Trophy className="h-3 w-3 text-yellow-500" />
                  </div>
                  <p className="text-sm font-bold text-indigo-600">{analysis?.metrics?.avgGoalCompletion ?? 0}%</p>
                </Card>
                <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Consist.</span>
                    <Activity className="h-3 w-3 text-lime-500" />
                  </div>
                  <p className="text-sm font-bold text-lime-600">{analysis?.metrics?.consistencyScore ?? 0}</p>
                </Card>
                <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Proy.</span>
                    <TrendingUp className="h-3 w-3 text-amber-500" />
                  </div>
                  <p className="text-sm font-bold text-amber-600">${formatK(analysis?.metrics?.projectedAnnualSavings)}k</p>
                </Card>
                <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Bienestar</span>
                    <Heart className="h-3 w-3 text-pink-500" />
                  </div>
                  <p className="text-sm font-bold text-green-600">{analysis?.metrics?.mindfulSpendingIndex}</p>
                  <p className="text-[9px] text-muted-foreground">Califícalo 1-10 →</p>
                </Card>
              </div>
            </div>

            {/* Microcopy Empático */}

            {/* Historical Comparison */}
            <HistoricalComparisonWidget
              data={historicalMonthlyData.length > 0 ? historicalMonthlyData : [
                { month: 'Sin datos', income: 0, expenses: 0, savings: 0 }
              ]}
              insight={(() => {
                if (historicalMonthlyData.length < 2) return undefined;
                
                const firstMonth = historicalMonthlyData[0];
                const lastMonth = historicalMonthlyData[historicalMonthlyData.length - 1];
                const avgExpenses = historicalMonthlyData.reduce((sum, m) => sum + m.expenses, 0) / historicalMonthlyData.length;
                const expenseChange = lastMonth.expenses - firstMonth.expenses;
                const savingsChange = lastMonth.savings - firstMonth.savings;
                
                // Find best savings month
                const bestMonth = historicalMonthlyData.reduce((best, m) => 
                  m.savings > best.savings ? m : best, historicalMonthlyData[0]);
                
                // Determine trend
                if (savingsChange > 0 && expenseChange < 0) {
                  return `¡Excelente! Tus gastos bajaron $${Math.abs(expenseChange).toLocaleString()} y tu ahorro aumentó $${savingsChange.toLocaleString()} desde ${firstMonth.month}.`;
                } else if (savingsChange > 0) {
                  return `Tu ahorro aumentó $${savingsChange.toLocaleString()} desde ${firstMonth.month}. Tu mejor mes fue ${bestMonth.month} con $${bestMonth.savings.toLocaleString()} ahorrados.`;
                } else if (expenseChange < 0) {
                  return `Tus gastos bajaron $${Math.abs(expenseChange).toLocaleString()} desde ${firstMonth.month}. Sigue así para aumentar tu ahorro.`;
                } else {
                  return `Gasto promedio: $${Math.round(avgExpenses).toLocaleString()}. Tu mejor mes fue ${bestMonth.month} con $${bestMonth.savings.toLocaleString()} de ahorro.`;
                }
              })()}
            />

            {/* Evolution Chart */}
            <EvolutionChartWidget 
              data={evolutionData.length > 0 ? evolutionData : [
                { month: 'Sin datos', score: 40, savings: 0, balance: 0, income: 0, expenses: 0 }
              ]}
              insights={(() => {
                if (evolutionData.length < 2) return undefined;
                
                const firstMonth = evolutionData[0];
                const lastMonth = evolutionData[evolutionData.length - 1];
                const scoreChange = lastMonth.score - firstMonth.score;
                const balanceChange = lastMonth.balance - firstMonth.balance;
                const incomeGrowth = ((lastMonth.income - firstMonth.income) / Math.abs(firstMonth.income || 1)) * 100;
                const expenseChange = lastMonth.expenses - firstMonth.expenses;
                
                // Insight para Score
                const scoreInsight = scoreChange > 0
                  ? `Tu score mejoró ${scoreChange.toFixed(0)} puntos desde ${firstMonth.month}. ${lastMonth.score >= 70 ? '¡Excelente nivel financiero!' : 'Sigue mejorando tu tasa de ahorro.'}`
                  : `Tu score está estable en ${lastMonth.score.toFixed(0)} puntos. Aumenta tu tasa de ahorro para mejorar.`;
                
                // Insight para Balance
                const balanceInsight = balanceChange > 0
                  ? `Tu balance acumulado creció $${balanceChange.toFixed(1)}k desde ${firstMonth.month}. ${balanceChange > 50 ? '¡Crecimiento excepcional!' : 'Buen progreso.'}`
                  : `Balance actual: $${lastMonth.balance.toFixed(1)}k. ${lastMonth.balance < 0 ? 'Prioriza reducir deudas.' : 'Mantén el ahorro constante.'}`;
                
                // Insight para Flujo
                const flowInsight = expenseChange < 0
                  ? `Tus gastos bajaron $${Math.abs(expenseChange).toFixed(1)}k desde ${firstMonth.month}. ${incomeGrowth > 0 ? `Y tus ingresos crecieron ${incomeGrowth.toFixed(0)}%. ¡Excelente!` : 'Trabaja en aumentar ingresos.'}`
                  : incomeGrowth > 0
                  ? `Tus ingresos crecieron ${incomeGrowth.toFixed(0)}% desde ${firstMonth.month}. ${expenseChange > 5 ? 'Pero tus gastos también aumentaron. Controla gastos variables.' : '¡Buen trabajo!'}`
                  : `Ingresos: $${lastMonth.income.toFixed(1)}k | Gastos: $${lastMonth.expenses.toFixed(1)}k. Busca reducir gastos o aumentar ingresos.`;
                
                return {
                  score: scoreInsight,
                  balance: balanceInsight,
                  flow: flowInsight
                };
              })()}
            />

            {/* Additional Financial Health Charts */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <FinancialHealthPieWidget 
                  savings={chartsData.income - chartsData.expenses > 0 ? chartsData.income - chartsData.expenses : 0}
                  fixedExpenses={chartsPeriod === 'year' ? (expensePatterns?.fixed?.total || 0) * 12 : (expensePatterns?.fixed?.total || 0)}
                  variableExpenses={chartsPeriod === 'year' ? (expensePatterns?.variable?.total || 0) * 12 : (expensePatterns?.variable?.total || 0)}
                  period={chartsPeriod}
                  onPeriodChange={(value) => setChartsPeriod(value)}
                />
              </div>
            </div>

            {/* New Historical Comparison Widgets */}
            {yearOverYearData.length > 0 && (
              <YearOverYearWidget 
                data={yearOverYearData}
                insight={(() => {
                  const years = yearOverYearData.length > 0 
                    ? Object.keys(yearOverYearData[0]).filter(key => key !== 'month')
                    : [];
                  if (years.length < 2) return undefined;
                  
                  const latestYear = Math.max(...years.map(y => parseInt(y)));
                  const previousYear = latestYear - 1;
                  
                  const latestTotal = yearOverYearData.reduce((sum, item) => sum + (item[latestYear] || 0), 0);
                  const previousTotal = yearOverYearData.reduce((sum, item) => sum + (item[previousYear] || 0), 0);
                  const change = ((latestTotal - previousTotal) / previousTotal) * 100;
                  
                  return change < 0
                    ? `Tus gastos bajaron ${Math.abs(change).toFixed(1)}% vs ${previousYear}. ¡Excelente control financiero!`
                    : `Tus gastos aumentaron ${change.toFixed(1)}% vs ${previousYear}. Revisa gastos variables.`;
                })()}
              />
            )}

            {seasonalData.length > 0 && (
              <SeasonalTrendsWidget 
                data={seasonalData}
                insight={(() => {
                  const bestQuarter = seasonalData.reduce((max, q) => q.savings > max.savings ? q : max, seasonalData[0]);
                  const worstQuarter = seasonalData.reduce((min, q) => q.savings < min.savings ? q : min, seasonalData[0]);
                  
                  return `Tu mejor trimestre fue ${bestQuarter.quarter} con $${(bestQuarter.savings / 1000).toFixed(1)}k ahorrados. ${worstQuarter.quarter} fue el más desafiante con $${(worstQuarter.savings / 1000).toFixed(1)}k.`;
                })()}
              />
            )}

            {burnRateData.length > 0 && (
              <BurnRateWidget 
                data={burnRateData}
                currentSavings={burnRateData[burnRateData.length - 1]?.ahorroAcumulado || 0}
                insight={(() => {
                  const promedioAhorro = burnRateData.reduce((sum, d) => sum + d.ahorro, 0) / burnRateData.length;
                  const totalAcumulado = burnRateData[burnRateData.length - 1]?.ahorroAcumulado || 0;
                  const mesesPositivos = burnRateData.filter(d => d.ahorro > 0).length;
                  
                  if (promedioAhorro > 5000 && totalAcumulado > 50000) {
                    return `¡Excelente! Ahorras en promedio $${promedioAhorro.toLocaleString('es-MX', { maximumFractionDigits: 0 })}/mes. Acumulaste $${totalAcumulado.toLocaleString('es-MX', { maximumFractionDigits: 0 })} en ${burnRateData.length} meses.`;
                  } else if (promedioAhorro > 0) {
                    return `Ahorras $${promedioAhorro.toLocaleString('es-MX', { maximumFractionDigits: 0 })}/mes en promedio. Tienes ${mesesPositivos} meses positivos de ${burnRateData.length}. ¡Sigue así!`;
                  } else if (totalAcumulado > 0) {
                    return `Tu balance acumulado es $${totalAcumulado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}, pero tu promedio mensual es negativo ($${Math.abs(promedioAhorro).toLocaleString('es-MX', { maximumFractionDigits: 0 })}). Reduce gastos.`;
                  } else {
                    return `⚠️ Gastas más de lo que ingresas en promedio ($${Math.abs(promedioAhorro).toLocaleString('es-MX', { maximumFractionDigits: 0 })}/mes). Prioriza aumentar ingresos o reducir gastos.`;
                  }
                })()}
              />
            )}

            {netWorthEvolutionData.length > 0 && (
              <NetWorthEvolutionWidget 
                data={netWorthEvolutionData}
                insight={(() => {
                  if (netWorthEvolutionData.length < 2) return undefined;
                  
                  const first = netWorthEvolutionData[0];
                  const last = netWorthEvolutionData[netWorthEvolutionData.length - 1];
                  const growth = last.netWorth - first.netWorth;
                  const growthPercentage = first.netWorth !== 0 
                    ? ((growth / Math.abs(first.netWorth)) * 100) 
                    : 0;
                  
                  if (growth > 0) {
                    return `Tu patrimonio neto creció $${growth.toLocaleString('es-MX', { maximumFractionDigits: 0 })} (+${growthPercentage.toFixed(1)}%) desde ${first.month}. ¡Sigue así!`;
                  } else {
                    return `Tu patrimonio neto disminuyó $${Math.abs(growth).toLocaleString('es-MX', { maximumFractionDigits: 0 })} (${growthPercentage.toFixed(1)}%) desde ${first.month}. Revisa tus deudas y gastos.`;
                  }
                })()}
              />
            )}

            {weeklySpendingData.length > 0 && (
              <WeeklySpendingPatternWidget 
                data={weeklySpendingData}
                insight={(() => {
                  const maxDay = weeklySpendingData.reduce((max, d) => d.amount > max.amount ? d : max, weeklySpendingData[0]);
                  const minDay = weeklySpendingData.reduce((min, d) => d.amount < min.amount ? d : min, weeklySpendingData[0]);
                  const totalSpending = weeklySpendingData.reduce((sum, d) => sum + d.amount, 0);
                  const avgSpending = totalSpending / weeklySpendingData.filter(d => d.amount > 0).length;
                  
                  const weekendSpending = (weeklySpendingData.find(d => d.day === 'Sáb')?.amount || 0) + 
                                         (weeklySpendingData.find(d => d.day === 'Dom')?.amount || 0);
                  const weekdaySpending = weeklySpendingData
                    .filter(d => !['Sáb', 'Dom'].includes(d.day))
                    .reduce((sum, d) => sum + d.amount, 0);
                  
                  if (weekendSpending > weekdaySpending * 0.4) {
                    return `Gastas más en fines de semana ($${weekendSpending.toLocaleString('es-MX', { maximumFractionDigits: 0 })}). ${maxDay.day} es tu día más caro con $${maxDay.amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}.`;
                  } else {
                    return `Tu patrón es equilibrado. ${maxDay.day} es tu día de mayor gasto con $${maxDay.amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}, mientras que ${minDay.day} es el más bajo.`;
                  }
                })()}
              />
            )}
          </>
        ) : (
          <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center">
            <p className="text-muted-foreground">No hay datos disponibles para mostrar</p>
          </Card>
        )}
          </div>
        </div>
      )}
      <BottomNav />
    </>
  );
}