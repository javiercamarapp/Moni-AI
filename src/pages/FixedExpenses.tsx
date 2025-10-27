import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CreditCard, TrendingDown, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '@/components/BottomNav';

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  paymentMethod: string;
  account: string;
  occurrences: number;
  lastPaymentDate: string;
  icon: string;
  consistency: number;
}

export default function FixedExpenses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [totalMonthly, setTotalMonthly] = useState(0);

  const handleBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate(-1);
    }
  };

  const { data: expenses = [], isLoading: loading } = useQuery({
    queryKey: ['expense-patterns', 'fixed'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return [];
      }

      const { data: allExpenses, error: expensesError } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .order('transaction_date', { ascending: false });

      if (expensesError) throw expensesError;

      if (allExpenses && allExpenses.length > 0) {
        const { data: result, error: aiError } = await supabase.functions.invoke('detect-expense-patterns', {
          body: { userId: user.id }
        });

        console.log('📥 Fixed expenses result:', result);
        console.log('📊 Fixed expenses array:', result?.fixed?.expenses);

        if (aiError) throw aiError;
        return result?.fixed?.expenses || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const total = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    setTotalMonthly(total);
  }, [expenses]);

  return (
    <div className="min-h-screen animated-wave-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Gastos Fijos</h1>
              <p className="text-sm text-gray-500">Mismo monto y concepto cada mes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Total mensual */}
        <Card className="p-6 rounded-[20px] shadow-xl animate-fade-in border-orange-100 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-orange-100 rounded-full border border-orange-200">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Gasto Fijo Mensual</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                ${totalMonthly.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="flex justify-between text-sm text-foreground/70">
            <span>Gastos fijos detectados:</span>
            <span className="font-semibold text-foreground">{expenses.length}</span>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-orange-100">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-foreground/70">Analizando tus transacciones...</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && expenses.length === 0 && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-orange-100">
            <p className="text-foreground/70 mb-4">No se detectaron gastos fijos</p>
            <p className="text-sm text-foreground/50">La IA busca gastos con el mismo monto y concepto cada mes</p>
          </Card>
        )}

        {/* Expenses list */}
        {!loading && expenses.map((expense: FixedExpense, index) => (
          <Card 
            key={expense.id}
            className="p-3 bg-white rounded-[16px] shadow-lg border border-orange-100 hover:scale-105 transition-all animate-fade-in"
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
                  <Badge className="bg-green-100 text-green-800 shrink-0 text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {expense.consistency.toFixed(0)}% consistente
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-foreground/70">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-semibold text-foreground text-base">
                      ${expense.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-foreground/50">/ {expense.frequency}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>{expense.paymentMethod} • {expense.account}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Detectado en <span className="font-medium text-foreground">{expense.occurrences} meses</span></span>
                  </div>

                  <div className="text-[10px] text-foreground/50">
                    Último pago: {new Date(expense.lastPaymentDate).toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
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
