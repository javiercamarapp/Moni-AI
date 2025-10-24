import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, AlertCircle, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface Budget {
  id: string;
  category_id: string;
  monthly_budget: number;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

export default function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBudgets();
    loadMonthlyData();
  }, []);

  const loadBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('category_budgets')
        .select(`
          id,
          category_id,
          monthly_budget,
          category:categories (
            id,
            name,
            color
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setBudgets(data || []);
      const total = (data || []).reduce((sum, b) => sum + Number(b.monthly_budget), 0);
      setTotalBudget(total);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Calcular ingresos del mes
      const { data: incomeData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'ingreso')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      const income = (incomeData || []).reduce((sum, t) => sum + Number(t.amount), 0);
      setMonthlyIncome(income);

      // Calcular gastos por categoría del mes
      const { data: expenseData } = await supabase
        .from('transactions')
        .select('amount, category_id, categories(id, name)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      const expensesByCategory: Record<string, number> = {};
      (expenseData || []).forEach(t => {
        if (t.category_id) {
          expensesByCategory[t.category_id] = (expensesByCategory[t.category_id] || 0) + Number(t.amount);
        }
      });

      setCurrentExpenses(expensesByCategory);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('category_budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;

      toast.success("Presupuesto eliminado");
      loadBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error("Error al eliminar presupuesto");
    }
  };

  const getCategoryIcon = (name: string) => {
    const icons: Record<string, string> = {
      'vivienda': '🏠',
      'transporte': '🚗',
      'alimentación': '🍽️',
      'servicios': '💡',
      'salud': '💊',
      'entretenimiento': '🎮',
      'ahorro': '💰',
      'mascotas': '🐾',
    };
    return icons[name.toLowerCase()] || '📊';
  };

  const percentageOfIncome = monthlyIncome > 0 ? (totalBudget / monthlyIncome) * 100 : 0;
  const remainingBudget = totalBudget - Object.values(currentExpenses).reduce((sum, val) => sum + val, 0);
  const savingsPercentage = monthlyIncome > 0 ? ((monthlyIncome - totalBudget) / monthlyIncome) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">💰 Mis Presupuestos</h1>
          <Button
            variant="ghost"
            onClick={() => navigate('/budget-quiz')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {budgets.length === 0 ? (
          <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-base font-semibold text-foreground mb-2">
              Crea tu Presupuesto Mensual
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Controla tus gastos por categoría y recibe alertas cuando te acerques al límite
            </p>
            <Button
              onClick={() => navigate('/budget-quiz')}
              className="bg-primary/10 rounded-[20px] shadow-lg border border-primary/20 hover:bg-primary/20 hover:scale-105 text-primary font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Configurar Presupuestos
            </Button>
          </Card>
        ) : (
          <>
            {/* Resumen General */}
            <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] transition-all">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Resumen del Mes</p>
                  <p className="text-xs text-muted-foreground">Tu salud financiera en tiempo real</p>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-success/5 rounded-xl p-3 border border-success/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-xs text-muted-foreground">Ingresos</span>
                    </div>
                    <p className="text-lg font-bold text-success">
                      ${(monthlyIncome / 1000).toFixed(0)}k
                    </p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Presupuesto</span>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      ${(totalBudget / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>

                {/* Barra de ahorro */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Meta de Ahorro</span>
                    <span className={`text-xs font-bold ${
                      savingsPercentage >= 20 ? 'text-success' : 
                      savingsPercentage >= 10 ? 'text-yellow-600' : 'text-destructive'
                    }`}>
                      {savingsPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(savingsPercentage, 100)} 
                    className="h-3"
                  />
                  <p className="text-[10px] text-center text-muted-foreground">
                    {savingsPercentage >= 20 
                      ? '¡Excelente! Estás ahorrando muy bien' 
                      : savingsPercentage >= 10
                      ? 'Buen trabajo, sigue así'
                      : 'Intenta ahorrar al menos el 10% de tus ingresos'
                    }
                  </p>
                </div>
              </div>
            </Card>

            {/* Título de sección */}
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Presupuesto por Categoría</p>
              <p className="text-xs text-muted-foreground">Progreso del mes actual</p>
            </div>

            {/* Lista de Presupuestos */}
            <div className="space-y-3">
              {budgets.map((budget) => {
                const spent = currentExpenses[budget.category_id] || 0;
                const budgetAmount = Number(budget.monthly_budget);
                const percentUsed = (spent / budgetAmount) * 100;
                const remaining = budgetAmount - spent;
                const isWarning = percentUsed >= 80;
                const isCritical = percentUsed >= 100;

                return (
                  <Card 
                    key={budget.id} 
                    className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{getCategoryIcon(budget.category.name)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{budget.category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ${spent.toLocaleString()} de ${budgetAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isWarning && (
                            <AlertCircle className={`h-4 w-4 ${isCritical ? 'text-destructive' : 'text-yellow-500'}`} />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Progress 
                          value={Math.min(percentUsed, 100)} 
                          className={`h-2.5 ${
                            isCritical ? 'bg-destructive/20' : 
                            isWarning ? 'bg-yellow-500/20' : 
                            'bg-muted'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${
                            isCritical ? 'text-destructive' : 
                            isWarning ? 'text-yellow-600' : 
                            'text-success'
                          }`}>
                            {percentUsed.toFixed(0)}% usado
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {percentUsed < 100 
                              ? `Quedan $${remaining.toLocaleString()}` 
                              : `Excedido $${Math.abs(remaining).toLocaleString()}`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Mensaje de estado */}
                      {isCritical && (
                        <div className="bg-destructive/10 rounded-lg p-2 border border-destructive/20">
                          <p className="text-xs text-destructive font-medium">
                            ⚠️ Has superado tu presupuesto. Considera reducir gastos en esta categoría.
                          </p>
                        </div>
                      )}
                      {isWarning && !isCritical && (
                        <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                          <p className="text-xs text-yellow-700 font-medium">
                            ⚡ Te estás acercando al límite. Controla tus gastos.
                          </p>
                        </div>
                      )}
                      {!isWarning && (
                        <div className="bg-success/10 rounded-lg p-2 border border-success/20">
                          <p className="text-xs text-success font-medium">
                            ✅ Vas muy bien. Sigue así.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Resumen de alertas */}
            {budgets.some(b => {
              const spent = currentExpenses[b.category_id] || 0;
              const percentage = (spent / Number(b.monthly_budget)) * 100;
              return percentage >= 80;
            }) && (
              <Card className="p-4 bg-yellow-50 rounded-[20px] shadow-xl border border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-yellow-900">
                      Atención a tus presupuestos
                    </p>
                    <p className="text-xs text-yellow-700">
                      {budgets.filter(b => {
                        const spent = currentExpenses[b.category_id] || 0;
                        const percentage = (spent / Number(b.monthly_budget)) * 100;
                        return percentage >= 80;
                      }).length} categoría(s) cerca o sobre el límite
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
