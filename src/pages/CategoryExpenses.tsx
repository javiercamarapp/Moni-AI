import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';

// Mapeo de categorías a emojis
const categoryEmojis: Record<string, string> = {
  'alimentación': '🍔',
  'transporte': '🚗',
  'vivienda': '🏠',
  'servicios y suscripciones': '📺',
  'salud y bienestar': '💊',
  'entretenimiento y estilo de vida': '🎮',
  'mascotas': '🐕',
  'ahorro e inversión': '💰',
};

const getCategoryEmoji = (categoryName: string): string => {
  const lowerName = categoryName.toLowerCase();
  return categoryEmojis[lowerName] || '💸';
};

// Mapeo de categorías específicas a categorías de presupuesto
const categoryMapping: Record<string, string> = {
  // Alimentación
  'Supermercado': 'Alimentación',
  'Rappi': 'Alimentación',
  'Uber Eats': 'Alimentación',
  'Restaurantes': 'Alimentación',
  'Café': 'Alimentación',
  
  // Transporte
  'Gasolina': 'Transporte',
  'Uber': 'Transporte',
  'Estacionamiento': 'Transporte',
  'Mantenimiento Auto': 'Transporte',
  
  // Vivienda
  'Luz': 'Vivienda',
  'Agua': 'Vivienda',
  'Gas': 'Vivienda',
  'Internet': 'Vivienda',
  
  // Servicios y suscripciones
  'Netflix': 'Servicios y suscripciones',
  'Spotify': 'Servicios y suscripciones',
  'HBO Max': 'Servicios y suscripciones',
  'Disney+': 'Servicios y suscripciones',
  'Amazon Prime': 'Servicios y suscripciones',
  'Teléfono': 'Servicios y suscripciones',
  
  // Salud y bienestar
  'Farmacia': 'Salud y bienestar',
  'Médico': 'Salud y bienestar',
  'Dentista': 'Salud y bienestar',
  'Gym': 'Salud y bienestar',
  
  // Entretenimiento y estilo de vida
  'Cine': 'Entretenimiento y estilo de vida',
  'Bar y Copas': 'Entretenimiento y estilo de vida',
  'Night Club': 'Entretenimiento y estilo de vida',
  'Conciertos': 'Entretenimiento y estilo de vida',
  'Eventos': 'Entretenimiento y estilo de vida',
  'Ropa': 'Entretenimiento y estilo de vida',
  'Amazon': 'Entretenimiento y estilo de vida',
  'Mercado Libre': 'Entretenimiento y estilo de vida',
  'Tecnología': 'Entretenimiento y estilo de vida',
};

const CategoryExpenses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get('category') || '';
  
  const [viewMode] = useState<'mensual'>('mensual');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<number>(0);

  useEffect(() => {
    if (categoryName) {
      fetchData();
    }
  }, [currentMonth, categoryName]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Calcular rango de fechas del mes actual
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Obtener presupuesto configurado primero
      const { data: budgetData } = await supabase
        .from('category_budgets')
        .select('*, categories!inner(id, name)')
        .eq('user_id', user.id)
        .eq('categories.name', categoryName)
        .maybeSingle();

      if (budgetData) {
        setBudget(Number(budgetData.monthly_budget));
      }

      // Obtener IDs de categorías que pertenecen a esta categoría de presupuesto
      const categoryIds = Object.entries(categoryMapping)
        .filter(([_, budgetCat]) => budgetCat === categoryName)
        .map(([specificCat, _]) => specificCat);

      // Si la categoría de presupuesto no está en el mapeo, usar el nombre directo
      if (categoryIds.length === 0) {
        categoryIds.push(categoryName);
      }

      // Obtener transacciones filtradas en el servidor
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, categories!inner(name, color)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .in('categories.name', categoryIds)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      setTransactions(transactionsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGastos = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const percentUsed = budget > 0 ? (totalGastos / budget) * 100 : 0;

  const handlePreviousPeriod = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextPeriod = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getPeriodLabel = () => {
    return currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header fijo */}
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-12 w-12"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {getCategoryEmoji(categoryName)} {categoryName}
            </h1>
            <p className="text-sm text-muted-foreground">Detalle de gastos</p>
          </div>
        </div>
      </div>

      {/* Period Navigation */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousPeriod}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="bg-white rounded-[20px] shadow-xl px-4 py-2 border border-blue-100">
            <p className="text-foreground font-medium capitalize text-center">
              {getPeriodLabel()}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPeriod}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Summary Card fijo */}
        <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-red-100 animate-fade-in sticky top-0 z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/20">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/60 mb-1 font-medium">
                Total Gastado
              </p>
              <p className="text-3xl sm:text-4xl font-bold leading-tight break-words text-red-600">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {budget > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">Presupuesto:</span>
                <span className="text-lg font-bold text-foreground">
                  ${budget.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Transacciones:</span>
              <span className="text-lg font-bold text-foreground">{transactions.length}</span>
            </div>
            {budget > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">Uso del presupuesto:</span>
                <Badge 
                  variant={percentUsed >= 100 ? "destructive" : percentUsed >= 80 ? "secondary" : "default"}
                  className="text-sm"
                >
                  {percentUsed.toFixed(0)}%
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Lista de transacciones scrolleable */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Historial de Gastos
          </h3>
          
          {transactions.length === 0 ? (
            <Card className="p-6 bg-white rounded-[20px] shadow-xl text-center border border-blue-100">
              <p className="text-muted-foreground">No hay gastos registrados en esta categoría</p>
            </Card>
          ) : (
            transactions.map((transaction, index) => {
              const transactionDate = new Date(transaction.transaction_date);
              const categoryEmoji = transaction.categories ? getCategoryEmoji(transaction.categories.name) : '💸';
              const capitalizedDescription = transaction.description.charAt(0).toUpperCase() + transaction.description.slice(1);
              const capitalizedPaymentMethod = transaction.payment_method 
                ? transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1) 
                : '';
              
              return (
                <Card 
                  key={transaction.id} 
                  className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all animate-fade-in active:scale-95"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    {/* Logo de categoría */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(0,55%,40%)] to-[hsl(0,65%,35%)] flex items-center justify-center flex-shrink-0 border border-[hsl(0,60%,45%)]/70 shadow-md">
                      <span className="text-base">{categoryEmoji}</span>
                    </div>
                    
                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm leading-tight">
                        {capitalizedDescription}
                      </h4>
                      <p className="text-xs text-foreground/80 font-medium leading-tight">
                        {transactionDate.toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {transaction.categories && (
                          <Badge 
                            className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(0,60%,45%)] to-[hsl(0,70%,40%)] text-white border-0 shadow-sm px-2 py-0.5"
                          >
                            {transaction.categories.name.charAt(0).toUpperCase() + transaction.categories.name.slice(1)}
                          </Badge>
                        )}
                        {transaction.payment_method && (
                          <Badge 
                            className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(280,60%,45%)] to-[hsl(280,70%,40%)] text-white border-0 shadow-sm px-2 py-0.5"
                          >
                            {capitalizedPaymentMethod}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Monto */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-foreground">
                        -${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryExpenses;
