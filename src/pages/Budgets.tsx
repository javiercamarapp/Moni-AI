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
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">💰 Mis Presupuestos</h1>
          <Button
            variant="ghost"
            onClick={() => navigate('/budget-quiz')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {budgets.length === 0 ? (
          <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center animate-fade-in hover:scale-[1.02] active:scale-[0.98] transition-all">
            <div className="text-5xl mb-4 animate-pulse">📊</div>
            <p className="text-base font-semibold text-foreground mb-2">
              Crea tu Presupuesto Mensual
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Controla tus gastos por categoría y recibe alertas cuando te acerques al límite
            </p>
            <Button
              onClick={() => navigate('/budget-quiz')}
              className="bg-white/10 backdrop-blur-sm rounded-[20px] shadow-lg border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 transition-all text-primary font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Configurar Presupuestos
            </Button>
          </Card>
        ) : (
          <>
            {/* Resumen General */}
            <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all animate-fade-in">
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-xl">💰</div>
                  <p className="text-[11px] font-bold text-foreground">Resumen del Mes</p>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 backdrop-blur-sm rounded-[12px] p-2 border-2 border-white/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-[8px] text-muted-foreground font-medium">Presupuestado</span>
                      <p className="text-base font-bold text-primary">
                        ${(totalBudget / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-[12px] p-2 border-2 border-white/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      <span className="text-[8px] text-muted-foreground font-medium">Gastado</span>
                      <p className="text-base font-bold text-destructive">
                        ${(Object.values(currentExpenses).reduce((sum, val) => sum + val, 0) / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                </div>

                {/* Disponible para gastar */}
                <div className="bg-white/10 backdrop-blur-sm rounded-[12px] p-2 border-2 border-white/20 shadow-lg text-center">
                  <span className="text-[8px] text-muted-foreground font-medium">Disponible</span>
                  <p className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${Math.abs(remainingBudget).toLocaleString()}
                  </p>
                  <p className="text-[8px] text-muted-foreground">
                    {remainingBudget >= 0 ? 'para gastar' : 'sobre presupuesto'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Título de sección */}
            <div className="text-center space-y-1">
              <div className="text-3xl">📊</div>
              <p className="text-sm font-bold text-foreground">Presupuesto por Categoría</p>
              <p className="text-[10px] text-muted-foreground">Progreso del mes actual</p>
            </div>

            {/* Lista de Presupuestos */}
            <div className="space-y-2.5">
              {budgets.map((budget, index) => {
                const spent = currentExpenses[budget.category_id] || 0;
                const budgetAmount = Number(budget.monthly_budget);
                const percentUsed = (spent / budgetAmount) * 100;
                const remaining = budgetAmount - spent;
                const isWarning = percentUsed >= 80;
                const isCritical = percentUsed >= 100;

                return (
                  <Card 
                    key={budget.id} 
                    className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] active:scale-95 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 flex-1">
                          <span className="text-2xl">{getCategoryIcon(budget.category.name)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{budget.category.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ${spent.toLocaleString()} de ${budgetAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isWarning && (
                            <AlertCircle className={`h-4 w-4 ${isCritical ? 'text-destructive animate-pulse' : 'text-yellow-500'}`} />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Progress 
                          value={Math.min(percentUsed, 100)} 
                          className={`h-2 ${
                            isCritical ? 'bg-destructive/20' : 
                            isWarning ? 'bg-yellow-500/20' : 
                            'bg-muted'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold ${
                            isCritical ? 'text-destructive' : 
                            isWarning ? 'text-yellow-600' : 
                            'text-success'
                          }`}>
                            {percentUsed.toFixed(0)}% usado
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {percentUsed < 100 
                              ? `Quedan $${remaining.toLocaleString()}` 
                              : `Excedido $${Math.abs(remaining).toLocaleString()}`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Mensaje de estado */}
                      {isCritical && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-[10px] p-2 border-2 border-destructive/30 shadow-lg">
                          <p className="text-[10px] text-destructive font-semibold text-center leading-tight">
                            ⚠️ Has superado tu presupuesto
                          </p>
                        </div>
                      )}
                      {isWarning && !isCritical && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-[10px] p-2 border-2 border-yellow-500/30 shadow-lg">
                          <p className="text-[10px] text-yellow-700 font-semibold text-center leading-tight">
                            ⚡ Te estás acercando al límite
                          </p>
                        </div>
                      )}
                      {!isWarning && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-[10px] p-2 border-2 border-success/30 shadow-lg">
                          <p className="text-[10px] text-success font-semibold text-center leading-tight">
                            ✅ Vas muy bien
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
              <Card className="p-4 bg-white/10 backdrop-blur-sm rounded-[20px] shadow-xl border-2 border-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all animate-fade-in">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-yellow-900">
                      Atención a tus presupuestos
                    </p>
                    <p className="text-[10px] text-yellow-700 leading-tight">
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
