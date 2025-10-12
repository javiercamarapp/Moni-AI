import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '@/components/BottomNav';

interface DailyExpense {
  id: string;
  name: string;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  frequency: string;
  category: string;
  occurrences: number;
  monthsPresent: number;
  icon: string;
}

const getExpenseIcon = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('luz') || lowerName.includes('cfe') || lowerName.includes('electric')) return '💡';
  if (lowerName.includes('agua') || lowerName.includes('sacmex')) return '💧';
  if (lowerName.includes('gas')) return '🔥';
  if (lowerName.includes('teléfono') || lowerName.includes('telcel') || lowerName.includes('movistar')) return '📱';
  if (lowerName.includes('internet') || lowerName.includes('izzi') || lowerName.includes('telmex')) return '📡';
  if (lowerName.includes('gasolina') || lowerName.includes('combustible')) return '⛽';
  if (lowerName.includes('comida') || lowerName.includes('super') || lowerName.includes('mercado')) return '🛒';
  if (lowerName.includes('transporte') || lowerName.includes('metro') || lowerName.includes('uber')) return '🚇';
  return '📋';
};

const getVariabilityColor = (min: number, max: number, avg: number): string => {
  const variance = ((max - min) / avg) * 100;
  if (variance < 20) return 'text-green-600';
  if (variance < 50) return 'text-yellow-600';
  return 'text-red-600';
};

export default function DailyExpenses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [totalMonthly, setTotalMonthly] = useState(0);

  const { data: expenses = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['daily-expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return [];
      }

      // Obtener TODAS las transacciones de gastos para análisis completo
      const { data: allExpenses, error: expensesError } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .order('transaction_date', { ascending: false });

      if (expensesError) throw expensesError;

      if (allExpenses && allExpenses.length > 0) {
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('detect-daily-expenses', {
          body: { transactions: allExpenses }
        });

        if (aiError) throw aiError;

        const uniqueExpenses = new Map();
        (aiResult?.expenses || []).forEach((exp: any) => {
          const normalizedName = exp.description.toLowerCase()
            .replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '')
            .replace(/\s*\d{4}$/g, '')
            .trim();
          
          if (!uniqueExpenses.has(normalizedName)) {
            // Si monthsPresent no viene en la respuesta, usar occurrences como estimado
            const monthsPresent = exp.monthsPresent || Math.min(exp.occurrences || 1, 12);
            
            uniqueExpenses.set(normalizedName, {
              id: `exp-${Date.now()}-${Math.random()}`,
              name: exp.description.replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '').trim(),
              averageAmount: Number(exp.averageAmount),
              minAmount: Number(exp.minAmount),
              maxAmount: Number(exp.maxAmount),
              frequency: exp.frequency || 'mensual',
              category: exp.categoryName || 'Servicios',
              occurrences: exp.occurrences || 1,
              monthsPresent: monthsPresent,
              icon: getExpenseIcon(exp.description),
            });
          }
        });

        return Array.from(uniqueExpenses.values());
      }
      return [];
    },
    staleTime: 1000 * 60 * 10, // Cache por 10 minutos
    gcTime: 1000 * 60 * 15, // Garbage collection después de 15 minutos
  });

  useEffect(() => {
    if (loading) {
      toast({
        title: "Analizando todo tu historial...",
        description: "IA está detectando gastos consistentes de 6+ meses",
      });
    } else if (expenses.length > 0) {
      toast({
        title: "¡Listo!",
        description: `Se detectaron ${expenses.length} gastos cotidianos consistentes`,
      });
    }
  }, [loading]);

  useEffect(() => {
    const total = expenses.reduce((sum: number, exp: DailyExpense) => {
      const amount = exp.averageAmount;
      switch (exp.frequency.toLowerCase()) {
        case 'anual':
          return sum + (amount / 12);
        case 'semanal':
          return sum + (amount * 4);
        case 'quincenal':
          return sum + (amount * 2);
        default:
          return sum + amount;
      }
    }, 0);
    setTotalMonthly(total);
  }, [expenses]);

  return (
    <div className="min-h-screen animated-wave-bg pb-24">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/gastos')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gastos Cotidianos</h1>
            <p className="text-xs sm:text-sm text-foreground/70">Pagados 6+ meses consecutivos</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={loading}
          className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Total mensual */}
        <Card className="p-6 rounded-[20px] shadow-xl animate-fade-in border-blue-100 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-100 rounded-full border border-orange-200">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Gasto Mensual Estimado</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                ${totalMonthly.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-foreground/50 mt-1">Basado en frecuencia de pago</p>
            </div>
          </div>
          <div className="flex justify-between text-sm text-foreground/70">
            <span>Gastos variables:</span>
            <span className="font-semibold text-foreground">{expenses.length}</span>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-blue-100">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-foreground/70 mb-2">Analizando todo tu historial...</p>
            <p className="text-xs text-foreground/50">Esto puede tomar unos segundos al detectar patrones de 6+ meses</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && expenses.length === 0 && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-blue-100">
            <p className="text-foreground/70 mb-4">No se detectaron gastos cotidianos consistentes</p>
            <p className="text-sm text-foreground/50">La IA requiere gastos pagados en 6+ meses diferentes para identificar patrones</p>
          </Card>
        )}

        {/* Expenses list */}
        {!loading && expenses.map((expense, index) => (
          <Card 
            key={expense.id}
            className="p-3 bg-white rounded-[16px] shadow-lg border border-blue-100 hover:scale-105 transition-all animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 border border-orange-300">
                <span className="text-xl">{expense.icon}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-bold text-foreground text-base truncate">{expense.name}</h3>
                  <Badge className="bg-orange-100 text-orange-800 shrink-0 text-xs">
                    {expense.frequency}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-foreground/70">
                  {/* Average amount */}
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-semibold text-foreground text-base">
                      ${expense.averageAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px]">promedio</span>
                  </div>

                  {/* Range */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                      <span className={getVariabilityColor(expense.minAmount, expense.maxAmount, expense.averageAmount)}>
                        ${expense.minAmount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <span>-</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                      <span className={getVariabilityColor(expense.minAmount, expense.maxAmount, expense.averageAmount)}>
                        ${expense.maxAmount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Occurrences */}
                  <div className="text-[10px] text-foreground/50">
                    Detectado en {expense.monthsPresent} meses • {expense.occurrences} {expense.occurrences === 1 ? 'pago' : 'pagos'} • {expense.category}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
