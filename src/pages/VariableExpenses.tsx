import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '@/components/BottomNav';

interface VariableExpense {
  id: string;
  name: string;
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
  occurrences: number;
  variance: number;
  icon: string;
  lastTransaction: string;
}

export default function VariableExpenses() {
  const navigate = useNavigate();
  const location = useLocation();
  const [totalAvg, setTotalAvg] = useState(0);

  const handleBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate(-1);
    }
  };

  const { data: expenses = [], isLoading: loading } = useQuery({
    queryKey: ['expense-patterns', 'variable'],
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

        if (aiError) throw aiError;
        return result?.variable?.expenses || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const total = expenses.reduce((sum: number, exp: any) => sum + exp.avgAmount, 0);
    setTotalAvg(total);
  }, [expenses]);

  return (
    <div className="page-standard min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5f0ee]/80 to-transparent backdrop-blur-sm">
        <div className="page-container py-4">
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
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Gastos Variables</h1>
              <p className="text-sm text-gray-500">Montos que varían cada mes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Total promedio */}
        <Card className="p-6 rounded-[20px] shadow-xl animate-fade-in border-violet-100 bg-gradient-to-br from-violet-50 to-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-violet-100 rounded-full border border-violet-200">
              <Zap className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Promedio Mensual</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                ${totalAvg.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="flex justify-between text-sm text-foreground/70">
            <span>Categorías variables:</span>
            <span className="font-semibold text-foreground">{expenses.length}</span>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-violet-100">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-foreground/70">Analizando tus transacciones...</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && expenses.length === 0 && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-violet-100">
            <p className="text-foreground/70 mb-4">No se detectaron gastos variables</p>
            <p className="text-sm text-foreground/50">La IA busca categorías con montos que varían mes a mes</p>
          </Card>
        )}

        {/* Expenses list */}
        {!loading && expenses.map((expense: VariableExpense, index) => (
          <Card 
            key={expense.id}
            className="p-3 bg-white rounded-[16px] shadow-lg border border-violet-100 hover:scale-105 transition-all animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center flex-shrink-0 border border-violet-300">
                <span className="text-xl">{expense.icon}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-bold text-foreground text-base truncate">{expense.name}</h3>
                  <Badge className="bg-violet-100 text-violet-800 shrink-0 text-xs">
                    {expense.occurrences} veces
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-foreground/70">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-violet-500" />
                    <span className="font-semibold text-foreground text-base">
                      ${expense.avgAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-foreground/50">promedio</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                      <span>Mínimo: <span className="font-medium text-foreground">${expense.minAmount.toLocaleString('es-MX')}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                      <span>Máximo: <span className="font-medium text-foreground">${expense.maxAmount.toLocaleString('es-MX')}</span></span>
                    </div>
                  </div>

                  <div className="mt-2 bg-violet-50 rounded p-2 border border-violet-200">
                    <p className="text-[10px] text-violet-700">
                      💡 Variación de ${(expense.maxAmount - expense.minAmount).toLocaleString('es-MX')} entre el monto más bajo y más alto
                    </p>
                  </div>

                  <div className="text-[10px] text-foreground/50">
                    Última transacción: {new Date(expense.lastTransaction).toLocaleDateString('es-MX', { 
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
