import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        .limit(20);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  return (
    <Card className="p-3 bg-gradient-to-br from-[hsl(200,45%,18%)] to-[hsl(220,40%,12%)] card-glow shadow-2xl border-2 border-[hsl(210,50%,35%)]/40 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:scale-105 transition-transform duration-200 active:scale-95">
      {/* Efecto brillante */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" 
           style={{
             backgroundSize: '200% 100%',
             animation: 'shimmer 3s ease-in-out infinite',
           }}
      />
      
      <div className="space-y-2 relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-xs font-bold text-white drop-shadow-lg">📊 Movimientos Recientes</h3>
          <span className="text-[10px] text-white/70 font-semibold">{recentTransactions.length}</span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-3 flex-1 flex flex-col justify-center">
            <p className="text-[10px] text-white/70 mb-1">Sin movimientos</p>
            <p className="text-[9px] text-white/50">Registra tu primer transacción</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 pr-1">
            <div className="space-y-0.5">
              {recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center gap-0.5 sm:gap-2 py-0.5 sm:py-2 px-1 sm:px-3 bg-white/10 rounded backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all min-h-[18px] sm:min-h-[40px]"
                >
                  <div className="w-3 h-3 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[6px] sm:text-base shadow-lg shrink-0">
                    {transaction.type === 'ingreso' ? '💰' : '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[6px] sm:text-sm font-bold text-white truncate leading-none">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[6px] sm:text-[10px] text-white/60">
                        {new Date(transaction.transaction_date).toLocaleDateString('es-MX')}
                      </span>
                      {transaction.categories?.name && (
                        <>
                          <span className="text-[6px] sm:text-[10px] text-white/60">•</span>
                          <span className="text-[6px] sm:text-[10px] text-white/60 truncate">
                            {transaction.categories.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className={`text-[6px] sm:text-base font-black shrink-0 leading-none ${transaction.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'ingreso' ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </Card>
  );
}
