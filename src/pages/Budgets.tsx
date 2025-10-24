import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 90) return { color: 'text-red-600', status: '⚠️ Excedido' };
    if (percentage >= 75) return { color: 'text-yellow-600', status: '⚡ Cuidado' };
    return { color: 'text-green-600', status: '✅ Bien' };
  };

  const percentageOfIncome = monthlyIncome > 0 ? (totalBudget / monthlyIncome) * 100 : 0;

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

        {/* Resumen General */}
        <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-sm font-bold text-foreground">Resumen Mensual</h2>
              <p className="text-[10px] text-muted-foreground">
                Ingreso: ${monthlyIncome.toLocaleString()} • Presupuesto Total: ${totalBudget.toLocaleString()}
              </p>
            </div>

            {/* Barra de presupuesto global */}
            <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100">
              <div className="relative h-5 bg-gradient-to-r from-[hsl(220,60%,10%)] to-[hsl(240,55%,8%)] rounded-full border border-white/10 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentageOfIncome > 100 
                      ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600' 
                      : percentageOfIncome > 75
                      ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500'
                      : 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500'
                  }`}
                  style={{ 
                    width: `${Math.min(percentageOfIncome, 100)}%`,
                    boxShadow: percentageOfIncome > 100
                      ? '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
                      : percentageOfIncome > 75
                      ? '0 0 20px rgba(251, 191, 36, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
                      : '0 0 20px rgba(4, 120, 87, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white drop-shadow-lg">
                    Ahorrando: {Math.max(0, 100 - percentageOfIncome).toFixed(0)}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {/* Lista de Presupuestos por Categoría */}
        <div className="space-y-3">
          {budgets.length === 0 ? (
            <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No tienes presupuestos configurados
              </p>
              <Button
                onClick={() => navigate('/budget-quiz')}
                className="bg-white rounded-[20px] shadow-xl hover:shadow-2xl border border-blue-100 hover:border-primary/50 text-foreground font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Presupuesto
              </Button>
            </Card>
          ) : (
            budgets.map((budget) => {
              const spent = currentExpenses[budget.category_id] || 0;
              const percentage = (spent / Number(budget.monthly_budget)) * 100;
              const status = getBudgetStatus(spent, Number(budget.monthly_budget));

              return (
                <Card key={budget.id} className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-foreground">{budget.category.name}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          ${spent.toLocaleString()} de ${Number(budget.monthly_budget).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${status.color}`}>
                          {percentage.toFixed(0)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBudget(budget.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="relative h-3 bg-gradient-to-r from-[hsl(220,60%,10%)] to-[hsl(240,55%,8%)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 90 
                            ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600' 
                            : percentage >= 75
                            ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500'
                            : 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500'
                        }`}
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          boxShadow: percentage >= 90
                            ? '0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)'
                            : percentage >= 75
                            ? '0 0 15px rgba(251, 191, 36, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)'
                            : '0 0 15px rgba(4, 120, 87, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    </div>

                    <p className={`text-[10px] font-semibold text-center ${status.color}`}>
                      {status.status}
                    </p>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
