import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  suggestedPercentage: number;
  subcategories: Subcategory[];
  insight: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { 
    id: 'vivienda', 
    name: 'Vivienda', 
    icon: '🏠', 
    suggestedPercentage: 30,
    insight: 'Mide estabilidad y proporción ideal (<30% de ingresos)',
    subcategories: [
      { id: 'renta', name: 'Renta o hipoteca' },
      { id: 'mantenimiento', name: 'Mantenimiento o predial' },
      { id: 'luz', name: 'Luz' },
      { id: 'agua', name: 'Agua' },
      { id: 'gas', name: 'Gas' },
      { id: 'internet', name: 'Internet y teléfono' },
      { id: 'limpieza', name: 'Servicio de limpieza / seguridad' },
    ]
  },
  { 
    id: 'transporte', 
    name: 'Transporte', 
    icon: '🚗', 
    suggestedPercentage: 15,
    insight: 'Detecta sobrecostos o hábitos de transporte ineficiente',
    subcategories: [
      { id: 'gasolina', name: 'Gasolina / carga eléctrica' },
      { id: 'publico', name: 'Transporte público' },
      { id: 'uber', name: 'Uber, Didi, taxis' },
      { id: 'estacionamiento', name: 'Estacionamiento o peajes' },
      { id: 'mantenimiento_vehiculo', name: 'Mantenimiento del vehículo / seguro' },
    ]
  },
  { 
    id: 'alimentacion', 
    name: 'Alimentación', 
    icon: '🍽️', 
    suggestedPercentage: 20,
    insight: 'Es la categoría donde más fuga de dinero hay',
    subcategories: [
      { id: 'supermercado', name: 'Supermercado' },
      { id: 'restaurantes', name: 'Comidas fuera de casa' },
      { id: 'cafe', name: 'Café / snacks / antojos' },
      { id: 'apps_comida', name: 'Apps de comida (Rappi, Uber Eats, etc.)' },
    ]
  },
  { 
    id: 'servicios', 
    name: 'Servicios y suscripciones', 
    icon: '🧾', 
    suggestedPercentage: 8,
    insight: 'Ideal para detectar "gastos hormiga" o suscripciones olvidadas',
    subcategories: [
      { id: 'streaming', name: 'Streaming (Netflix, Spotify, etc.)' },
      { id: 'apps_premium', name: 'Apps premium (IA, productividad, edición, etc.)' },
      { id: 'software', name: 'Suscripciones de software / membresías' },
      { id: 'telefono', name: 'Teléfono móvil' },
    ]
  },
  { 
    id: 'salud', 
    name: 'Salud y bienestar', 
    icon: '🩺', 
    suggestedPercentage: 5,
    insight: 'Muestra equilibrio entre autocuidado y exceso de gasto',
    subcategories: [
      { id: 'seguro_medico', name: 'Seguro médico' },
      { id: 'medicinas', name: 'Medicinas' },
      { id: 'consultas', name: 'Consultas médicas' },
      { id: 'gimnasio', name: 'Gimnasio, clases, suplementos' },
    ]
  },
  { 
    id: 'educacion', 
    name: 'Educación y desarrollo', 
    icon: '🎓', 
    suggestedPercentage: 5,
    insight: 'Refleja gasto de crecimiento o inversión en conocimiento',
    subcategories: [
      { id: 'colegiaturas', name: 'Colegiaturas' },
      { id: 'cursos', name: 'Cursos / talleres' },
      { id: 'libros', name: 'Libros o herramientas de aprendizaje' },
      { id: 'extracurriculares', name: 'Clases extracurriculares' },
    ]
  },
  { 
    id: 'deudas', 
    name: 'Deudas y créditos', 
    icon: '💳', 
    suggestedPercentage: 5,
    insight: 'Ayuda a calcular el índice de endeudamiento (<35% recomendable)',
    subcategories: [
      { id: 'tarjetas', name: 'Tarjetas de crédito' },
      { id: 'prestamos', name: 'Préstamos personales / automotriz' },
      { id: 'hipotecarios', name: 'Créditos hipotecarios' },
      { id: 'intereses', name: 'Intereses / pagos mínimos' },
    ]
  },
  { 
    id: 'entretenimiento', 
    name: 'Entretenimiento y estilo de vida', 
    icon: '🎉', 
    suggestedPercentage: 7,
    insight: 'Identifica exceso de gasto emocional o impulsivo',
    subcategories: [
      { id: 'salidas', name: 'Salidas, fiestas, bares' },
      { id: 'ropa', name: 'Ropa, accesorios, belleza' },
      { id: 'viajes', name: 'Viajes o escapadas' },
      { id: 'hobbies', name: 'Hobbies, videojuegos, mascotas' },
    ]
  },
  { 
    id: 'ahorro', 
    name: 'Ahorro e inversión', 
    icon: '💸', 
    suggestedPercentage: 10,
    insight: 'Mide disciplina financiera (objetivo: al menos 10-20% de ingresos)',
    subcategories: [
      { id: 'ahorro_mensual', name: 'Ahorro mensual' },
      { id: 'fondo_emergencia', name: 'Fondo de emergencia' },
      { id: 'inversion', name: 'Inversión (fondos, CETES, cripto, etc.)' },
      { id: 'retiro', name: 'Aportación a retiro (AFORE, IRA, etc.)' },
    ]
  },
  { 
    id: 'apoyos', 
    name: 'Apoyos y otros', 
    icon: '🤝', 
    suggestedPercentage: 0,
    insight: 'Permite ajustar el "balance neto real" del mes',
    subcategories: [
      { id: 'apoyo_familiar', name: 'Apoyo familiar / hijos / pareja' },
      { id: 'donaciones', name: 'Donaciones' },
      { id: 'mascotas', name: 'Mascotas' },
      { id: 'otros', name: 'Otros gastos no clasificados' },
    ]
  },
];

export default function BudgetQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [subcategoryBudgets, setSubcategoryBudgets] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userCategories, setUserCategories] = useState<any[]>([]);
  const [hasBankConnection, setHasBankConnection] = useState(false);
  const [calculatingIncome, setCalculatingIncome] = useState(false);
  const [aiForecast, setAiForecast] = useState<number | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [categoryEstimates, setCategoryEstimates] = useState<Record<string, number>>({});

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
    calculateAIForecast(user.id);
    calculateCategoryEstimates(user.id);
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

  const calculateAIForecast = async (userId: string) => {
    try {
      // Calcular fecha de hace 6 meses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Obtener transacciones de ingresos de los últimos 6 meses
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', userId)
        .eq('type', 'ingreso')
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
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
          
          setAiForecast(averageIncome);
          setShowForecast(true);
        }
      }
    } catch (error) {
      console.error('Error calculating AI forecast:', error);
    }
  };

  const calculateCategoryEstimates = async (userId: string) => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      console.log('Calculando estimaciones de categorías para userId:', userId);
      
      // Obtener todas las transacciones de gastos de los últimos 6 meses
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount, transaction_date, category_id, description, frequency')
        .eq('user_id', userId)
        .eq('type', 'gasto')
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      console.log('Transacciones encontradas:', transactions?.length, transactions);

      if (!transactions || transactions.length === 0) {
        console.log('No hay transacciones de gastos en los últimos 6 meses');
        return;
      }

      // Obtener categorías del usuario
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', userId)
        .eq('type', 'expense');

      console.log('Categorías encontradas:', categories?.length, categories);

      if (!categories) {
        console.log('No hay categorías del usuario');
        return;
      }

      const estimates: Record<string, number> = {};

      // Para cada categoría principal, calcular el promedio
      DEFAULT_CATEGORIES.forEach(mainCategory => {
        // Buscar la categoría del usuario que coincida con el nombre
        const userCategory = categories.find(
          c => c.name.toLowerCase().includes(mainCategory.name.toLowerCase().substring(0, 5))
        );

        console.log(`Buscando categoría "${mainCategory.name}":`, userCategory);

        if (userCategory) {
          // Filtrar transacciones de esta categoría
          const categoryTransactions = transactions.filter(t => t.category_id === userCategory.id);
          
          console.log(`Transacciones para ${mainCategory.name}:`, categoryTransactions.length);
          
          if (categoryTransactions.length > 0) {
            // Detectar si es suscripción o gasto fijo (recurrente)
            const hasRecurring = categoryTransactions.some(t => t.frequency && t.frequency !== 'one-time');
            
            if (hasRecurring) {
              // Para gastos fijos, tomar el valor más reciente
              const recentTransaction = categoryTransactions[0];
              estimates[mainCategory.id] = Math.round(Number(recentTransaction.amount));
            } else {
              // Para gastos variables, calcular promedio mensual
              const monthlyTotals: Record<string, number> = {};
              
              categoryTransactions.forEach(t => {
                const monthKey = t.transaction_date.substring(0, 7);
                monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(t.amount);
              });

              const totalMonths = Object.keys(monthlyTotals).length;
              if (totalMonths > 0) {
                const total = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
                estimates[mainCategory.id] = Math.round(total / totalMonths);
              }
            }
          }
        }
      });

      console.log('Estimaciones calculadas:', estimates);
      setCategoryEstimates(estimates);
    } catch (error) {
      console.error('Error calculating category estimates:', error);
    }
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
        .eq('type', 'ingreso')
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

  const updateSubcategoryBudget = (subcategoryId: string, value: string) => {
    const numValue = Number(value.replace(/,/g, ''));
    if (!isNaN(numValue) && numValue >= 0) {
      setSubcategoryBudgets({ ...subcategoryBudgets, [subcategoryId]: numValue });
    }
  };

  const formatCurrency = (value: number): string => {
    if (value === 0) return "";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalBudget = Object.values(budgets).reduce((sum, val) => sum + val, 0);
  const percentageOfIncome = monthlyIncome ? (totalBudget / Number(monthlyIncome)) * 100 : 0;

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? navigate('/dashboard') : setStep(step - 1)}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 w-6 rounded-full transition-all ${
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="w-9" />
        </div>

        {/* Step 1: Income */}
        {step === 1 && (
          <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="text-4xl">💰</div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  ¿Cuál es tu ingreso mensual?
                </h2>
                <p className="text-xs text-muted-foreground">
                  Esto nos ayudará a sugerir presupuestos realistas
                </p>
              </div>

              {/* AI Forecast Card */}
              {showForecast && aiForecast && !hasBankConnection && (
                <div className="bg-white/10 backdrop-blur-sm rounded-[15px] p-2.5 space-y-1.5 border-2 border-white/20 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-fade-in">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl animate-pulse">🤖</span>
                    <div className="text-left">
                      <p className="text-[9px] font-semibold text-foreground">Pronóstico de IA</p>
                      <p className="text-[7px] text-muted-foreground">Últimos 6 meses</p>
                    </div>
                  </div>
                  <div className="text-center py-0.5">
                    <p className="text-xl font-bold text-primary drop-shadow-lg">${aiForecast.toLocaleString()}</p>
                    <p className="text-[7px] text-muted-foreground">Ingreso mensual promedio</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      onClick={() => {
                        setMonthlyIncome(aiForecast.toString());
                        setShowForecast(false);
                      }}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white h-7 text-[10px] font-semibold rounded-[10px] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      Usar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-7 text-[10px] rounded-[10px] border-white/30 bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
                      onClick={() => {
                        setShowForecast(false);
                        setShowManualInput(true);
                      }}
                    >
                      Manual
                    </Button>
                  </div>
                </div>
              )}

              {/* Manual Input Card */}
              {(showManualInput || (!showForecast && !hasBankConnection)) && (
                <div className="bg-white/10 backdrop-blur-sm rounded-[15px] p-3 space-y-2 border-2 border-white/20 shadow-lg animate-fade-in">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground mb-2">Ingresa tu ingreso mensual</p>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
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
                      className="text-2xl text-center font-bold h-14 rounded-[15px] border-2 border-white/20 pl-10 bg-white/5"
                    />
                  </div>
                </div>
              )}
              
              {hasBankConnection && (
                <Button
                  onClick={calculateAverageIncome}
                  disabled={calculatingIncome}
                  variant="outline"
                  className="w-full h-auto py-3 rounded-[20px] border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {calculatingIncome ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Calculando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-2xl animate-pulse">🏦</span>
                      <span className="text-[9px] font-medium text-center leading-tight">IA detectará tu ingreso promedio</span>
                    </div>
                  )}
                </Button>
              )}

              {!hasBankConnection && (
                <Button
                  onClick={() => navigate('/bank-connection')}
                  variant="outline"
                  className="w-full h-auto py-3 rounded-[20px] border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-2xl animate-pulse">🏦</span>
                    <span className="text-[9px] font-medium text-center leading-tight">Conectar Banco para que la IA detecte tu ingreso</span>
                  </div>
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  ¿En qué categorías gastas?
                </h2>
                <p className="text-xs text-muted-foreground">
                  Toca para ver subcategorías y seleccionar
                </p>
              </div>
              
              <div className="space-y-2">
                {DEFAULT_CATEGORIES.map(category => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      className={`w-full p-3 rounded-[15px] border-2 transition-all text-left ${
                        selectedCategories.includes(category.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-blue-100 bg-white hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {category.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {category.suggestedPercentage}% sugerido
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {categoryEstimates[category.id] && (
                            <div className="bg-primary/10 px-2 py-1 rounded-lg">
                              <p className="text-[9px] text-primary font-semibold">
                                IA: ${categoryEstimates[category.id].toLocaleString()}
                              </p>
                            </div>
                          )}
                          <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expandedCategory === category.id ? 'rotate-90' : ''
                          }`} />
                        </div>
                      </div>
                    </button>
                    
                    {expandedCategory === category.id && (
                      <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-1.5 py-2 animate-fade-in">
                        <p className="text-[9px] text-muted-foreground italic mb-2">
                          💡 {category.insight}
                        </p>
                        
                        {categoryEstimates[category.id] && (
                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-[12px] p-2 mb-2 border border-primary/20">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">🤖</span>
                                <span className="text-[10px] font-semibold text-foreground">Estimación IA</span>
                              </div>
                              <span className="text-sm font-bold text-primary">
                                ${categoryEstimates[category.id].toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[8px] text-muted-foreground mb-1.5">
                              Promedio últimos 6 meses
                            </p>
                            <Button
                              onClick={() => {
                                setBudgets({ ...budgets, [category.id]: categoryEstimates[category.id] });
                                toast.success("Estimación aplicada");
                              }}
                              className="w-full h-7 text-[10px] bg-primary hover:bg-primary/90 text-white rounded-[8px] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                              Aceptar estimación
                            </Button>
                          </div>
                        )}
                        
                        <div className="space-y-1.5">
                          {category.subcategories.map(sub => (
                            <div key={sub.id} className="bg-gray-50 rounded-lg px-2 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-foreground flex-1">
                                  • {sub.name}
                                </span>
                                <div className="relative flex items-center">
                                  <span className="absolute left-2 text-[10px] font-semibold text-muted-foreground">$</span>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={subcategoryBudgets[sub.id] ? formatCurrency(subcategoryBudgets[sub.id]) : ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d]/g, '');
                                      updateSubcategoryBudget(sub.id, value);
                                    }}
                                    className="w-24 h-7 text-[10px] text-right font-semibold pl-4 pr-2 bg-gray-50 border-gray-200"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleCategoryToggle(category.id)}
                          className={`w-full mt-2 h-10 text-xs font-semibold rounded-[15px] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all ${
                            selectedCategories.includes(category.id)
                              ? 'bg-destructive hover:bg-destructive/90 text-white'
                              : 'bg-primary hover:bg-primary/90 text-white'
                          }`}
                        >
                          {selectedCategories.includes(category.id) ? 'Quitar' : 'Agregar'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Budgets */}
        {step === 3 && (
          <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
            <div className="space-y-5">
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Ajusta tus presupuestos
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Ingreso mensual: ${Number(monthlyIncome).toLocaleString()}
                </p>
                
                {/* Budget vs Savings Visualization */}
                <div className="space-y-3 bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-[15px] border-2 border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-left">
                      <p className="text-[10px] text-muted-foreground">Presupuesto asignado</p>
                      <p className="text-lg font-bold text-foreground">${totalBudget.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Ahorro estimado</p>
                      <p className={`text-lg font-bold ${
                        Number(monthlyIncome) - totalBudget >= 0 ? 'text-green-600' : 'text-destructive'
                      }`}>
                        ${Math.max(0, Number(monthlyIncome) - totalBudget).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative h-6 bg-white rounded-full overflow-hidden border-2 border-white/50 shadow-inner">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all ${
                        percentageOfIncome > 100 ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-primary/80'
                      }`}
                      style={{ width: `${Math.min(percentageOfIncome, 100)}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500"
                      style={{ width: `${Math.max(0, 100 - percentageOfIncome)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white drop-shadow-lg">
                        {percentageOfIncome.toFixed(0)}% presupuesto • {Math.max(0, 100 - percentageOfIncome).toFixed(0)}% ahorro
                      </span>
                    </div>
                  </div>
                  
                  {percentageOfIncome > 100 && (
                    <p className="text-[10px] text-destructive font-semibold text-center animate-pulse">
                      ⚠️ Tu presupuesto excede tus ingresos
                    </p>
                  )}
                  {percentageOfIncome < 90 && percentageOfIncome > 0 && (
                    <p className="text-[10px] text-green-600 font-semibold text-center">
                      ✨ ¡Excelente! Estás ahorrando {(100 - percentageOfIncome).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedCategories.map(catId => {
                  const category = DEFAULT_CATEGORIES.find(c => c.id === catId);
                  if (!category) return null;
                  
                  const budgetPercentage = monthlyIncome ? (budgets[catId] / Number(monthlyIncome)) * 100 : 0;
                  
                  return (
                    <div key={catId} className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-[12px] border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{category.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">
                            {category.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            Sugerido: {category.suggestedPercentage}%
                          </p>
                        </div>
                        <div className="text-right">
                          <Input
                            type="number"
                            value={budgets[catId] || 0}
                            onChange={(e) => updateBudget(catId, e.target.value)}
                            className="w-24 h-8 text-right text-xs font-bold"
                          />
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {budgetPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
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
          className="w-full h-12 bg-white/90 backdrop-blur-xl border-2 border-white/60 hover:bg-white/95 text-foreground rounded-[20px] font-semibold text-base shadow-2xl hover:shadow-white/60 hover:scale-105 active:scale-95 transition-all"
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
