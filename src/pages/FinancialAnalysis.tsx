import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Home, Target, MessageSquare, User, RefreshCw, Droplets, AlertCircle, Zap, Activity, BarChart3, Shield, Trophy, Heart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import SafeToSpendWidget from "@/components/analysis/SafeToSpendWidget";
import TopActionsWidget from "@/components/analysis/TopActionsWidget";
import ScoreBreakdownWidget from "@/components/analysis/ScoreBreakdownWidget";
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
export default function FinancialAnalysis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("month");
  const [analysis, setAnalysis] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [futureEvents, setFutureEvents] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

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
      loadAnalysis();
      fetchTransactionsData();
    }
  }, [user, period]);
  const fetchTransactionsData = async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      // Fetch recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const {
        data: recentTx,
        error: recentError
      } = await supabase.from('transactions').select(`
          *,
          categories (name, color)
        `).eq('user_id', user.id).gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0]).order('transaction_date', {
        ascending: false
      }).limit(10);
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

      // Fetch ALL transactions (last 6 months) to detect patterns
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const {
        data: allTx,
        error: allError
      } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0]).order('transaction_date', {
        ascending: false
      });
      if (allError) throw allError;

      // AI analyzes patterns and predicts future payments
      const predicted = detectRecurringPayments(allTx || []);
      setFutureEvents(predicted);
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
      const normalizedDesc = tx.description.toLowerCase().replace(/\d+/g, '') // Remove numbers
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
      const sortedTxs = txs.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

      // Calculate average interval between transactions (in days)
      const intervals: number[] = [];
      for (let i = 1; i < sortedTxs.length; i++) {
        const daysDiff = Math.round((new Date(sortedTxs[i].transaction_date).getTime() - new Date(sortedTxs[i - 1].transaction_date).getTime()) / (1000 * 60 * 60 * 24));
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
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('financial-analysis', {
        body: {
          userId: user.id,
          period
        }
      });
      if (error) throw error;
      setAnalysis(data);
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      toast.error("No se pudo cargar el análisis");
    } finally {
      setLoading(false);
    }
  };
  if (loading && !analysis) {
    return <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="text-center">
          <img src="/moni-logo.png" alt="Moni Logo" className="w-[280px] max-w-[90vw] mx-auto animate-pulse" />
        </div>
      </div>;
  }
  return <div className="min-h-screen animated-wave-bg p-3 pb-20">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Análisis Financiero</h1>
            <p className="text-xs text-white/70">Tu salud financiera</p>
          </div>
          <div className="flex gap-2">
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="h-8 bg-white/10 border border-white/30">
                <TabsTrigger value="month" className="text-xs text-white data-[state=active]:bg-white data-[state=active]:text-black px-3">
                  Mes
                </TabsTrigger>
                <TabsTrigger value="year" className="text-xs text-white data-[state=active]:bg-white data-[state=active]:text-black px-3">
                  Año
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={loadAnalysis} disabled={loading} variant="outline" size="sm" className="h-8 bg-white/10 border-white/30 text-white hover:bg-white/20 hover-lift">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {analysis && <>
            {/* Score Moni - Compacto (resumen rápido) */}
            

            {/* 1. VALOR INMEDIATO */}
            {analysis.safeToSpend && <SafeToSpendWidget {...analysis.safeToSpend} />}

            {/* AI Coach Insights */}
            <AICoachInsightsWidget 
              monthlyIncome={analysis.metrics.monthlyIncome || 0}
              monthlyExpenses={analysis.metrics.monthlyExpenses || 0}
              fixedExpenses={analysis.metrics.fixedExpenses || 0}
              savingsGoals={0}
              balance={(analysis.metrics.monthlyIncome || 0) - (analysis.metrics.monthlyExpenses || 0)}
            />

            {/* Risk Indicators */}
            <RiskIndicatorsWidget hasIssues={(analysis.metrics.liquidityMonths || 0) < 3 || (analysis.metrics.financialBurden || 0) > 20 || analysis.metrics.scoreMoni < 70} indicators={[
        // Liquidity
        ...((analysis.metrics.liquidityMonths || 0) < 1.5 ? [{
          level: "critical" as const,
          message: `🔴 Liquidez crítica: ${(analysis.metrics.liquidityMonths || 0).toFixed(1)} meses de gasto cubierto.`
        }] : (analysis.metrics.liquidityMonths || 0) < 3 ? [{
          level: "warning" as const,
          message: `🟡 Liquidez baja: ${(analysis.metrics.liquidityMonths || 0).toFixed(1)} meses cubiertos (meta: 3m).`
        }] : []),
        // Financial burden
        ...((analysis.metrics.financialBurden || 0) > 30 ? [{
          level: "critical" as const,
          message: `🔴 Carga financiera al límite (${(analysis.metrics.financialBurden || 0).toFixed(0)}%).`
        }] : (analysis.metrics.financialBurden || 0) > 20 ? [{
          level: "warning" as const,
          message: `🟡 Carga de deuda moderada (${(analysis.metrics.financialBurden || 0).toFixed(0)}%).`
        }] : []),
        // Score
        ...(analysis.metrics.scoreMoni < 40 ? [{
          level: "critical" as const,
          message: `🔴 Score Moni crítico (${analysis.metrics.scoreMoni}/100). Requiere atención inmediata.`
        }] : analysis.metrics.scoreMoni < 70 ? [{
          level: "warning" as const,
          message: `🟡 Score Moni mejorable (${analysis.metrics.scoreMoni}/100). Hay oportunidades de mejora.`
        }] : []),
        // Savings rate
        ...(analysis.metrics.savingsRate < 10 ? [{
          level: "warning" as const,
          message: `🟡 Tasa de ahorro baja (${analysis.metrics.savingsRate}%). Meta recomendada: 20%.`
        }] : [])]} />

            {analysis.upcomingTransactions && <UpcomingTransactionsWidget {...analysis.upcomingTransactions} />}

            {analysis.topActions && analysis.topActions.length > 0 && <TopActionsWidget actions={analysis.topActions} />}

            {/* 2. EXPLICABILIDAD DEL SCORE */}
            {analysis.scoreBreakdown && <ScoreBreakdownWidget {...analysis.scoreBreakdown} />}

            {/* 3. PATRIMONIO Y RUNWAY */}
            {analysis.netWorth && <NetWorthWidget {...analysis.netWorth} />}

            {/* 4. PROYECCIONES CON ESCENARIOS */}
            {analysis.forecast && <ForecastWidget {...analysis.forecast} />}

            {/* 5. PRESUPUESTO VIVO */}
            {analysis.budgetProgress && analysis.budgetProgress.categories && <BudgetProgressWidget {...analysis.budgetProgress} />}

            {/* 6. DEUDA INTELIGENTE */}
            {analysis.debtPlan && analysis.debtPlan.debts && analysis.debtPlan.debts.length > 0 && <DebtPaymentPlanWidget {...analysis.debtPlan} />}

            {/* 7. SUSCRIPCIONES */}
            {analysis.subscriptions && analysis.subscriptions.subscriptions && analysis.subscriptions.subscriptions.length > 0 && <SubscriptionsWidget {...analysis.subscriptions} />}

            {/* Llamados a la Acción */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80">🎯 Acciones Recomendadas</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" size="sm" className="bg-gradient-card card-glow text-white border border-white/20 hover:bg-white/20 hover:text-white active:bg-white/30 active:text-white hover:scale-105 active:scale-95 transition-transform duration-200 text-xs h-auto py-2">
                  Ajustar presupuesto
                </Button>
                <Button variant="ghost" size="sm" className="bg-gradient-card card-glow text-white border border-white/20 hover:bg-white/20 hover:text-white active:bg-white/30 active:text-white hover:scale-105 active:scale-95 transition-transform duration-200 text-xs h-auto py-2">
                  Plan de deudas
                </Button>
                <Button variant="ghost" size="sm" className="bg-gradient-card card-glow text-white border border-white/20 hover:bg-white/20 hover:text-white active:bg-white/30 active:text-white hover:scale-105 active:scale-95 transition-transform duration-200 text-xs h-auto py-2">
                  ↑ Ahorro a 10%
                </Button>
                <Button variant="ghost" size="sm" className="bg-gradient-card card-glow text-white border border-white/20 hover:bg-white/20 hover:text-white active:bg-white/30 active:text-white hover:scale-105 active:scale-95 transition-transform duration-200 text-xs h-auto py-2">
                  Revisar subs
                </Button>
              </div>
            </div>

            {/* Liquidez - Grid Compacto Mejorado */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Liquidez y Estabilidad
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Balance</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-400" />
                      {analysis.metrics.balance >= 0 ? <span className="text-emerald-400 text-xs">↑</span> : <span className="text-red-400 text-xs">↓</span>}
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${analysis.metrics.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${formatK(analysis.metrics.balance)}k
                  </p>
                  <p className="text-[10px] text-white/60">MoM: +2.3%</p>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Ahorro</span>
                    <PiggyBank className="h-3 w-3 text-purple-400" />
                  </div>
                  <p className="text-lg font-bold text-purple-300">{analysis.metrics.savingsRate}%</p>
                  <p className="text-[10px] text-white/60">
                    meta: {analysis.metrics.liquidityMonths >= 3 ? '22%' : '20%'} 
                    {analysis.metrics.savingsRate >= 20 && ' 🎯'}
                  </p>
                </Card>

                <Card className={`p-3 card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200 ${(analysis.metrics.liquidityMonths || 0) >= 3 ? 'bg-gradient-to-br from-emerald-600/90 to-emerald-800/90' : (analysis.metrics.liquidityMonths || 0) >= 1.5 ? 'bg-gradient-to-br from-yellow-600/90 to-yellow-800/90' : 'bg-gradient-to-br from-red-600/90 to-red-800/90'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Liquidez</span>
                    <Droplets className={`h-3 w-3 ${(analysis.metrics.liquidityMonths || 0) >= 3 ? 'text-emerald-400' : (analysis.metrics.liquidityMonths || 0) >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`} />
                  </div>
                  <p className={`text-lg font-bold ${(analysis.metrics.liquidityMonths || 0) >= 3 ? 'text-emerald-300' : (analysis.metrics.liquidityMonths || 0) >= 1.5 ? 'text-yellow-300' : 'text-red-300'}`}>
                    {(analysis.metrics.liquidityMonths || 0).toFixed(1)} m
                  </p>
                  <p className="text-[10px] text-white/60">
                    {(analysis.metrics.liquidityMonths || 0) >= 3 ? '✅ Seguro' : (analysis.metrics.liquidityMonths || 0) >= 1.5 ? '⚠️ Regular' : '🚨 Crítico'}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Cash Flow</span>
                    <TrendingUp className="h-3 w-3 text-teal-400" />
                  </div>
                  <p className="text-lg font-bold text-teal-300">
                    ${formatK(analysis.metrics.cashFlowAccumulated)}k
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
                    ${formatK(analysis.metrics.fixedExpenses)}k
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">{(analysis.metrics.fixedExpensesPercentage || 0).toFixed(0)}% del gasto</span>
                    <span className="text-emerald-400">↓ -3%</span>
                  </div>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Variables</span>
                    <Zap className="h-3 w-3 text-violet-400" />
                  </div>
                  <p className="text-lg font-bold text-violet-300">
                    ${formatK(analysis.metrics.variableExpenses)}k
                  </p>
                  <p className="text-[10px] text-white/60">{(analysis.metrics.variableExpensesPercentage || 0).toFixed(0)}%</p>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Hormiga</span>
                    <span className="text-lg">🐜</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-300">
                    ${formatK(analysis.metrics.antExpenses)}k
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/60">{(analysis.metrics.antExpensesPercentage || 0).toFixed(1)}% ingreso</span>
                    <span className="text-yellow-400">↑ +5%</span>
                  </div>
                </Card>

                <Card className="p-3 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Impulsivos</span>
                    <AlertCircle className="h-3 w-3 text-rose-400" />
                  </div>
                  <p className="text-lg font-bold text-rose-300">{analysis.metrics.impulsivePurchases}</p>
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
              {analysis.metrics.totalDebt > 0 ? <>
                  <div className="grid grid-cols-4 gap-2">
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">Razón</span>
                      <p className="text-sm font-bold text-red-300">{(analysis.metrics.debtRatio || 0).toFixed(1)}%</p>
                    </Card>
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">Carga</span>
                      <p className="text-sm font-bold text-orange-300">{(analysis.metrics.financialBurden || 0).toFixed(1)}%</p>
                    </Card>
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">D/I</span>
                      <p className="text-sm font-bold text-yellow-300">{(analysis.metrics.debtToIncomeRatio || 0).toFixed(2)}</p>
                    </Card>
                    <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                      <span className="text-[10px] text-white/60">Int.</span>
                      <p className="text-sm font-bold text-rose-300">{(analysis.metrics.interestOnIncome || 0).toFixed(1)}%</p>
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
                  <p className="text-sm font-bold text-emerald-300">{(analysis.metrics.investmentRate || 0).toFixed(1)}%</p>
                  <span className="text-[9px] text-white/50">🟢 Bajo</span>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <span className="text-[10px] text-white/60">ROE</span>
                  <p className="text-sm font-bold text-teal-300">{(analysis.metrics.personalROE || 0).toFixed(1)}%</p>
                  <span className="text-[9px] text-white/50">12M</span>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <span className="text-[10px] text-white/60">Crec.</span>
                  <p className="text-sm font-bold text-green-300">{(analysis.metrics.equityGrowth || 0).toFixed(1)}%</p>
                  <span className="text-[9px] text-white/50">🟡 Med</span>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <span className="text-[10px] text-white/60">ROI</span>
                  <p className="text-sm font-bold text-lime-300">{(analysis.metrics.personalROI || 0).toFixed(1)}%</p>
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
                  <p className="text-sm font-bold text-indigo-300">{analysis.metrics.avgGoalCompletion}%</p>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Consist.</span>
                    <Activity className="h-3 w-3 text-lime-400" />
                  </div>
                  <p className="text-sm font-bold text-lime-300">{analysis.metrics.consistencyScore}</p>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Proy.</span>
                    <TrendingUp className="h-3 w-3 text-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-amber-300">${formatK(analysis.metrics.projectedAnnualSavings)}k</p>
                </Card>
                <Card className="p-2 bg-gradient-card card-glow border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/60">Bienestar</span>
                    <Heart className="h-3 w-3 text-pink-400" />
                  </div>
                  <p className="text-sm font-bold text-green-300">{analysis.metrics.mindfulSpendingIndex}</p>
                  <p className="text-[9px] text-white/50">Califícalo 1-10 →</p>
                </Card>
              </div>
            </div>

            {/* Microcopy Empático */}
            

            {/* Análisis AI */}
            <Card className="p-3 bg-gradient-card card-glow border-white/20">
              <p className="text-xs font-medium text-white/80 mb-2 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Análisis Moni AI
              </p>
              <div className="text-xs text-white/80 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                {analysis.analysis}
              </div>
            </Card>

            {/* Calendario de Próximos Movimientos */}
            {loadingTransactions ? <Card className="p-4 bg-gradient-card card-glow border-white/20">
                <div className="text-center text-white/60 py-4">Cargando pagos futuros...</div>
              </Card> : futureEvents.length > 0 ? <FutureCalendarWidget events={futureEvents} /> : <Card className="p-4 bg-gradient-card card-glow border-white/20">
                <div className="text-center text-white/60 py-4">
                  No hay pagos recurrentes configurados
                </div>
              </Card>}

            {/* Movimientos Recientes */}
            {loadingTransactions ? <Card className="p-4 bg-gradient-card card-glow border-white/20">
                <div className="text-center text-white/60 py-4">Cargando transacciones...</div>
              </Card> : recentTransactions.length > 0 ? <RecentMovementsWidget transactions={recentTransactions} /> : <Card className="p-4 bg-gradient-card card-glow border-white/20">
                <div className="text-center text-white/60 py-4">
                  No hay transacciones recientes
                </div>
              </Card>}

            {/* Gráficas adicionales */}
            <Card className="p-3 bg-gradient-card card-glow border-white/20">
              <p className="text-xs font-medium text-white/80 mb-2">Ingresos vs Gastos</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[{
              name: 'Ing',
              total: analysis.metrics.totalIncome
            }, {
              name: 'Gas',
              total: analysis.metrics.totalExpenses
            }, {
              name: 'Bal',
              total: Math.abs(analysis.metrics.balance)
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
                }].map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : analysis.metrics.balance >= 0 ? '#8b5cf6' : '#f59e0b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Historical Comparison */}
            <HistoricalComparisonWidget data={[{
          month: 'May',
          income: 15000,
          expenses: 12500,
          savings: 2500
        }, {
          month: 'Jun',
          income: 15500,
          expenses: 12400,
          savings: 3100
        }, {
          month: 'Jul',
          income: 16000,
          expenses: 12200,
          savings: 3800
        }, {
          month: 'Ago',
          income: 16200,
          expenses: 12000,
          savings: 4200
        }, {
          month: 'Sep',
          income: 16500,
          expenses: 11700,
          savings: 4800
        }, {
          month: 'Oct',
          income: 17000,
          expenses: 11800,
          savings: 5200
        }]} insight="Tu gasto promedio bajó $1,200 desde julio. Mantén la tendencia." />

            {/* Evolution Chart */}
            <EvolutionChartWidget data={[{
          month: 'May',
          score: 62,
          savings: 2.5,
          balance: 8.2,
          income: 15,
          expenses: 12
        }, {
          month: 'Jun',
          score: 65,
          savings: 3.1,
          balance: 11.3,
          income: 15.5,
          expenses: 11.8
        }, {
          month: 'Jul',
          score: 68,
          savings: 3.8,
          balance: 15.1,
          income: 16,
          expenses: 11.5
        }, {
          month: 'Ago',
          score: 70,
          savings: 4.2,
          balance: 19.3,
          income: 16.2,
          expenses: 11.2
        }, {
          month: 'Sep',
          score: 73,
          savings: 4.8,
          balance: 24.1,
          income: 16.5,
          expenses: 10.9
        }, {
          month: 'Oct',
          score: 75,
          savings: 5.2,
          balance: 29.3,
          income: 17,
          expenses: 10.8
        }]} insight="Tu ahorro promedio subió 12% en 3 meses, pero tu gasto fijo sigue alto. Ajustar renta o servicios podría darte +4 pts." />

            {/* Additional Financial Health Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <IncomeExpensePieWidget income={analysis.metrics.totalIncome} expenses={analysis.metrics.totalExpenses} />
              
              <FinancialHealthPieWidget savings={analysis.metrics.balance > 0 ? analysis.metrics.balance : 0} fixedExpenses={analysis.metrics.totalExpenses * 0.6} variableExpenses={analysis.metrics.totalExpenses * 0.4} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CategoryBreakdownWidget categories={[{
            name: 'Vivienda',
            value: analysis.metrics.totalExpenses * 0.3,
            color: '#8b5cf6'
          }, {
            name: 'Alimentación',
            value: analysis.metrics.totalExpenses * 0.25,
            color: '#ec4899'
          }, {
            name: 'Transporte',
            value: analysis.metrics.totalExpenses * 0.15,
            color: '#f59e0b'
          }, {
            name: 'Servicios',
            value: analysis.metrics.totalExpenses * 0.12,
            color: '#10b981'
          }, {
            name: 'Entretenimiento',
            value: analysis.metrics.totalExpenses * 0.10,
            color: '#3b82f6'
          }, {
            name: 'Otros',
            value: analysis.metrics.totalExpenses * 0.08,
            color: '#ef4444'
          }]} />
              
              <LiquidityGaugeWidget months={analysis.metrics.liquidityMonths || 0} currentBalance={analysis.metrics.balance} monthlyExpenses={analysis.metrics.totalExpenses} />
            </div>
          </>}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 animated-wave-bg border-t border-white/20 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10 hover-lift" onClick={() => navigate("/dashboard")}>
              <Home className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Home</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-purple-400 hover:bg-white/10 hover-lift" onClick={() => navigate("/analysis")}>
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-400">Análisis</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10 hover-lift" onClick={() => navigate("/goals")}>
              <Target className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Metas</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10 hover-lift" onClick={() => navigate("/chat")}>
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Chat AI</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10 hover-lift" onClick={() => navigate("/profile")}>
              <User className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Perfil</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>;
}