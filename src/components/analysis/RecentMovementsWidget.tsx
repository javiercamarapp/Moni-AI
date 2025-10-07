import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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

export default function RecentMovementsWidget() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchTransactions();
    
    // Configurar actualización en tiempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transactions'
        },
        () => {
          // Recargar transacciones cuando haya cambios
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  return (
    <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm sm:text-base font-semibold text-white">Movimientos Recientes</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-white hover:bg-white/10 hover:scale-105 transition-transform duration-200"
        >
          Ver todos
        </Button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentTransactions.length === 0 ? (
          <p className="text-white/70 text-sm text-center py-4">
            No hay transacciones registradas aún
          </p>
        ) : (
          recentTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">
                      {transaction.type === 'ingreso' ? '💰' : '💳'}
                    </span>
                    <p className="text-xs font-medium text-white">
                      {transaction.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span>{new Date(transaction.transaction_date).toLocaleDateString('es-MX')}</span>
                    {transaction.categories?.name && (
                      <>
                        <span>•</span>
                        <span>{transaction.categories.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-bold ${transaction.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.type === 'ingreso' ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
