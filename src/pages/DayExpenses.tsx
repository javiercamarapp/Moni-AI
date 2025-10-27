import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingDown, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import BottomNav from '@/components/BottomNav';

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

const DayExpenses = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Últimos 7 días
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('transaction_date', today.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      setTransactions(transactionsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group transactions by day
  interface DayData {
    dayOfWeek: string;
    transactions: any[];
    total: number;
    date: Date;
  }

  const transactionsByDay = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date);
    const dayKey = date.toLocaleDateString('es-MX', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const dayOfWeek = date.toLocaleDateString('es-MX', { weekday: 'long' });
    
    if (!acc[dayKey]) {
      acc[dayKey] = {
        dayOfWeek,
        transactions: [],
        total: 0,
        date: date
      };
    }
    
    acc[dayKey].transactions.push(transaction);
    acc[dayKey].total += Number(transaction.amount);
    
    return acc;
  }, {} as Record<string, DayData>);

  const sortedDays = Object.entries(transactionsByDay).sort((a: [string, DayData], b: [string, DayData]) => 
    b[1].date.getTime() - a[1].date.getTime()
  );

  const totalGastos = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
              📅 Últimos 7 Días
            </h1>
            <p className="text-sm text-muted-foreground">Gastos de la última semana</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-red-100 animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/20">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/60 mb-1 font-medium">
                Total (7 días)
              </p>
              <p className="text-3xl sm:text-4xl font-bold leading-tight break-words text-red-600">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Días con gastos:</span>
              <span className="text-lg font-bold text-foreground">{sortedDays.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Total transacciones:</span>
              <span className="text-lg font-bold text-foreground">{transactions.length}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {sortedDays.length === 0 ? (
            <Card className="p-6 bg-white rounded-[20px] shadow-xl text-center border border-blue-100">
              <p className="text-muted-foreground">No hay gastos registrados en los últimos 7 días</p>
            </Card>
          ) : (
            sortedDays.map(([dayKey, dayData]: [string, DayData]) => (
              <div key={dayKey} className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground capitalize">
                      {dayData.dayOfWeek}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">{dayKey}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      -${dayData.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayData.transactions.length} {dayData.transactions.length === 1 ? 'gasto' : 'gastos'}
                    </p>
                  </div>
                </div>

                {dayData.transactions.map((transaction, index) => {
                  const categoryEmoji = transaction.categories ? getCategoryEmoji(transaction.categories.name) : '💸';
                  const capitalizedDescription = transaction.description.charAt(0).toUpperCase() + transaction.description.slice(1);
                  const capitalizedPaymentMethod = transaction.payment_method 
                    ? transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1) 
                    : '';
                  
                  return (
                    <Card 
                      key={transaction.id} 
                      className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all animate-fade-in active:scale-95"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(0,55%,40%)] to-[hsl(0,65%,35%)] flex items-center justify-center flex-shrink-0 border border-[hsl(0,60%,45%)]/70 shadow-md">
                          <span className="text-base">{categoryEmoji}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-sm leading-tight">
                            {capitalizedDescription}
                          </h4>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {transaction.categories && (
                              <Badge 
                                className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(0,60%,45%)] to-[hsl(0,70%,40%)] text-white border-0 shadow-sm px-2 py-0.5"
                              >
                                {transaction.categories.name.charAt(0).toUpperCase() + transaction.categories.name.slice(1)}
                              </Badge>
                            )}
                            {transaction.payment_method && (
                              <Badge 
                                className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(280,60%,45%)] to-[hsl(280,70%,40%)] text-white border-0 shadow-sm px-2 py-0.5"
                              >
                                {capitalizedPaymentMethod}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-foreground">
                            -${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default DayExpenses;
