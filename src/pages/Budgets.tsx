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

      // Mapeo de categorías específicas a categorías generales de presupuesto
      const categoryMapping: Record<string, string[]> = {
        'vivienda': ['luz', 'agua', 'gas', 'internet', 'renta', 'mantenimiento'],
        'transporte': ['gasolina', 'uber', 'estacionamiento', 'mantenimiento auto', 'transporte'],
        'alimentación': ['supermercado', 'restaurantes', 'café', 'rappi', 'uber eats', 'bar y copas', 'bar', 'comida'],
        'servicios y suscripciones': ['netflix', 'spotify', 'amazon prime', 'disney+', 'disney', 'hbo max', 'hbo', 'teléfono', 'telefono', 'suscripción', 'suscripcion'],
        'salud y bienestar': ['gym', 'farmacia', 'médico', 'medico', 'dentista', 'salud'],
        'entretenimiento y estilo de vida': ['cine', 'conciertos', 'night club', 'eventos', 'ropa', 'amazon', 'mercado libre', 'tecnología', 'tecnologia', 'entretenimiento'],
        'ahorro e inversión': ['inversiones', 'inversión', 'inversion', 'ahorro'],
        'mascotas': ['veterinario', 'comida mascotas', 'mascota']
      };

      // Calcular gastos por categoría del mes
      const { data: expenseData } = await supabase
        .from('transactions')
        .select('amount, category_id, categories(id, name)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      console.log('=== DEBUG GASTOS ===');
      console.log('Total de transacciones:', expenseData?.length);
      console.log('Presupuestos cargados:', budgets.length);

      // Agrupar gastos por categoría general
      const expensesByGeneralCategory: Record<string, number> = {};
      
      (expenseData || []).forEach(t => {
        if (t.categories && t.categories.name) {
          const specificCategoryName = t.categories.name.toLowerCase().trim();
          console.log('Procesando gasto:', specificCategoryName, Number(t.amount));
          
          // Buscar a qué categoría general pertenece este gasto
          let matched = false;
          for (const [generalCategory, specificCategories] of Object.entries(categoryMapping)) {
            // Buscar coincidencia exacta o parcial
            const isMatch = specificCategories.some(cat => {
              const catLower = cat.toLowerCase();
              return specificCategoryName === catLower || 
                     specificCategoryName.includes(catLower) || 
                     catLower.includes(specificCategoryName);
            });
            
            if (isMatch) {
              expensesByGeneralCategory[generalCategory] = (expensesByGeneralCategory[generalCategory] || 0) + Number(t.amount);
              console.log(`✓ Mapeado "${specificCategoryName}" a "${generalCategory}"`);
              matched = true;
              break;
            }
          }
          
          if (!matched) {
            console.log(`✗ No se encontró mapeo para "${specificCategoryName}"`);
          }
        }
      });

      console.log('Gastos agrupados por categoría general:', expensesByGeneralCategory);

      // Mapear a los IDs de las categorías de presupuesto
      const expensesByCategory: Record<string, number> = {};
      budgets.forEach(budget => {
        const categoryName = budget.category.name.toLowerCase().trim();
        if (expensesByGeneralCategory[categoryName]) {
          expensesByCategory[budget.category_id] = expensesByGeneralCategory[categoryName];
        }
      });

      console.log('Gastos mapeados a IDs de presupuestos:', expensesByCategory);

      setCurrentExpenses(expensesByCategory);
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
          <h1 className="text-lg font-bold text-foreground">💰 Presupuesto Mensual</h1>
          <Button
            variant="ghost"
            onClick={() => navigate('/edit-budgets')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <Pencil className="h-4 w-4" />
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
                  <div className="bg-white/10 backdrop-blur-sm rounded-[10px] p-1.5 border-2 border-white/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <Target className="h-3 w-3 text-primary" />
                      <span className="text-[7px] text-muted-foreground font-medium">Presupuestado</span>
                      <p className="text-sm font-bold text-primary">
                        ${(totalBudget / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                  
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
              {loadingMonthlyData ? (
                // Mostrar mensaje de análisis mientras carga
                <div className="col-span-2">
                  <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center animate-fade-in">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm font-semibold text-foreground">
                        🤖 Presupuestos por categoría están siendo analizados por la IA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Esto puede tomar unos segundos...
                      </p>
                    </div>
                  </Card>
                </div>
              ) : (
                budgets.map((budget, index) => {
                  const spent = currentExpenses[budget.category_id] || 0;
                  const budgetAmount = Number(budget.monthly_budget);
                  const percentUsed = (spent / budgetAmount) * 100;
                  const remaining = budgetAmount - spent;
                  const isWarning = percentUsed >= 80;
                  const isCritical = percentUsed >= 100;

                  return (
                    <Card 
                      key={budget.id} 
                      className="p-3 bg-white rounded-[15px] shadow-lg border border-blue-100 hover:scale-105 active:scale-95 transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
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
