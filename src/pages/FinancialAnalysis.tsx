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
              <Droplets className="h-5 w-5 text-cyan-400" />
              Liquidez y Estabilidad
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur border-emerald-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Balance Mensual</span>
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <p className={`text-2xl font-bold ${analysis.metrics.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${analysis.metrics.balance.toLocaleString()}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur border-purple-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Tasa de Ahorro</span>
                  <PiggyBank className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-300">
                  {analysis.metrics.savingsRate}%
                </p>
                <p className="text-xs text-white/70 mt-1">Ideal ≥ 20%</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur border-cyan-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Liquidez Disponible</span>
                  <Droplets className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-cyan-300">
                  {(analysis.metrics.liquidityMonths || 0).toFixed(1)} meses
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {(analysis.metrics.liquidityMonths || 0) >= 3 ? '✅ Excelente' : '⚠️ Aumenta tu fondo'}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-teal-500/20 to-teal-600/10 backdrop-blur border-teal-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Cash Flow</span>
                  <TrendingUp className="h-5 w-5 text-teal-400" />
                </div>
                <p className="text-2xl font-bold text-teal-300">
                  ${analysis.metrics.cashFlowAccumulated.toLocaleString()}
                </p>
              </Card>
            </div>

            {/* Indicadores de Gastos */}
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <TrendingDown className="h-5 w-5 text-rose-400" />
              Control de Gastos
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur border-orange-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Gastos Fijos</span>
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <p className="text-xl font-semibold text-orange-300">
                  ${analysis.metrics.fixedExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {(analysis.metrics.fixedExpensesPercentage || 0).toFixed(1)}% del total
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-violet-500/20 to-violet-600/10 backdrop-blur border-violet-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Gastos Variables</span>
                  <Zap className="h-5 w-5 text-violet-400" />
                </div>
                <p className="text-xl font-semibold text-violet-300">
                  ${analysis.metrics.variableExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {(analysis.metrics.variableExpensesPercentage || 0).toFixed(1)}% del total
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-sky-500/20 to-sky-600/10 backdrop-blur border-sky-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Gasto Diario Promedio</span>
                  <Calendar className="h-5 w-5 text-sky-400" />
                </div>
                <p className="text-xl font-semibold text-sky-300">
                  ${analysis.metrics.avgDailyExpense.toLocaleString()}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-rose-500/20 to-rose-600/10 backdrop-blur border-rose-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Compras Impulsivas</span>
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                </div>
                <p className="text-xl font-semibold text-rose-300">
                  {analysis.metrics.impulsivePurchases}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  Detectadas este periodo
                </p>
              </Card>
            </div>

            {/* Indicadores de Comportamiento */}
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-lime-400" />
              Comportamiento y Metas
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 backdrop-blur border-indigo-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Cumplimiento de Metas</span>
                  <Target className="h-5 w-5 text-indigo-400" />
                </div>
                <p className="text-xl font-semibold text-indigo-300">
                  {analysis.metrics.avgGoalCompletion}%
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-lime-500/20 to-lime-600/10 backdrop-blur border-lime-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Consistencia</span>
                  <Activity className="h-5 w-5 text-lime-400" />
                </div>
                <p className="text-xl font-semibold text-lime-300">
                  {analysis.metrics.consistencyScore}/100
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur border-amber-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Proyección Anual</span>
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-xl font-semibold text-amber-300">
                  ${analysis.metrics.projectedAnnualSavings.toLocaleString()}
                </p>
                <p className="text-xs text-white/70 mt-1">Ahorro estimado</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur border-green-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Índice Consciente</span>
                  <PiggyBank className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-xl font-semibold text-green-300">
                  {analysis.metrics.mindfulSpendingIndex}/100
                </p>
              </Card>
            </div>

            {/* Nueva Gráfica: Comparativa Ingresos vs Gastos Mensuales */}
            <Card className="p-6 mb-6 bg-card/80 backdrop-blur border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Comparativa Ingresos vs Gastos
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Ingresos', total: analysis.metrics.totalIncome, color: '#10b981' },
                  { name: 'Gastos', total: analysis.metrics.totalExpenses, color: '#ef4444' },
                  { name: 'Balance', total: Math.abs(analysis.metrics.balance), color: analysis.metrics.balance >= 0 ? '#8b5cf6' : '#f59e0b' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: 'white' }} />
                  <YAxis tick={{ fill: 'white' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {[
                      { name: 'Ingresos', total: analysis.metrics.totalIncome },
                      { name: 'Gastos', total: analysis.metrics.totalExpenses },
                      { name: 'Balance', total: Math.abs(analysis.metrics.balance) }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : analysis.metrics.balance >= 0 ? '#8b5cf6' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Nueva Gráfica: Distribución Gastos Fijos vs Variables */}
            <Card className="p-6 mb-6 bg-card/80 backdrop-blur border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-violet-400" />
                Distribución: Fijos vs Variables
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Gastos Fijos', value: analysis.metrics.fixedExpenses || 0 },
                      { name: 'Gastos Variables', value: analysis.metrics.variableExpenses || 0 }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                  >
                    <Cell fill="#f97316" />
                    <Cell fill="#a855f7" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-white/80">
                  {(analysis.metrics.fixedExpensesPercentage || 0) > 60 
                    ? '⚠️ Tus gastos fijos son altos. Considera renegociar servicios.'
                    : '✅ Buena distribución de gastos fijos y variables.'}
                </p>
              </div>
            </Card>

            {/* Radar Chart - Score Moni Components */}
            {analysis.metrics.scoreComponents && (
              <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur border-purple-400/30">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Componentes del Score Moni
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: 'Ahorro & Liquidez', value: analysis.metrics.scoreComponents.savingsAndLiquidity, fullMark: 30 },
                    { subject: 'Endeudamiento', value: analysis.metrics.scoreComponents.debt, fullMark: 20 },
                    { subject: 'Control', value: analysis.metrics.scoreComponents.control, fullMark: 20 },
                    { subject: 'Crecimiento', value: analysis.metrics.scoreComponents.growth, fullMark: 15 },
                    { subject: 'Comportamiento', value: analysis.metrics.scoreComponents.behavior, fullMark: 15 },
                  ]}>
                    <PolarGrid stroke="rgba(255,255,255,0.3)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                    <Radar name="Tu Score" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.7} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    <span>Puntaje actual por dimensión</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Análisis de IA */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur border-cyan-400/30">
              <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                Análisis de Moni AI
              </h3>
              <div className="prose prose-invert max-w-none text-white/90 whitespace-pre-line leading-relaxed">
                {analysis.analysis}
              </div>
            </Card>

            {/* Sugerencia Especial de Moni */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur border-pink-400/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-3 text-white flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  Sugerencia Moni del {period === 'month' ? 'Mes' : 'Año'}
                </h3>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <p className="text-white/95 text-base leading-relaxed">
                    {analysis.metrics.savingsRate < 10 
                      ? "🎯 Empieza pequeño: Intenta guardar al menos el 10% de cada ingreso. Automatiza una transferencia a una cuenta de ahorros apenas recibas tu sueldo - ¡no lo verás y no lo extrañarás!"
                      : analysis.metrics.savingsRate < 20
                      ? "🚀 ¡Vas por buen camino! Considera el método 50/30/20: 50% necesidades, 30% gustos, 20% ahorros. Estás cerca de lograr ese equilibrio perfecto."
                      : analysis.metrics.impulsivePurchases > 3
                      ? "🛍️ Detecté algunos gastos impulsivos. Prueba la regla de las 24 horas: espera un día antes de compras no planificadas mayores a $500. Te sorprenderá cuánto ahorrarás."
                      : (analysis.metrics.fixedExpensesPercentage || 0) > 60
                      ? "📱 Tus gastos fijos están altos. Revisa suscripciones que no uses, renegocia tu plan de celular o internet. Pequeños recortes mensuales = grandes ahorros anuales."
                      : analysis.metrics.liquidityMonths < 3
                      ? "🏦 Prioridad: Construye tu fondo de emergencia. Objetivo: 3-6 meses de gastos. Empieza con $500 y aumenta $200 cada mes. Tu yo del futuro te lo agradecerá."
                      : "🌟 ¡Excelente trabajo! Tu salud financiera es sólida. Considera diversificar: invierte ese excedente en un CETE, fondo de inversión o educación financiera. Haz que tu dinero trabaje para ti."}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cash Flow Chart */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 backdrop-blur border-teal-400/30">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-400" />
                Flujo de Efectivo Diario (Últimos 14 días)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analysis.dailyCashFlow}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.8)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(20,184,166,0.5)', borderRadius: '8px' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#14b8a6" 
                    strokeWidth={3}
                    dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    fill="url(#colorAmount)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Spending by Category */}
            {analysis.topCategories && analysis.topCategories.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 backdrop-blur border-fuchsia-400/30">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-fuchsia-400" />
                    Top 5 Gastos por Categoría
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={analysis.topCategories}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        label={(entry) => `${entry.percentage}%`}
                        labelLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                      >
                        {analysis.topCategories.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {analysis.topCategories.slice(0, 3).map((cat: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-white/90">{cat.name}</span>
                        </div>
                        <span className="text-white/70 font-semibold">${Number(cat.total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Projections */}
                <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur border-emerald-400/30">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    Proyecciones {analysis.projections.period}
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={[
                      { name: 'Ingresos', actual: analysis.metrics.totalIncome, proyectado: analysis.projections.income },
                      { name: 'Gastos', actual: analysis.metrics.totalExpenses, proyectado: analysis.projections.expenses },
                      { name: 'Balance', actual: analysis.metrics.balance, proyectado: analysis.projections.balance }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.9)' }} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.9)' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)', 
                          border: '1px solid rgba(16,185,129,0.5)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend wrapperStyle={{ color: 'white' }} />
                      <Bar dataKey="actual" fill="#8b5cf6" name="Actual" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="proyectado" fill="#10b981" name="Proyectado" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-white/80 italic">
                      📊 Si continúas con tus hábitos actuales
                    </p>
                  </div>
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