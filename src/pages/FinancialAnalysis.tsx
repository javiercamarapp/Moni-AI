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
  Calendar,
  AlertCircle,
  Zap,
  Activity,
  BarChart3
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';

const COLORS = ['#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#6366f1'];

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
    <div className="min-h-screen animated-wave-bg p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Análisis Financiero</h1>
            <p className="text-white/80">Coach financiero de clase mundial</p>
          </div>
          <Button
            onClick={loadAnalysis}
            disabled={loading}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/10 border border-white/30">
            <TabsTrigger value="month" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Este Mes
            </TabsTrigger>
            <TabsTrigger value="year" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Este Año
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {analysis && (
          <>
            {/* Score Moni Central */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-white">Score Moni</h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.metrics.scoreMoni / 100)}`}
                      className={`transition-all duration-1000 ${
                        analysis.metrics.scoreMoni >= 70 ? 'text-green-500' :
                        analysis.metrics.scoreMoni >= 40 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold text-white">{analysis.metrics.scoreMoni}</span>
                    <span className="text-xs text-white/70">/ 100</span>
                  </div>
                </div>
                <p className="text-sm text-white/80 mt-2">
                  {analysis.metrics.scoreMoni >= 70 ? '¡Excelente salud financiera!' :
                   analysis.metrics.scoreMoni >= 40 ? 'En buen camino, sigue mejorando' :
                   'Necesitas trabajar en tus finanzas'}
                </p>
              </div>
            </Card>

            {/* Indicadores de Liquidez y Estabilidad */}
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <Droplets className="h-5 w-5 text-blue-400" />
              Liquidez y Estabilidad
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Balance Mensual</span>
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <p className={`text-2xl font-bold ${analysis.metrics.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${analysis.metrics.balance.toLocaleString()}
                </p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Tasa de Ahorro</span>
                  <PiggyBank className="h-4 w-4 text-accent" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {analysis.metrics.savingsRate}%
                </p>
                <p className="text-xs text-white/60 mt-1">Ideal ≥ 20%</p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Liquidez Disponible</span>
                  <Droplets className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {analysis.metrics.liquidityMonths.toFixed(1)} meses
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {analysis.metrics.liquidityMonths >= 3 ? 'Excelente' : 'Aumenta tu fondo'}
                </p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Cash Flow</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-white">
                  ${analysis.metrics.cashFlowAccumulated.toLocaleString()}
                </p>
              </Card>
            </div>

            {/* Indicadores de Gastos */}
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <TrendingDown className="h-5 w-5 text-red-400" />
              Control de Gastos
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Gastos Fijos</span>
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  ${analysis.metrics.fixedExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {analysis.metrics.fixedExpensesPercentage.toFixed(1)}% del total
                </p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Gastos Variables</span>
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  ${analysis.metrics.variableExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {analysis.metrics.variableExpensesPercentage.toFixed(1)}% del total
                </p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Gasto Diario Promedio</span>
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  ${analysis.metrics.avgDailyExpense.toLocaleString()}
                </p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Compras Impulsivas</span>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  {analysis.metrics.impulsivePurchases}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Detectadas este periodo
                </p>
              </Card>
            </div>

            {/* Indicadores de Comportamiento */}
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-green-400" />
              Comportamiento y Metas
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Cumplimiento de Metas</span>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl font-semibold text-white">
                  {analysis.metrics.avgGoalCompletion}%
                </p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Consistencia</span>
                  <Activity className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  {analysis.metrics.consistencyScore}/100
                </p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Proyección Anual</span>
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  ${analysis.metrics.projectedAnnualSavings.toLocaleString()}
                </p>
                <p className="text-xs text-white/60 mt-1">Ahorro estimado</p>
              </Card>

              <Card className="p-4 bg-card/80 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Índice Consciente</span>
                  <PiggyBank className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-xl font-semibold text-white">
                  {analysis.metrics.mindfulSpendingIndex}/100
                </p>
              </Card>
            </div>

            {/* Radar Chart - Score Moni Components */}
            {analysis.metrics.scoreComponents && (
              <Card className="p-6 mb-6 bg-card/80 backdrop-blur border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-white">Componentes del Score Moni</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: 'Ahorro & Liquidez', value: analysis.metrics.scoreComponents.savingsAndLiquidity, fullMark: 30 },
                    { subject: 'Endeudamiento', value: analysis.metrics.scoreComponents.debt, fullMark: 20 },
                    { subject: 'Control', value: analysis.metrics.scoreComponents.control, fullMark: 20 },
                    { subject: 'Crecimiento', value: analysis.metrics.scoreComponents.growth, fullMark: 15 },
                    { subject: 'Comportamiento', value: analysis.metrics.scoreComponents.behavior, fullMark: 15 },
                  ]}>
                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fill: 'white' }} />
                    <Radar name="Tu Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Análisis de IA */}
            <Card className="p-6 mb-6 bg-card/80 backdrop-blur border-white/10">
              <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análisis de Moni AI
              </h3>
              <div className="prose prose-invert max-w-none text-white whitespace-pre-line">
                {analysis.analysis}
              </div>
            </Card>

            {/* Cash Flow Chart */}
            <Card className="p-6 mb-6 bg-card/80 backdrop-blur border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-white">Flujo de Efectivo Diario</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analysis.dailyCashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: 'white', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Spending by Category */}
            {analysis.topCategories && analysis.topCategories.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-card/80 backdrop-blur border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">Gastos por Categoría</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analysis.topCategories}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.percentage}%`}
                      >
                        {analysis.topCategories.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Projections */}
                <Card className="p-6 bg-card/80 backdrop-blur border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Proyecciones {analysis.projections.period}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: 'Ingresos', actual: analysis.metrics.totalIncome, proyectado: analysis.projections.income },
                      { name: 'Gastos', actual: analysis.metrics.totalExpenses, proyectado: analysis.projections.expenses },
                      { name: 'Balance', actual: analysis.metrics.balance, proyectado: analysis.projections.balance }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: 'white' }} />
                      <YAxis tick={{ fill: 'white' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                      <Legend />
                      <Bar dataKey="actual" fill="#8b5cf6" name="Actual" />
                      <Bar dataKey="proyectado" fill="#10b981" name="Proyectado" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-white/10 p-4 z-50">
          <div className="max-w-6xl mx-auto flex justify-around items-center">
            <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
              <Home className="h-6 w-6" />
              <span className="text-xs">Inicio</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white">
              <BarChart3 className="h-6 w-6" />
              <span className="text-xs">Análisis</span>
            </button>
            <button onClick={() => navigate("/new-goal")} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
              <Target className="h-6 w-6" />
              <span className="text-xs">Metas</span>
            </button>
            <button onClick={() => navigate("/chat")} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
              <MessageSquare className="h-6 w-6" />
              <span className="text-xs">Chat</span>
            </button>
            <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
              <User className="h-6 w-6" />
              <span className="text-xs">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}