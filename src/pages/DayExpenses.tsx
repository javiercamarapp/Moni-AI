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
  const [searchParams] = useSearchParams();
  const selectedDay = searchParams.get('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Obtener todo el mes actual
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      setTransactions(transactionsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group transactions by day of week, then by specific date
  interface DateGroup {
    date: Date;
    dateString: string;
    transactions: any[];
    total: number;
  }

  interface DayOfWeekData {
    dayOfWeek: string;
    dayOfWeekShort: string;
    dates: DateGroup[];
    total: number;
  }

  const daysOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const daysFullNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const transactionsByDayOfWeek = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date);
    const dayOfWeekIndex = (date.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
    const dayOfWeekShort = daysOrder[dayOfWeekIndex];
    const dayOfWeek = daysFullNames[dayOfWeekIndex];
    const dateString = date.toLocaleDateString('es-MX', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    if (!acc[dayOfWeekShort]) {
      acc[dayOfWeekShort] = {
        dayOfWeek,
        dayOfWeekShort,
        dates: [],
        total: 0
      };
    }
    
    let dateGroup = acc[dayOfWeekShort].dates.find((d: DateGroup) => d.dateString === dateString);
    if (!dateGroup) {
      dateGroup = {
        date,
        dateString,
        transactions: [],
        total: 0
      };
      acc[dayOfWeekShort].dates.push(dateGroup);
    }
    
    dateGroup.transactions.push(transaction);
    dateGroup.total += Number(transaction.amount);
    acc[dayOfWeekShort].total += Number(transaction.amount);
    
    return acc;
  }, {} as Record<string, DayOfWeekData>);

  // Filter by selected day if provided, otherwise show all
  const sortedDaysOfWeek = selectedDay
    ? (transactionsByDayOfWeek[selectedDay] ? [transactionsByDayOfWeek[selectedDay]] : [])
    : daysOrder
        .filter(day => transactionsByDayOfWeek[day])
        .map(day => transactionsByDayOfWeek[day]);

  // Sort dates within each day of week (most recent first)
  sortedDaysOfWeek.forEach(dayData => {
    dayData.dates.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  const totalGastos = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getMonthLabel = () => {
    return currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="page-standard min-h-screen pb-20">
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[#f5f0ee]/80 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/analysis')}
            className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
              📅 {selectedDay ? `Gastos de ${selectedDay}` : 'Gastos por Día de la Semana'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedDay ? 'Todas las fechas del mes' : 'Patrones del mes'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="bg-white rounded-[20px] shadow-xl px-4 py-2 border border-blue-100">
            <p className="text-foreground font-medium capitalize text-center">
              {getMonthLabel()}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
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
                Total del Mes
              </p>
              <p className="text-3xl sm:text-4xl font-bold leading-tight break-words text-red-600">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Días de la semana:</span>
              <span className="text-lg font-bold text-foreground">{sortedDaysOfWeek.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Total transacciones:</span>
              <span className="text-lg font-bold text-foreground">{transactions.length}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {sortedDaysOfWeek.length === 0 ? (
            <Card className="p-6 bg-white rounded-[20px] shadow-xl text-center border border-blue-100">
              <p className="text-muted-foreground">No hay gastos registrados este mes</p>
            </Card>
          ) : (
            sortedDaysOfWeek.map((dayOfWeekData) => (
              <div key={dayOfWeekData.dayOfWeekShort} className="space-y-3 animate-fade-in">
                {/* Header del día de la semana */}
                <div className="flex items-center justify-between bg-white rounded-[20px] shadow-xl p-4 border border-blue-100">
                  <div>
                    <h3 className="text-xl font-bold text-foreground capitalize">
                      {dayOfWeekData.dayOfWeek}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {dayOfWeekData.dates.length} {dayOfWeekData.dates.length === 1 ? 'fecha' : 'fechas'} en el mes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      -${dayOfWeekData.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total del día
                    </p>
                  </div>
                </div>

                {/* Fechas específicas dentro del día */}
                {dayOfWeekData.dates.map((dateGroup) => (
                  <div key={dateGroup.dateString} className="ml-4 space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
                      <p className="text-sm font-semibold text-foreground capitalize">
                        📅 {dateGroup.dateString}
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        -${dateGroup.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Transacciones de esta fecha */}
                    {dateGroup.transactions.map((transaction, index) => {
                      const categoryEmoji = transaction.categories ? getCategoryEmoji(transaction.categories.name) : '💸';
                      const capitalizedDescription = transaction.description.charAt(0).toUpperCase() + transaction.description.slice(1);
                      const capitalizedPaymentMethod = transaction.payment_method 
                        ? transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1) 
                        : '';
                      
                      return (
                        <Card 
                          key={transaction.id} 
                          className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all animate-fade-in active:scale-95 ml-4"
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
                ))}
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
