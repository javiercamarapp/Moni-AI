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
    <div className="min-h-screen animated-wave-bg pb-24">
      <div className="mx-4 pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {getCategoryEmoji(categoryName)} {categoryName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Gastos del mes
            </p>
          </div>
        </div>

        {/* Period Navigation */}
        <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousPeriod}
              className="rounded-full hover:bg-primary/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <p className="text-sm font-medium text-foreground capitalize">
                {getPeriodLabel()}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPeriod}
              className="rounded-full hover:bg-primary/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Summary Card */}
        <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gastado</p>
                <p className="text-2xl font-bold text-destructive">
                  ${totalGastos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
            {budget > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Presupuesto</p>
                <p className="text-lg font-semibold text-foreground">
                  ${budget.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
                <Badge 
                  variant={percentUsed >= 100 ? "destructive" : percentUsed >= 80 ? "secondary" : "default"}
                  className="mt-1"
                >
                  {percentUsed.toFixed(0)}% usado
                </Badge>
              </div>
            )}
          </div>
          
          {transactions.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {transactions.length} transacción{transactions.length !== 1 ? 'es' : ''} en este período
            </div>
          )}
        </Card>

        {/* Transactions List */}
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <Card className="p-8 bg-white rounded-[20px] shadow-xl border border-blue-100 text-center">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-base font-semibold text-foreground mb-1">
                Sin gastos registrados
              </p>
              <p className="text-sm text-muted-foreground">
                No hay transacciones en esta categoría para el período seleccionado
              </p>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card 
                key={transaction.id} 
                className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: transaction.categories?.color || '#f0f0f0',
                          borderColor: transaction.categories?.color || '#d0d0d0'
                        }}
                      >
                        {transaction.categories?.name || 'Sin categoría'}
                      </Badge>
                      {transaction.frequency && transaction.frequency !== 'once' && (
                        <Badge variant="secondary" className="text-xs">
                          {transaction.frequency === 'daily' ? 'Diario' : 
                           transaction.frequency === 'weekly' ? 'Semanal' :
                           transaction.frequency === 'biweekly' ? 'Quincenal' :
                           transaction.frequency === 'monthly' ? 'Mensual' : 
                           transaction.frequency}
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-foreground mb-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.transaction_date).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {(transaction.payment_method || transaction.account) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.payment_method} {transaction.account && `• ${transaction.account}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">
                      ${Number(transaction.amount).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryExpenses;
