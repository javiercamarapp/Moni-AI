import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { SectionLoader } from "@/components/SectionLoader";
import BudgetMonthlySummary from "@/components/budget/BudgetMonthlySummary";
import BudgetCategorySpending, { CategorySpendingItem } from "@/components/budget/BudgetCategorySpending";
import BudgetCategoryDetails, { Expense } from "@/components/budget/BudgetCategoryDetails";
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cacheService";


// View states
enum BudgetViewState {
  IDLE = 'IDLE',
  BUDGET_DETAILS = 'BUDGET_DETAILS',
  CATEGORY_DETAILS = 'CATEGORY_DETAILS'
}

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
  const [viewState, setViewState] = useState<BudgetViewState>(BudgetViewState.IDLE);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMonthlyData, setLoadingMonthlyData] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState<Record<string, number>>({});
  const [totalSpentAll, setTotalSpentAll] = useState(0); // Total ALL expenses (for consistency with Dashboard)
  const [categoryExpenses, setCategoryExpenses] = useState<Expense[]>([]);
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

      // Try to load cached data first for instant display
      const cachedBudgets = getCache<Budget[]>(CACHE_KEYS.BUDGETS);
      const cachedExpenses = getCache<Record<string, number>>(CACHE_KEYS.MONTHLY_EXPENSES);

      if (cachedBudgets && cachedBudgets.length > 0) {
        setBudgets(cachedBudgets);
        const total = cachedBudgets.reduce((sum, b) => sum + Number(b.monthly_budget), 0);
        setTotalBudget(total);
        setLoading(false);

        if (cachedExpenses) {
          setCurrentExpenses(cachedExpenses);
          setLoadingMonthlyData(false);
        }
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

      // Update state
      setBudgets(data || []);
      const total = (data || []).reduce((sum, b) => sum + Number(b.monthly_budget), 0);
      setTotalBudget(total);

      // Update cache
      setCache(CACHE_KEYS.BUDGETS, data, CACHE_TTL.BUDGETS);
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

      // Obtener todas las transacciones de gastos del mes con sus categorías
      const { data: expenseData } = await supabase
        .from('transactions')
        .select('amount, category_id, categories(id, name, parent_id)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      // Contar transacciones con y sin categoría
      const withoutCategory = expenseData?.filter(t => t.category_id === null).length || 0;

      // Si hay transacciones sin categoría, categorizarlas automáticamente en segundo plano
      if (withoutCategory > 0 && !isCategorizingExisting) {
        setIsCategorizingExisting(true);

        // Ejecutar en segundo plano sin bloquear la UI
        supabase.functions.invoke('recategorize-unidentified')
          .then(({ error }) => {
            if (error) {
              console.error('Error categorizando:', error);
            } else {
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

      // Calcular gastos por categoría principal Y total de todos los gastos
      const expenses: Record<string, number> = {};
      let allExpensesTotal = 0;

      (expenseData || []).forEach((expense: any) => {
        // Add to total (all expenses)
        allExpensesTotal += Number(expense.amount);

        // For per-category breakdown, skip uncategorized
        if (!expense.category_id || !expense.categories) {
          return;
        }

        // Si la categoría tiene parent_id, usar la categoría padre
        const categoryId = expense.categories.parent_id || expense.category_id;
        expenses[categoryId] = (expenses[categoryId] || 0) + Number(expense.amount);
      });

      setCurrentExpenses(expenses);
      setTotalSpentAll(allExpensesTotal);

      // Update cache
      setCache(CACHE_KEYS.MONTHLY_EXPENSES, expenses, CACHE_TTL.MONTHLY_DATA);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoadingMonthlyData(false);
    }
  };

  const loadCategoryExpenses = async (categoryName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get category ID from name
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', categoryName)
        .maybeSingle();

      if (!category) {
        setCategoryExpenses([]);
        return;
      }

      // Get all subcategory IDs
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', category.id);

      const categoryIds = [category.id, ...(subcategories || []).map(s => s.id)];

      // Get transactions for this category and its subcategories
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, description, amount, transaction_date, payment_method')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .in('category_id', categoryIds)
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      const expenses: Expense[] = (transactions || []).map(t => ({
        id: t.id,
        description: t.description || 'Sin descripción',
        amount: Number(t.amount),
        date: t.transaction_date,
        paymentMethod: t.payment_method || 'Efectivo'
      }));

      setCategoryExpenses(expenses);
    } catch (error) {
      console.error('Error loading category expenses:', error);
      setCategoryExpenses([]);
    }
  };

  const handleBack = () => {
    if (viewState === BudgetViewState.CATEGORY_DETAILS || viewState === BudgetViewState.BUDGET_DETAILS) {
      setViewState(BudgetViewState.IDLE);
      setSelectedCategory(null);
      setCategoryExpenses([]);
    } else {
      navigate('/dashboard');
    }
  };

  const handleOpenCategory = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    loadCategoryExpenses(categoryName);
    setViewState(BudgetViewState.CATEGORY_DETAILS);
  };

  // Prepare categories for the spending component
  const categoryItems: CategorySpendingItem[] = budgets.map(budget => ({
    id: budget.id,
    categoryId: budget.category_id,
    label: budget.category.name,
    budget: Number(budget.monthly_budget),
    spent: currentExpenses[budget.category_id] || 0,
    color: budget.category.color
  }));

  // Use totalSpentAll for the summary (includes uncategorized expenses, consistent with Dashboard)
  const totalSpent = totalSpentAll > 0 ? totalSpentAll : Object.values(currentExpenses).reduce((sum, val) => sum + val, 0);

  // Get header text based on view state
  const getHeaderTitle = () => {
    switch (viewState) {
      case BudgetViewState.BUDGET_DETAILS:
        return "Desglose";
      case BudgetViewState.CATEGORY_DETAILS:
        return selectedCategory?.name || "Detalles";
      default:
        return "Presupuesto Mensual";
    }
  };

  const getHeaderSubtitle = () => {
    switch (viewState) {
      case BudgetViewState.BUDGET_DETAILS:
        return "Tu plan mensual";
      case BudgetViewState.CATEGORY_DETAILS:
        return "Historial de transacciones";
      default:
        return "Controla tus gastos";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] pb-20 flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
    );
  }

  // Get data for selected category in details view
  const selectedCategoryData = selectedCategory ? budgets.find(b => b.category_id === selectedCategory.id) : null;

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-gray-800 selection:bg-stone-200">
      {/* Max width container */}
      <div className="max-w-5xl mx-auto min-h-screen bg-[#FAFAF9] relative">

        {/* Dynamic Header */}
        <div className="w-full flex items-center gap-4 pt-8 pb-4 px-6 bg-transparent">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors text-gray-700"
            aria-label="Go back"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <div className="flex flex-col flex-1 animate-fade-in">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {getHeaderTitle()}
            </h1>
            <p className="text-xs font-medium text-gray-500">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="pb-24">

          {/* HOME VIEW */}
          {viewState === BudgetViewState.IDLE && (
            <>
              {budgets.length === 0 ? (
                <div className="px-6 mt-6">
                  <div className="bg-white rounded-3xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 text-center">
                    <div className="text-6xl mb-5">📊</div>
                    <p className="text-lg font-bold text-[#5D4037] mb-3">
                      Crea tu Presupuesto Mensual
                    </p>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                      Controla tus gastos por categoría y recibe alertas cuando te acerques al límite
                    </p>
                    <button
                      onClick={() => navigate('/budget-quiz')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#5D4037] text-white rounded-xl font-bold shadow-lg shadow-[#5D4037]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      <Pencil className="h-4 w-4" />
                      Configurar Presupuesto
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {loadingMonthlyData ? (
                    <div className="flex items-center justify-center py-20">
                      <SectionLoader size="md" />
                    </div>
                  ) : (
                    <>
                      <BudgetMonthlySummary
                        totalBudget={totalBudget}
                        totalSpent={totalSpent}
                        onOpenBudget={() => navigate('/edit-budgets')}
                        onOpenSpent={() => navigate('/gastos')}
                      />
                      <BudgetCategorySpending
                        categories={categoryItems}
                        onOpenCategory={handleOpenCategory}
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* CATEGORY DETAILS VIEW */}
          {viewState === BudgetViewState.CATEGORY_DETAILS && selectedCategoryData && (
            <BudgetCategoryDetails
              categoryName={selectedCategoryData.category.name}
              budget={Number(selectedCategoryData.monthly_budget)}
              spent={currentExpenses[selectedCategoryData.category_id] || 0}
              expenses={categoryExpenses}
            />
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
