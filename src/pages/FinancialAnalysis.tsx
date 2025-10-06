import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function FinancialAnalysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({
        title: "Error",
        description: "No se pudo cargar el análisis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analysis) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Generando análisis con IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-foreground hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Análisis Financiero</h1>
              <p className="text-muted-foreground">Insights generados por IA</p>
            </div>
          </div>
          <Button
            onClick={loadAnalysis}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="month">Este Mes</TabsTrigger>
            <TabsTrigger value="year">Este Año</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-6 mt-6">
            {analysis && (
              <>
                {/* Score Moni - Prominente */}
                <Card className="p-8 bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur border-primary/30">
                  <div className="text-center space-y-4">
                    <h2 className="text-xl font-bold text-foreground">Tu Salud Financiera</h2>
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted/20"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${((analysis.metrics.scoreMoni || 0) / 100) * 351.86} 351.86`}
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-foreground">{analysis.metrics.scoreMoni || 0}</span>
                        <span className="text-sm text-muted-foreground">Score Moni</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {(analysis.metrics.scoreMoni || 0) >= 80 ? "¡Excelente! Tus finanzas respiran muy bien 🌿" :
                       (analysis.metrics.scoreMoni || 0) >= 60 ? "Buen progreso, sigue así 💪" :
                       (analysis.metrics.scoreMoni || 0) >= 40 ? "Hay oportunidad de mejora 📈" :
                       "Comencemos a construir mejores hábitos juntos 🚀"}
                    </p>
                  </div>
                </Card>

                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                        <p className="text-2xl font-bold text-primary">
                          ${(analysis.metrics.totalIngresos || 0).toFixed(2)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Gastos</p>
                        <p className="text-2xl font-bold text-destructive">
                          ${(analysis.metrics.totalGastos || 0).toFixed(2)}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-destructive" />
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className={`text-2xl font-bold ${(analysis.metrics.balance || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          ${(analysis.metrics.balance || 0).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-foreground" />
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa Ahorro</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analysis.metrics.tasaAhorro || 0}%
                        </p>
                      </div>
                      <div className="text-4xl">💰</div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ratio Liquidez</p>
                        <p className="text-2xl font-bold text-foreground">
                          {(analysis.metrics.ratioLiquidez || 0).toFixed(1)}x
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(analysis.metrics.ratioLiquidez || 0) >= 3 ? "¡Muy saludable!" :
                           (analysis.metrics.ratioLiquidez || 0) >= 1 ? "Aceptable" : "Necesita atención"}
                        </p>
                      </div>
                      <div className="text-4xl">💧</div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Mindful Index</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analysis.metrics.mindfulIndex || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Gastos conscientes
                        </p>
                      </div>
                      <div className="text-4xl">🧠</div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ahorro Anual</p>
                        <p className="text-2xl font-bold text-primary">
                          ${(analysis.metrics.ahorroProyectadoAnual || 0).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Proyección
                        </p>
                      </div>
                      <div className="text-4xl">🎯</div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Recurrentes</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analysis.metrics.gastosRecurrentes || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Gastos fijos
                        </p>
                      </div>
                      <div className="text-4xl">🔄</div>
                    </div>
                  </Card>
                </div>

                {/* Análisis de IA */}
                <Card className="p-8 bg-card/80 backdrop-blur border-border/50">
                  <h2 className="text-2xl font-bold mb-4 text-foreground">
                    📊 Análisis de Moni AI
                  </h2>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line">
                    {analysis.analysis}
                  </div>
                </Card>

                {/* Gráficas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 col-span-full">
                  {/* Cash Flow Diario */}
                  {analysis.cashFlow && analysis.cashFlow.length > 0 && (
                    <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                      <h3 className="text-xl font-bold mb-4 text-foreground">
                        💸 Cash Flow Diario
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analysis.cashFlow}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="fecha" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="ingresos" 
                            stroke="hsl(var(--primary))" 
                            name="Ingresos"
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="gastos" 
                            stroke="hsl(var(--destructive))" 
                            name="Gastos"
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="hsl(var(--secondary))" 
                            name="Balance"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {/* Gráfica de categorías */}
                  {analysis.topCategories && analysis.topCategories.length > 0 && (
                    <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                      <h3 className="text-xl font-bold mb-4 text-foreground">
                        Gastos por Categoría
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analysis.topCategories}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(entry) => `${entry.name}: ${entry.percentage}%`}
                          >
                            {analysis.topCategories.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {/* Proyecciones */}
                  {analysis.projections && (
                    <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                      <h3 className="text-xl font-bold mb-4 text-foreground">
                        Proyecciones {analysis.projections.period || 'Mensual'}
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Ingresos', actual: analysis.metrics.totalIngresos || 0, proyectado: analysis.projections.ingresos || 0 },
                          { name: 'Gastos', actual: analysis.metrics.totalGastos || 0, proyectado: analysis.projections.gastos || 0 },
                          { name: 'Balance', actual: analysis.metrics.balance || 0, proyectado: analysis.projections.balance || 0 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual" />
                          <Bar dataKey="proyectado" fill="hsl(var(--secondary))" name="Proyectado" />
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Si continúas con tus hábitos actuales
                      </p>
                    </Card>
                  )}
                </div>

                {/* Top categorías como lista */}
                {analysis.topCategories && analysis.topCategories.length > 0 && (
                  <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
                    <h3 className="text-xl font-bold mb-4 text-foreground">
                      Top 5 Categorías de Gasto
                    </h3>
                    <div className="space-y-3">
                      {analysis.topCategories.map((cat: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-foreground">{cat.name || 'Sin categoría'}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">${(cat.amount || 0).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">{cat.percentage || 0}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
