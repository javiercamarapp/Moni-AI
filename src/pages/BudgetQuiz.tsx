import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  suggestedPercentage: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'comida', name: 'Comida y Restaurantes', icon: '🍔', suggestedPercentage: 15 },
  { id: 'transporte', name: 'Transporte', icon: '🚗', suggestedPercentage: 10 },
  { id: 'hogar', name: 'Hogar y Servicios', icon: '🏠', suggestedPercentage: 25 },
  { id: 'ocio', name: 'Entretenimiento', icon: '🎮', suggestedPercentage: 10 },
  { id: 'salud', name: 'Salud y Bienestar', icon: '💊', suggestedPercentage: 10 },
  { id: 'educacion', name: 'Educación', icon: '📚', suggestedPercentage: 5 },
  { id: 'compras', name: 'Compras Personales', icon: '🛍️', suggestedPercentage: 10 },
  { id: 'otros', name: 'Otros Gastos', icon: '💳', suggestedPercentage: 15 }
];

export default function BudgetQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userCategories, setUserCategories] = useState<any[]>([]);
  const [hasBankConnection, setHasBankConnection] = useState(false);
  const [calculatingIncome, setCalculatingIncome] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    loadUserCategories(user.id);
    checkBankConnection(user.id);
  };

  const loadUserCategories = async (userId: string) => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'expense');
    
    setUserCategories(data || []);
  };

  const checkBankConnection = async (userId: string) => {
    const { data } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);
    
    setHasBankConnection(!!data && data.length > 0);
  };

  const calculateAverageIncome = async () => {
    if (!user) return;
    
    setCalculatingIncome(true);
    try {
      // Calcular fecha de hace 12 meses
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      // Obtener transacciones de ingresos de los últimos 12 meses
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', user.id)
        .eq('type', 'income')
        .gte('transaction_date', twelveMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      if (transactions && transactions.length > 0) {
        // Agrupar por mes y calcular total por mes
        const monthlyIncomes: Record<string, number> = {};
        
        transactions.forEach(t => {
          const monthKey = t.transaction_date.substring(0, 7); // YYYY-MM
          monthlyIncomes[monthKey] = (monthlyIncomes[monthKey] || 0) + Number(t.amount);
        });

        // Calcular promedio
        const totalMonths = Object.keys(monthlyIncomes).length;
        if (totalMonths > 0) {
          const totalIncome = Object.values(monthlyIncomes).reduce((sum, val) => sum + val, 0);
          const averageIncome = Math.round(totalIncome / totalMonths);
          
          setMonthlyIncome(averageIncome.toString());
          toast.success(`Ingreso promedio detectado: $${averageIncome.toLocaleString()}`);
        } else {
          toast.info("No se encontraron ingresos en los últimos 12 meses");
        }
      } else {
        toast.info("No se encontraron transacciones de ingreso");
      }
    } catch (error) {
      console.error('Error calculating average income:', error);
      toast.error("Error al calcular el ingreso promedio");
    } finally {
      setCalculatingIncome(false);
    }
  };

  const formatDisplayValue = (value: string) => {
    if (!value || value === "0") return "";
    const number = parseFloat(value);
    if (isNaN(number)) return "";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const getDisplayValue = () => {
    if (isEditing) {
      return monthlyIncome;
    }
    return monthlyIncome ? formatDisplayValue(monthlyIncome) : "";
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!monthlyIncome || Number(monthlyIncome) <= 0) {
        toast.error("Ingresa tu ingreso mensual");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedCategories.length === 0) {
        toast.error("Selecciona al menos una categoría");
        return;
      }
      
      // Calcular presupuestos sugeridos
      const income = Number(monthlyIncome);
      const newBudgets: Record<string, number> = {};
      
      selectedCategories.forEach(catId => {
        const category = DEFAULT_CATEGORIES.find(c => c.id === catId);
        if (category) {
          newBudgets[catId] = Math.round(income * (category.suggestedPercentage / 100));
        }
      });
      
      setBudgets(newBudgets);
      setStep(3);
    } else if (step === 3) {
      saveBudgets();
    }
  };

  const saveBudgets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Para cada categoría seleccionada, buscar o crear la categoría en la BD
      for (const categoryId of selectedCategories) {
        const categoryData = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
        if (!categoryData) continue;

        // Buscar si ya existe la categoría del usuario
        let existingCategory = userCategories.find(
          c => c.name.toLowerCase() === categoryData.name.toLowerCase()
        );

        // Si no existe, crearla
        if (!existingCategory) {
          const { data: newCategory, error: catError } = await supabase
            .from('categories')
            .insert({
              user_id: user.id,
              name: categoryData.name,
              type: 'expense',
              color: 'bg-primary/20'
            })
            .select()
            .single();

          if (catError) throw catError;
          existingCategory = newCategory;
        }

        // Crear el presupuesto
        const { error: budgetError } = await supabase
          .from('category_budgets')
          .insert({
            user_id: user.id,
            category_id: existingCategory.id,
            monthly_budget: budgets[categoryId]
          });

        if (budgetError) throw budgetError;
      }

      toast.success("¡Presupuestos configurados exitosamente!");
      navigate('/gestionar-categorias');
    } catch (error) {
      console.error('Error saving budgets:', error);
      toast.error("Error al guardar presupuestos");
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = (categoryId: string, value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setBudgets({ ...budgets, [categoryId]: numValue });
    }
  };

  const totalBudget = Object.values(budgets).reduce((sum, val) => sum + val, 0);
  const percentageOfIncome = monthlyIncome ? (totalBudget / Number(monthlyIncome)) * 100 : 0;

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="mx-auto px-4 py-6 space-y-6" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? navigate('/dashboard') : setStep(step - 1)}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-all ${
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>

        {/* Step 1: Income */}
        {step === 1 && (
          <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
            <div className="text-center space-y-6">
              <div className="text-6xl">💰</div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  ¿Cuál es tu ingreso mensual?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Esto nos ayudará a sugerir presupuestos realistas
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground">$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={getDisplayValue()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setMonthlyIncome(value);
                    }}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    className="text-3xl text-center font-bold h-16 rounded-[20px] border-2 border-blue-100 pl-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresa tu ingreso mensual neto aproximado
                </p>
              </div>

              {hasBankConnection && (
                <Button
                  onClick={calculateAverageIncome}
                  disabled={calculatingIncome}
                  variant="outline"
                  className="w-full h-auto py-3 rounded-[20px] border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                >
                  {calculatingIncome ? (
                    "Calculando..."
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">🏦</span>
                      <span className="text-xs font-medium text-center">IA detectará tu ingreso promedio</span>
                    </div>
                  )}
                </Button>
              )}

              {!hasBankConnection && (
                <Button
                  onClick={() => navigate('/bank-connection')}
                  variant="outline"
                  className="w-full h-auto py-3 rounded-[20px] border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">🏦</span>
                    <span className="text-xs font-medium text-center">Conectar Banco para que la IA detecte tu ingreso</span>
                  </div>
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-3">📊</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  ¿En qué categorías gastas?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Selecciona las categorías que quieres controlar
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`p-4 rounded-[20px] border-2 transition-all ${
                      selectedCategories.includes(category.id)
                        ? 'border-primary bg-primary/10 scale-95'
                        : 'border-blue-100 bg-white hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <p className="text-xs font-medium text-foreground">
                      {category.name}
                    </p>
                    {selectedCategories.includes(category.id) && (
                      <Check className="h-4 w-4 text-primary mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Budgets */}
        {step === 3 && (
          <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-3">🎯</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Ajusta tus presupuestos
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Basados en tu ingreso de ${Number(monthlyIncome).toLocaleString()}
                </p>
                
                {/* Progress */}
                <div className="bg-gray-100 rounded-full h-3 mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentageOfIncome > 100 ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(percentageOfIncome, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ${totalBudget.toLocaleString()} de ${Number(monthlyIncome).toLocaleString()} ({percentageOfIncome.toFixed(0)}%)
                </p>
              </div>
              
              <div className="space-y-3">
                {selectedCategories.map(catId => {
                  const category = DEFAULT_CATEGORIES.find(c => c.id === catId);
                  if (!category) return null;
                  
                  return (
                    <div key={catId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-[15px]">
                      <div className="text-2xl">{category.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {category.name}
                        </p>
                      </div>
                      <Input
                        type="number"
                        value={budgets[catId] || 0}
                        onChange={(e) => updateBudget(catId, e.target.value)}
                        className="w-32 text-right font-semibold"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={loading}
          className="w-full h-14 bg-white/90 backdrop-blur-xl border-2 border-white/60 hover:bg-white/95 text-foreground rounded-[20px] font-semibold text-lg shadow-2xl hover:shadow-white/60 hover:scale-105 active:scale-95 transition-all"
          style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}
        >
          {loading ? (
            "Guardando..."
          ) : step === 3 ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Guardar Presupuestos
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
