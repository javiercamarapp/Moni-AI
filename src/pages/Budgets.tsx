import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Pencil, AlertCircle, TrendingUp, Target } from "lucide-react";
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
  const [loadingMonthlyData, setLoadingMonthlyData] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState<Record<string, number>>({});
  const [isCategorizingExisting, setIsCategorizingExisting] = useState(false);
  const [hasUnidentifiedExpenses, setHasUnidentifiedExpenses] = useState(false);
  const [isRecategorizing, setIsRecategorizing] = useState(false);

  useEffect(() => {
    checkBudgetQuizStatus();
  }, []);

  const checkBudgetQuizStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Verificar si el usuario ha completado el quiz de presupuesto
      const { data: profile } = await supabase
        .from('profiles')
        .select('budget_quiz_completed')
        .eq('id', user.id)
        .single();

      // Si no ha completado el quiz, verificar si tiene presupuestos
      if (!profile?.budget_quiz_completed) {
        const { data: existingBudgets } = await supabase
          .from('category_budgets')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Si no tiene presupuestos, redirigir al quiz
        if (!existingBudgets || existingBudgets.length === 0) {
          navigate('/budget-quiz');
          return;
        }
      }

      // Cargar presupuestos normalmente
      loadBudgets();
    } catch (error) {
      console.error('Error checking budget quiz status:', error);
      loadBudgets();
    }
  };

  useEffect(() => {
    if (budgets.length > 0) {
      loadMonthlyData();
    }
  }, [budgets]);

  const loadBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Cargar solo las categorías principales (sin parent_id)
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('user_id', user.id)
        .is('parent_id', null);

      if (catError) throw catError;

      // Para cada categoría principal, obtener su presupuesto
      const budgetPromises = (categories || []).map(async (category) => {
        const { data: budget } = await supabase
          .from('category_budgets')
          .select('id, monthly_budget')
          .eq('user_id', user.id)
          .eq('category_id', category.id)
          .maybeSingle();

        if (budget) {
          return {
            id: budget.id,
            category_id: category.id,
            monthly_budget: budget.monthly_budget,
            category: {
              id: category.id,
              name: category.name,
              color: category.color
            }
          };
        }
        return null;
      });

      const data = (await Promise.all(budgetPromises)).filter(Boolean);
      const error = null;

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
    setLoadingMonthlyData(true);
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

      console.log('=== CALCULANDO GASTOS POR CATEGORÍA ===');
      
      // Obtener todas las transacciones de gastos del mes con sus categorías
      const { data: expenseData } = await supabase
        .from('transactions')
        .select('amount, category_id, categories(id, name, parent_id)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      console.log('Total transacciones de gasto:', expenseData?.length);
      
      // Contar transacciones con y sin categoría
      const withCategory = expenseData?.filter(t => t.category_id !== null).length || 0;
      const withoutCategory = expenseData?.filter(t => t.category_id === null).length || 0;
      console.log(`Transacciones CON categoría: ${withCategory}`);
      console.log(`Transacciones SIN categoría: ${withoutCategory}`);

      // Si hay transacciones sin categoría, categorizarlas automáticamente
      if (withoutCategory > 0 && !isCategorizingExisting) {
        console.log('Iniciando categorización automática de transacciones existentes...');
        setIsCategorizingExisting(true);
        
        try {
          const { data, error } = await supabase.functions.invoke('categorize-existing-transactions');
          
          if (error) {
            console.error('Error categorizando transacciones existentes:', error);
          } else {
            console.log('Categorización completada:', data);
            // Recargar datos después de categorizar
            setTimeout(() => {
              loadMonthlyData();
            }, 2000);
            return;
          }
        } catch (error) {
          console.error('Error en categorización automática:', error);
        } finally {
          setIsCategorizingExisting(false);
        }
      }

      // Calcular gastos por categoría principal
      const expenses: Record<string, number> = {};
      let unidentifiedCount = 0;
      
      (expenseData || []).forEach((expense: any) => {
        console.log('Procesando gasto:', {
          amount: expense.amount,
          category_id: expense.category_id,
          category: expense.categories
        });

        if (!expense.category_id || !expense.categories) {
          console.log('Gasto sin categoría detectado');
          return;
        }

        // Verificar si es la categoría de "Gastos no identificados"
        if (expense.categories.name === 'Gastos no identificados') {
          unidentifiedCount++;
        }

        // Si la categoría tiene parent_id, usar la categoría padre
        const categoryId = expense.categories.parent_id || expense.category_id;
        expenses[categoryId] = (expenses[categoryId] || 0) + Number(expense.amount);
        
        console.log(`Sumando ${expense.amount} a categoría ${categoryId}`);
      });

      console.log('Gastos totales por categoría:', expenses);
      console.log('Gastos no identificados:', unidentifiedCount);
      setCurrentExpenses(expenses);
      setHasUnidentifiedExpenses(unidentifiedCount > 0);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoadingMonthlyData(false);
    }
  };

  const handleRecategorize = async () => {
    setIsRecategorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('recategorize-unidentified');
      
      if (error) {
        console.error('Error recategorizando:', error);
        toast.error("Error al recategorizar gastos");
      } else {
        console.log('Recategorización completada:', data);
        toast.success(`✅ ${data.recategorized} gastos recategorizados`);
        // Recargar datos
        setTimeout(() => {
          loadMonthlyData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error en recategorización:', error);
      toast.error("Error al recategorizar gastos");
    } finally {
      setIsRecategorizing(false);
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
      'servicios y suscripciones': '🧾',
      'salud y bienestar': '🩺',
      'educación y desarrollo': '🎓',
      'deudas y créditos': '💳',
      'entretenimiento y estilo de vida': '🎉',
      'ahorro e inversión': '💸',
      'apoyos y otros': '🤝',
      'mascotas': '🐾',
      'categoría personalizada': '⭐',
      'gastos no identificados': '❓',
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
          <h1 className="text-lg font-bold text-foreground">💰 Presupuesto Mensual</h1>
          <Button
            variant="ghost"
            onClick={() => navigate('/edit-budgets')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón de recategorización si hay gastos no identificados */}
        {hasUnidentifiedExpenses && (
          <Card className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-[20px] shadow-xl border border-amber-200 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🤖</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Gastos sin categorizar</p>
                <p className="text-xs text-muted-foreground">La IA puede categorizarlos automáticamente</p>
              </div>
              <Button
                onClick={handleRecategorize}
                disabled={isRecategorizing}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[15px] shadow-lg hover:scale-105 active:scale-95 transition-all"
                size="sm"
              >
                {isRecategorizing ? "Categorizando..." : "Categorizar"}
              </Button>
            </div>
          </Card>
        )}

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
              <Pencil className="h-4 w-4 mr-2" />
              Configurar Presupuesto
            </Button>
          </Card>
        ) : (
          <>
            {/* Resumen General */}
            <Card className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all animate-fade-in">
              <div className="space-y-1">
                <div className="text-center">
                  <div className="text-sm">💰</div>
                  <p className="text-[9px] font-bold text-foreground">Resumen del Mes</p>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => navigate('/edit-budgets')}
                    className="bg-white/10 backdrop-blur-sm rounded-[10px] p-1.5 border-2 border-white/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all w-full cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <Target className="h-3 w-3 text-primary" />
                      <span className="text-[7px] text-muted-foreground font-medium">Presupuestado</span>
                      <p className="text-sm font-bold text-primary">
                        ${(totalBudget / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/gastos')}
                    className="bg-white/10 backdrop-blur-sm rounded-[10px] p-1.5 border-2 border-white/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all w-full cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <TrendingUp className="h-3 w-3 text-destructive" />
                      <span className="text-[7px] text-muted-foreground font-medium">Gastado</span>
                      <p className="text-sm font-bold text-destructive">
                        ${(Object.values(currentExpenses).reduce((sum, val) => sum + val, 0) / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </button>
                </div>

                {/* Disponible para gastar */}
                <div className="bg-white/10 backdrop-blur-sm rounded-[10px] p-1.5 border-2 border-white/20 shadow-lg text-center">
                  <span className="text-[7px] text-muted-foreground font-medium">Disponible</span>
                  <p className={`text-base font-bold ${remainingBudget >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${Math.abs(remainingBudget).toLocaleString()}
                  </p>
                  <p className="text-[7px] text-muted-foreground">
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

            {/* Lista de Presupuestos en dos columnas */}
            <div className="grid grid-cols-2 gap-2.5">
              {loadingMonthlyData || isCategorizingExisting ? (
                // Mostrar mensaje mientras categoriza
                <div className="col-span-2">
                  <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center animate-fade-in">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm font-semibold text-foreground">
                        🤖 La IA está categorizando tus transacciones
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Analizando gastos del mes para asignar categorías automáticamente...
                      </p>
                    </div>
                  </Card>
                </div>
              ) : budgets.length === 0 ? (
                <div className="col-span-2 text-center p-6 text-muted-foreground text-sm">
                  No hay presupuestos configurados
                </div>
              ) : (
                budgets.map((budget, index) => {
                  const spent = currentExpenses[budget.category_id] || 0;
                  const budgetAmount = Number(budget.monthly_budget);
                  const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
                  const remaining = budgetAmount - spent;
                  const isWarning = percentUsed >= 80;
                  const isCritical = percentUsed >= 100;

                  return (
                    <Card 
                      key={budget.id} 
                      className="p-3 bg-white rounded-[15px] shadow-lg border border-blue-100 hover:scale-105 active:scale-95 transition-all animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => navigate(`/category-expenses?category=${budget.category_id}&name=${encodeURIComponent(budget.category.name)}`)}
                    >
                      <div className="space-y-2">
                        <div className="text-center">
                          <span className="text-2xl">{getCategoryIcon(budget.category.name)}</span>
                          <p className="text-[10px] font-bold text-foreground leading-tight">{budget.category.name}</p>
                        </div>

                        <div className="space-y-1">
                          <Progress 
                            value={Math.min(percentUsed, 100)} 
                            className={`h-1.5 ${
                              isCritical ? 'bg-destructive/20' : 
                              isWarning ? 'bg-yellow-500/20' : 
                              'bg-muted'
                            }`}
                          />
                          <p className={`text-[9px] text-center font-bold ${
                            isCritical ? 'text-destructive' : 
                            isWarning ? 'text-yellow-600' : 
                            'text-success'
                          }`}>
                            {percentUsed.toFixed(0)}%
                          </p>
                        </div>

                        <div className="text-center space-y-0.5">
                          <p className="text-[8px] text-muted-foreground leading-tight">
                            ${spent.toLocaleString()} / ${budgetAmount.toLocaleString()}
                          </p>
                          <p className={`text-[9px] font-bold leading-tight ${
                            isCritical ? 'text-destructive' : 
                            isWarning ? 'text-yellow-600' : 
                            'text-success'
                          }`}>
                            {percentUsed < 100 
                              ? `Quedan $${remaining.toLocaleString()}` 
                              : `Excedido $${Math.abs(remaining).toLocaleString()}`
                            }
                          </p>
                        </div>

                        {/* Botón de estado */}
                        <div className={`rounded-[10px] p-1.5 ${
                          isCritical ? 'bg-destructive/10 border-2 border-destructive/30' :
                          isWarning ? 'bg-yellow-50 border-2 border-yellow-500/30' :
                          'bg-success/10 border-2 border-success/30'
                        }`}>
                          <p className={`text-[9px] font-bold text-center leading-tight ${
                            isCritical ? 'text-destructive' :
                            isWarning ? 'text-yellow-700' :
                            'text-success'
                          }`}>
                            {isCritical ? '⚠️ Mal' : isWarning ? '⚡ Cuidado' : '✅ Muy Bien'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Resumen de alertas */}
            {budgets.some(b => {
              const spent = currentExpenses[b.category_id] || 0;
              const percentage = (spent / Number(b.monthly_budget)) * 100;
              return percentage >= 80;
            }) && (
              <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all animate-fade-in">
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
