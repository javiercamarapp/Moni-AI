import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Pencil, AlertCircle, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Skeleton } from "@/components/ui/skeleton";

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

      // Obtener rango de fechas del mes actual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Obtener gastos del mes actual por categoría
      const { data: expenseData } = await supabase
        .from('transactions')
        .select('amount, category_id, categories(id, name, parent_id)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      // Calcular gastos por categoría principal
      const expensesByCategory: Record<string, number> = {};
      (expenseData || []).forEach((expense: any) => {
        if (expense.category_id && expense.categories) {
          const categoryId = expense.categories.parent_id || expense.category_id;
          expensesByCategory[categoryId] = (expensesByCategory[categoryId] || 0) + Number(expense.amount);
        }
      });

      console.log('📊 Gastos por categoría detectados:', expensesByCategory);

      // Para cada categoría principal, obtener su presupuesto O verificar si tiene gastos
      const budgetPromises = (categories || []).map(async (category) => {
        const { data: budget } = await supabase
          .from('category_budgets')
          .select('id, monthly_budget')
          .eq('user_id', user.id)
          .eq('category_id', category.id)
          .maybeSingle();

        const hasExpenses = expensesByCategory[category.id] > 0;

        // Incluir la categoría si tiene presupuesto O si tiene gastos
        if (budget || hasExpenses) {
          if (hasExpenses && !budget) {
            console.log(`✅ Mostrando categoría "${category.name}" con gastos pero sin presupuesto asignado`);
          }
          return {
            id: budget?.id || `temp-${category.id}`,
            category_id: category.id,
            monthly_budget: budget?.monthly_budget || 0,
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

      // Si hay transacciones sin categoría, categorizarlas automáticamente en segundo plano
      if (withoutCategory > 0 && !isCategorizingExisting) {
        console.log('Iniciando categorización automática en segundo plano...');
        setIsCategorizingExisting(true);
        
        // Ejecutar en segundo plano sin bloquear la UI
        supabase.functions.invoke('recategorize-unidentified')
          .then(({ data, error }) => {
            if (error) {
              console.error('Error categorizando:', error);
            } else {
              console.log('Categorización completada:', data);
              // Recargar datos silenciosamente después de categorizar
              setTimeout(() => {
                loadMonthlyData();
              }, 3000);
            }
          })
          .catch(error => {
            console.error('Error en categorización automática:', error);
          })
          .finally(() => {
            setIsCategorizingExisting(false);
          });
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
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoadingMonthlyData(false);
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
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/40 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-full bg-white/80 shadow-sm hover:bg-white h-8 w-8 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <h1 className="text-base font-semibold text-foreground flex-1 text-center">Presupuesto Mensual</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/edit-budgets')}
              className="rounded-full bg-white/80 shadow-sm hover:bg-white h-8 w-8 flex-shrink-0"
            >
              <Pencil className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto px-5 space-y-6 pb-4" style={{ maxWidth: '600px' }}>

        {budgets.length === 0 ? (
          <Card className="p-10 bg-white/90 backdrop-blur-md rounded-[24px] shadow-lg border-0 text-center">
            <div className="text-6xl mb-5">📊</div>
            <p className="text-lg font-semibold text-foreground mb-3">
              Crea tu Presupuesto Mensual
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Controla tus gastos por categoría y recibe alertas cuando te acerques al límite
            </p>
            <Button
              onClick={() => navigate('/budget-quiz')}
              className="rounded-full px-6 py-5 h-auto shadow-md"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Configurar Presupuesto
            </Button>
          </Card>
        ) : (
          <>
            {/* Resumen General */}
            <Card className="p-2 bg-white/90 backdrop-blur-md rounded-[20px] shadow-lg border-0">
              <div className="space-y-1.5">
                <div className="text-center pb-0.5">
                  <div className="text-xl mb-0.5">💰</div>
                  <p className="text-xs font-semibold text-foreground">Resumen del Mes</p>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => navigate('/edit-budgets')}
                    className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-sm rounded-[16px] p-2 border-0 hover:from-white/90 hover:to-white/70 hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-300 w-full cursor-pointer shadow-sm"
                  >
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <Target className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-[9px] text-muted-foreground font-medium">Presupuestado</span>
                      <p className="text-sm font-bold text-primary">
                        ${(totalBudget / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/gastos')}
                    className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-sm rounded-[16px] p-2 border-0 hover:from-white/90 hover:to-white/70 hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-300 w-full cursor-pointer shadow-sm"
                  >
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <TrendingUp className="h-3.5 w-3.5 text-destructive transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-[9px] text-muted-foreground font-medium">Gastado</span>
                      <p className="text-sm font-bold text-destructive">
                        ${(Object.values(currentExpenses).reduce((sum, val) => sum + val, 0) / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </button>
                </div>

                {/* Disponible para gastar */}
                <div className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-sm rounded-[16px] p-2 border-0 text-center shadow-sm animate-fade-in">
                  <span className="text-[9px] text-muted-foreground font-medium tracking-wide">Disponible</span>
                  <p className={`text-base font-bold mt-0.5 mb-0.5 transition-all duration-300 ${remainingBudget >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${Math.abs(remainingBudget).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {remainingBudget >= 0 ? 'para gastar' : 'sobre presupuesto'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Título de sección */}
            <div className="text-center space-y-2 py-2">
              <div className="text-4xl">📊</div>
              <p className="text-base font-semibold text-foreground">Presupuesto por Categoría</p>
              <p className="text-xs text-muted-foreground">Progreso del mes actual</p>
            </div>

            {/* Lista de Presupuestos en dos columnas */}
            <div className="grid grid-cols-2 gap-3">
              {loadingMonthlyData ? (
                // Mostrar skeletons mientras carga
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-[20px]" />
                  ))}
                </>
              ) : isCategorizingExisting ? (
                // Mostrar mensaje mientras categoriza en segundo plano
                <div className="col-span-2">
                  <Card className="p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        🤖 IA categorizando en segundo plano
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
                      className={`p-3 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer ${
                        isCritical ? 'bg-rose-50/80 backdrop-blur-sm border-rose-200' :
                        isWarning ? 'bg-amber-50/80 backdrop-blur-sm border-amber-200' :
                        'bg-emerald-50/80 backdrop-blur-sm border-emerald-200'
                      }`}
                      onClick={() => {
                        console.log('Navegando a categoría:', budget.category_id, budget.category.name);
                        navigate(`/category-expenses?category=${budget.category.name}`);
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getCategoryIcon(budget.category.name)}</span>
                            <p className={`text-xs font-bold ${
                              isCritical ? 'text-rose-700' :
                              isWarning ? 'text-amber-700' :
                              'text-emerald-700'
                            }`}>{budget.category.name}</p>
                          </div>
                          <p className={`text-xs font-bold ${
                            isCritical ? 'text-rose-600' :
                            isWarning ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>
                            {percentUsed.toFixed(0)}%
                          </p>
                        </div>

                        <Progress 
                          value={Math.min(percentUsed, 100)} 
                          className={`h-2 ${
                            isCritical ? 'bg-rose-200' :
                            isWarning ? 'bg-amber-200' :
                            'bg-emerald-200'
                          }`}
                        />

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            ${spent.toLocaleString()}
                          </p>
                          <p className={`text-xs font-semibold ${
                            isCritical ? 'text-rose-700' :
                            isWarning ? 'text-amber-700' :
                            'text-emerald-700'
                          }`}>
                            {isCritical ? '⚠️ Mal' : isWarning ? '⚡ Cuidado' : '✅ Bien'}
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
              <Card className="p-3 bg-gradient-to-br from-amber-50/90 to-orange-50/90 backdrop-blur-md rounded-[20px] shadow-lg border-0">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900 mb-0.5">
                      Atención a tus presupuestos
                    </p>
                    <p className="text-[10px] text-amber-700 leading-snug">
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
