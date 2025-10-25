import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'income' | 'expense';
  category_name?: string;
  category_color?: string;
}

// Mapeo de categorías a emojis
const categoryEmojis: Record<string, string> = {
  'restaurante': '🍽️',
  'restaurantes': '🍽️',
  'comida': '🍔',
  'alimentos': '🛒',
  'supermercado': '🛒',
  'cafetería': '☕',
  'entretenimiento': '🎬',
  'servicios': '⚡',
  'auto': '🚗',
  'gasolina': '⛽',
  'uber': '🚕',
  'salario': '💼',
  'freelance': '💻',
  'inversiones': '📈',
  'otros ingresos': '💰',
};

const getCategoryEmoji = (categoryName: string | undefined, type: string): string => {
  if (!categoryName) return type === 'income' ? '💰' : '💸';
  const lowerName = categoryName.toLowerCase();
  return categoryEmojis[lowerName] || (type === 'income' ? '💰' : '💸');
};

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

      // Obtener las últimas 50 transacciones con sus categorías
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          description,
          transaction_date,
          type,
          categories (
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Procesar las transacciones
      const processedTransactions: Transaction[] = (transactionsData || []).map((t: any) => ({
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        transaction_date: t.transaction_date,
        type: t.type,
        category_name: t.categories?.name,
        category_color: t.categories?.color,
      }));

      setTransactions(processedTransactions);

      // Calcular totales
      const income = processedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = processedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

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
      <div className="p-4 flex items-center gap-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Movimientos</h1>
          <p className="text-xs text-muted-foreground">Últimos 50 movimientos</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 rounded-[16px] shadow-lg border border-green-200/50 bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-green-800 font-medium">Ingresos</p>
            </div>
            <p className="text-lg font-bold text-green-700">
              ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="p-3 rounded-[16px] shadow-lg border border-red-200/50 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-xs text-red-800 font-medium">Gastos</p>
            </div>
            <p className="text-lg font-bold text-red-700">
              ${totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Lista de transacciones */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-3 rounded-[16px] animate-pulse bg-white/70">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-blue-100">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="font-bold text-foreground mb-2">No hay movimientos</h3>
            <p className="text-sm text-muted-foreground">
              Aquí aparecerán tus transacciones
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction, index) => {
              const isIncome = transaction.type === 'income';
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="p-3 rounded-[16px] shadow-md border border-gray-200/50 bg-white/80 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between gap-3">
                      {/* Icono y detalles */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                          ${isIncome 
                            ? 'bg-gradient-to-br from-green-100 to-green-200' 
                            : 'bg-gradient-to-br from-red-100 to-red-200'
                          }
                        `}>
                          <span className="text-xl">
                            {getCategoryEmoji(transaction.category_name, transaction.type)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {transaction.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transaction.transaction_date), 'd MMM yyyy', { locale: es })}
                            </p>
                            {transaction.category_name && (
                              <Badge 
                                className="text-[8px] px-1.5 py-0 h-4"
                                style={{ 
                                  backgroundColor: transaction.category_color || '#e5e7eb',
                                  color: '#1f2937'
                                }}
                              >
                                {transaction.category_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Monto */}
                      <div className="text-right flex-shrink-0">
                        <p className={`text-base font-bold ${
                          isIncome ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {isIncome ? '+' : '-'}${transaction.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
