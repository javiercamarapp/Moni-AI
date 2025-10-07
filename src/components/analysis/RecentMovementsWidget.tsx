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
      <div className="space-y-3">
        {recentTransactions.length === 0 ? (
          <p className="text-white/70 text-sm text-center py-4">
            No hay transacciones registradas aún
          </p>
        ) : (
          recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-white">
                  {transaction.description}
                </p>
                <p className="text-xs text-white">
                  {transaction.categories?.name || 'Sin categoría'} • {new Date(transaction.transaction_date).toLocaleDateString('es-MX')}
                </p>
              </div>
              <span className={`text-sm font-semibold ${transaction.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                {transaction.type === 'ingreso' ? '+' : '-'}${Math.abs(Number(transaction.amount))}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
