import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  transaction_date: string;
  categories?: {
    name: string;
    color: string;
  } | null;
}

export default function Movimientos() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);

      // Calcular totales
      const income = (data || [])
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expense = (data || [])
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 p-0 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Movimientos</h1>
              <p className="text-xs text-gray-600">Últimos 50 movimientos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-2 rounded-[16px] shadow-lg border border-gray-200/50 bg-white/70 backdrop-blur-xl hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-10 pointer-events-none" />
            <div className="flex items-center gap-1.5 mb-0.5 relative z-10">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <p className="text-[10px] text-foreground font-bold">Ingresos</p>
            </div>
            <p className="text-sm font-bold text-foreground relative z-10">
              ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-2 rounded-[16px] shadow-lg border border-gray-200/50 bg-white/70 backdrop-blur-xl hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 opacity-10 pointer-events-none" />
            <div className="flex items-center gap-1.5 mb-0.5 relative z-10">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-md">
                <TrendingDown className="h-3 w-3 text-white" />
              </div>
              <p className="text-[10px] text-foreground font-bold">Gastos</p>
            </div>
            <p className="text-sm font-bold text-foreground relative z-10">
              ${totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Lista de transacciones */}
        <Card className="bg-white rounded-[20px] shadow-xl border border-blue-100 p-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="font-bold text-foreground mb-2">No hay movimientos</h3>
              <p className="text-sm text-muted-foreground">
                Aquí aparecerán tus transacciones
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-1 pr-4">
                {transactions.map((transaction) => {
                  const isIncome = transaction.type === 'ingreso';
                  return (
                    <div 
                      key={transaction.id}
                      className={`flex items-center gap-2 py-2 px-2 rounded backdrop-blur-sm border transition-all ${
                        isIncome 
                          ? 'bg-green-50/80 border-green-200 hover:bg-green-100/80' 
                          : 'bg-red-50/80 border-red-200 hover:bg-red-100/80'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg shrink-0 ${
                        isIncome
                          ? 'bg-gradient-to-br from-green-400 to-green-600'
                          : 'bg-gradient-to-br from-red-400 to-red-600'
                      }`}>
                        <span className="text-white">{isIncome ? '💰' : '💳'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                          </span>
                          {transaction.categories?.name && (
                            <>
                              <span className="text-[9px] text-muted-foreground">•</span>
                              <span className="text-[9px] text-muted-foreground truncate">
                                {transaction.categories.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs font-black shrink-0 ${
                        isIncome ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isIncome ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  );
}
