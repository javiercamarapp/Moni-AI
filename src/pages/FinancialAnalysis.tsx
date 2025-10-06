import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank,
  Home,
  Target,
  MessageSquare,
  User,
  RefreshCw,
  Droplets,
  AlertCircle,
  Zap,
  Activity,
  BarChart3,
  Shield,
  Trophy,
  Heart
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import SafeToSpendWidget from "@/components/analysis/SafeToSpendWidget";
import TopActionsWidget from "@/components/analysis/TopActionsWidget";
import ScoreBreakdownWidget from "@/components/analysis/ScoreBreakdownWidget";
import NetWorthWidget from "@/components/analysis/NetWorthWidget";
import ForecastWidget from "@/components/analysis/ForecastWidget";
import BudgetProgressWidget from "@/components/analysis/BudgetProgressWidget";
import DebtPaymentPlanWidget from "@/components/analysis/DebtPaymentPlanWidget";
import SubscriptionsWidget from "@/components/analysis/SubscriptionsWidget";
import UpcomingTransactionsWidget from "@/components/analysis/UpcomingTransactionsWidget";

export default function FinancialAnalysis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("month");
  const [analysis, setAnalysis] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnalysis();
    }
  }, [user, period]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-analysis', {
        body: { userId: user.id, period }
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
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/moni-logo.png" 
            alt="Moni Logo" 
            className="w-[280px] max-w-[90vw] mx-auto animate-pulse" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg p-3 pb-20">
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
            <Button
              onClick={loadAnalysis}
              disabled={loading}
              variant="outline"
              size="sm"
              className="h-8 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {analysis && (
          <>
            {/* Score Moni - Compacto */}
            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 mb-1">Score Moni</p>
                  <p className="text-3xl font-bold text-white">{analysis.metrics.scoreMoni}<span className="text-sm text-white/60">/100</span></p>
                  <p className="text-xs text-white/70 mt-1">
                    {analysis.metrics.scoreMoni >= 70 ? '✅ Excelente' :
                     analysis.metrics.scoreMoni >= 40 ? '⚠️ Mejorable' : '❌ Crítico'}
                  </p>
                </div>
                <div className="relative">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/20" />
                    <circle
                      cx="40" cy="40" r="34"
                      stroke="currentColor" strokeWidth="6" fill="none"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - analysis.metrics.scoreMoni / 100)}`}
                      className={`transition-all ${
                        analysis.metrics.scoreMoni >= 70 ? 'text-emerald-400' :
                        analysis.metrics.scoreMoni >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Liquidez - Grid Compacto */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Liquidez y Estabilidad
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Balance</span>
                    <DollarSign className="h-3 w-3 text-emerald-400" />
                  </div>
                  <p className={`text-lg font-bold ${analysis.metrics.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${(analysis.metrics.balance/1000).toFixed(1)}k
                  </p>
                </Card>

                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Ahorro</span>
                    <PiggyBank className="h-3 w-3 text-purple-400" />
                  </div>
                  <p className="text-lg font-bold text-purple-300">{analysis.metrics.savingsRate}%</p>
                  <p className="text-[10px] text-white/60">meta: 20%</p>
                </Card>

                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Liquidez</span>
                    <Droplets className="h-3 w-3 text-cyan-400" />
                  </div>
                  <p className="text-lg font-bold text-cyan-300">
                    {(analysis.metrics.liquidityMonths || 0).toFixed(1)} m
                  </p>
                  <p className="text-[10px] text-white/60">
                    {(analysis.metrics.liquidityMonths || 0) >= 3 ? '✅ ok' : '⚠️ bajo'}
                  </p>
                </Card>

                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Cash Flow</span>
                    <TrendingUp className="h-3 w-3 text-teal-400" />
                  </div>
                  <p className="text-lg font-bold text-teal-300">
                    ${(analysis.metrics.cashFlowAccumulated/1000).toFixed(1)}k
                  </p>
                </Card>
              </div>
            </div>

            {/* Control de Gastos - Compacto */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Control de Gastos
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Fijos</span>
                    <AlertCircle className="h-3 w-3 text-orange-400" />
                  </div>
                  <p className="text-lg font-bold text-orange-300">
                    ${(analysis.metrics.fixedExpenses/1000).toFixed(1)}k
                  </p>
                  <p className="text-[10px] text-white/60">{(analysis.metrics.fixedExpensesPercentage || 0).toFixed(0)}%</p>
                </Card>

                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Variables</span>
                    <Zap className="h-3 w-3 text-violet-400" />
                  </div>
                  <p className="text-lg font-bold text-violet-300">
                    ${(analysis.metrics.variableExpenses/1000).toFixed(1)}k
                  </p>
                  <p className="text-[10px] text-white/60">{(analysis.metrics.variableExpensesPercentage || 0).toFixed(0)}%</p>
                </Card>

                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Hormiga</span>
                    <span className="text-lg">🐜</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-300">
                    ${(analysis.metrics.antExpenses/1000).toFixed(1)}k
                  </p>
                  <p className="text-[10px] text-white/60">{(analysis.metrics.antExpensesPercentage || 0).toFixed(1)}%</p>
                </Card>

                <Card className="p-3 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Impulsivos</span>
                    <AlertCircle className="h-3 w-3 text-rose-400" />
                  </div>
                  <p className="text-lg font-bold text-rose-300">{analysis.metrics.impulsivePurchases}</p>
                  <p className="text-[10px] text-white/60">este periodo</p>
                </Card>
              </div>
            </div>

            {/* Endeudamiento */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Endeudamiento
              </p>
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">Razón</span>
                  <p className="text-sm font-bold text-red-300">{(analysis.metrics.debtRatio || 0).toFixed(1)}%</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">Carga</span>
                  <p className="text-sm font-bold text-orange-300">{(analysis.metrics.financialBurden || 0).toFixed(1)}%</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">D/I</span>
                  <p className="text-sm font-bold text-yellow-300">{(analysis.metrics.debtToIncomeRatio || 0).toFixed(2)}</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">Int.</span>
                  <p className="text-sm font-bold text-rose-300">{(analysis.metrics.interestOnIncome || 0).toFixed(1)}%</p>
                </Card>
              </div>
            </div>

            {/* Inversión y Rentabilidad */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Inversión & Rentabilidad
              </p>
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">Inv.</span>
                  <p className="text-sm font-bold text-emerald-300">{(analysis.metrics.investmentRate || 0).toFixed(1)}%</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">ROE</span>
                  <p className="text-sm font-bold text-teal-300">{(analysis.metrics.personalROE || 0).toFixed(1)}%</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">Crec.</span>
                  <p className="text-sm font-bold text-green-300">{(analysis.metrics.equityGrowth || 0).toFixed(1)}%</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <span className="text-[10px] text-white/60">ROI</span>
                  <p className="text-sm font-bold text-lime-300">{(analysis.metrics.personalROI || 0).toFixed(1)}%</p>
                </Card>
              </div>
            </div>

            {/* Estabilidad y Metas */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/80 flex items-center gap-1">
                <Target className="h-3 w-3" /> Estabilidad & Metas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Metas</span>
                    <Trophy className="h-3 w-3 text-yellow-400" />
                  </div>
                  <p className="text-sm font-bold text-indigo-300">{analysis.metrics.avgGoalCompletion}%</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Consist.</span>
                    <Activity className="h-3 w-3 text-lime-400" />
                  </div>
                  <p className="text-sm font-bold text-lime-300">{analysis.metrics.consistencyScore}</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Proy.</span>
                    <TrendingUp className="h-3 w-3 text-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-amber-300">${(analysis.metrics.projectedAnnualSavings/1000).toFixed(1)}k</p>
                </Card>
                <Card className="p-2 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">Bienestar</span>
                    <Heart className="h-3 w-3 text-pink-400" />
                  </div>
                  <p className="text-sm font-bold text-green-300">{analysis.metrics.mindfulSpendingIndex}</p>
                </Card>
              </div>
            </div>

            {/* Análisis AI */}
            <Card className="p-3 bg-white/5 backdrop-blur border-white/20">
              <p className="text-xs font-medium text-white/80 mb-2 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Análisis Moni AI
              </p>
              <div className="text-xs text-white/80 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                {analysis.analysis}
              </div>
            </Card>

            {/* Gráficas adicionales */}
            <Card className="p-3 bg-white/5 backdrop-blur border-white/20">
              <p className="text-xs font-medium text-white/80 mb-2">Ingresos vs Gastos</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { name: 'Ing', total: analysis.metrics.totalIncome },
                  { name: 'Gas', total: analysis.metrics.totalExpenses },
                  { name: 'Bal', total: Math.abs(analysis.metrics.balance) }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'white', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'white', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {[{ v: 1 }, { v: 2 }, { v: 3 }].map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : analysis.metrics.balance >= 0 ? '#8b5cf6' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 animated-wave-bg border-t border-white/20 shadow-lg">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/dashboard")}>
              <Home className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Home</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-purple-400 hover:bg-white/10" onClick={() => navigate("/analysis")}>
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-400">Análisis</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/goals")}>
              <Target className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Metas</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/chat")}>
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Chat AI</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/profile")}>
              <User className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Perfil</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}
