import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '@/components/BottomNav';

interface AntExpense {
  id: string;
  category: string;
  totalSpent: number;
  avgAmount: number;
  occurrences: number;
  icon: string;
  lastDate: string;
}

export default function AntExpenses() {
  const navigate = useNavigate();
  const location = useLocation();
  const [totalSpent, setTotalSpent] = useState(0);

  const handleBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate(-1);
    }
  };

  const { data: expenses = [], isLoading: loading } = useQuery({
    queryKey: ['ant-expenses'],
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
          body: { transactions: allExpenses, type: 'ant' }
        });

        if (aiError) throw aiError;
        return result?.expenses || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const total = expenses.reduce((sum: number, exp: any) => sum + exp.totalSpent, 0);
    setTotalSpent(total);
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
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Gastos Hormiga 🐜</h1>
              <p className="text-sm text-gray-500">Gastos pequeños que suman mucho</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Total acumulado */}
        <Card className="p-6 rounded-[20px] shadow-xl animate-fade-in border-yellow-100 bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-yellow-100 rounded-full border border-yellow-200">
              <span className="text-2xl">🐜</span>
            </div>
            <div>
              <p className="text-sm text-foreground/70">Total Acumulado</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                ${totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              💡 Los gastos hormiga son compras menores a $100 que, sumados, representan un impacto significativo en tu presupuesto
            </p>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-yellow-100">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-foreground/70">Analizando tus transacciones...</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && expenses.length === 0 && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-yellow-100">
            <p className="text-foreground/70 mb-4">No se detectaron gastos hormiga</p>
            <p className="text-sm text-foreground/50">La IA busca gastos menores a $100</p>
          </Card>
        )}

        {/* Expenses list */}
        {!loading && expenses.map((expense: AntExpense, index) => (
          <Card 
            key={expense.id}
            className="p-3 bg-white rounded-[16px] shadow-lg border border-yellow-100 hover:scale-105 transition-all animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center flex-shrink-0 border border-yellow-300">
                <span className="text-xl">{expense.icon}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-bold text-foreground text-base truncate">{expense.category}</h3>
                  <Badge className="bg-yellow-100 text-yellow-800 shrink-0 text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {expense.occurrences} veces
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-foreground/70">
                  <div className="flex items-center justify-between">
                    <span>Total gastado:</span>
                    <span className="font-bold text-foreground text-base text-yellow-600">
                      ${expense.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Promedio por compra:</span>
                    <span className="font-medium text-foreground">
                      ${expense.avgAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="mt-2 bg-yellow-50 rounded p-2 border border-yellow-200">
                    <p className="text-[10px] text-yellow-700">
                      💰 Si reduces este gasto en 50%, ahorrarías ${(expense.totalSpent / 2).toLocaleString('es-MX')} al mes
                    </p>
                  </div>

                  <div className="text-[10px] text-foreground/50">
                    Última compra: {new Date(expense.lastDate).toLocaleDateString('es-MX', { 
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
