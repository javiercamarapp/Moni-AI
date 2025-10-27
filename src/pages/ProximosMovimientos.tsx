import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, addWeeks, addMonths, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface FutureEvent {
  date: Date;
  type: "income" | "expense" | "subscription" | "ingreso" | "gasto";
  description: string;
  amount: number;
  risk?: "high" | "medium" | "low";
}

export default function ProximosMovimientos() {
  const navigate = useNavigate();
  const [futureEvents, setFutureEvents] = useState<FutureEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    fetchFutureEvents();
  }, []);

  const detectRecurringPayments = (transactions: any[], subscriptions: any[]) => {
    const recurringEvents: FutureEvent[] = [];
    const today = startOfDay(new Date());

    // Detectar suscripciones activas
    subscriptions.forEach(sub => {
      if (!sub.is_active) return;
      
      let nextDate = new Date(sub.next_billing_date);
      for (let i = 0; i < 3; i++) {
        if (isBefore(nextDate, today)) {
          nextDate = addMonths(nextDate, 1);
          continue;
        }
        recurringEvents.push({
          date: nextDate,
          type: "subscription",
          description: sub.name,
          amount: sub.amount,
          risk: calculatePaymentRisk(nextDate, sub.amount)
        });
        nextDate = addMonths(nextDate, 1);
      }
    });

    // Detectar pagos recurrentes de transacciones
    const groupedByDescription = transactions.reduce((acc: any, tx: any) => {
      if (!acc[tx.description]) acc[tx.description] = [];
      acc[tx.description].push(tx);
      return acc;
    }, {});

    Object.entries(groupedByDescription).forEach(([description, txs]: [string, any]) => {
      if (txs.length >= 2) {
        const sortedTxs = txs.sort((a: any, b: any) => 
          new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        );
        
        const intervals = [];
        for (let i = 1; i < sortedTxs.length; i++) {
          const diff = Math.abs(
            new Date(sortedTxs[i].transaction_date).getTime() - 
            new Date(sortedTxs[i-1].transaction_date).getTime()
          );
          intervals.push(diff / (1000 * 60 * 60 * 24));
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avgInterval > 20 && avgInterval < 35) {
          const lastTx = sortedTxs[sortedTxs.length - 1];
          let nextDate = addDays(new Date(lastTx.transaction_date), Math.round(avgInterval));
          
          for (let i = 0; i < 3 && nextDate < addMonths(today, 2); i++) {
            if (isBefore(nextDate, today)) {
              nextDate = addDays(nextDate, Math.round(avgInterval));
              continue;
            }
            recurringEvents.push({
              date: nextDate,
              type: lastTx.type === "ingreso" ? "income" : "expense",
              description: description,
              amount: lastTx.amount,
              risk: calculatePaymentRisk(nextDate, lastTx.amount)
            });
            nextDate = addDays(nextDate, Math.round(avgInterval));
          }
        }
      }
    });

    return recurringEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const calculatePaymentRisk = (date: Date, amount: number): "high" | "medium" | "low" => {
    const today = new Date();
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 3) return "high";
    if (daysUntil <= 7) return "medium";
    return "low";
  };

  const fetchFutureEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Obtener transacciones históricas
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (txError) throw txError;

      const events = detectRecurringPayments(transactions || [], []);
      setFutureEvents(events);

      // Calcular totales
      const income = events
        .filter(e => e.type === 'income' || e.type === 'ingreso')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const expense = events
        .filter(e => e.type === 'expense' || e.type === 'gasto' || e.type === 'subscription')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.error('Error fetching future events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "income":
      case "ingreso":
        return "💰";
      case "subscription":
        return "🔄";
      case "expense":
      case "gasto":
        return "💳";
      default:
        return "📅";
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
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Próximos Movimientos</h1>
              <p className="text-xs text-gray-600">Pagos y cobros proyectados</p>
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

        {/* Lista de próximos movimientos */}
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
          ) : futureEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="font-bold text-foreground mb-2">No hay movimientos próximos</h3>
              <p className="text-sm text-muted-foreground">
                Aquí aparecerán tus pagos y cobros proyectados
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {futureEvents.map((event, index) => {
                const daysUntil = getDaysUntil(event.date);
                const isUrgent = daysUntil <= 3;
                const isIncome = event.type === "income" || event.type === "ingreso";
                
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 py-1.5 transition-colors hover:bg-gray-50/50"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      isIncome
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}>
                      <span className="text-white">{getEventIcon(event.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">
                          {format(event.date, "d MMM", { locale: es })}
                        </span>
                        <span className="text-[9px] text-muted-foreground">•</span>
                        <span className="text-[9px] text-muted-foreground truncate">
                          {daysUntil === 0 
                            ? "Hoy" 
                            : daysUntil === 1 
                            ? "Mañana" 
                            : `En ${daysUntil}d`
                          }
                        </span>
                        {isUrgent && <AlertCircle className="h-3 w-3 text-red-600 ml-auto" />}
                      </div>
                    </div>
                    <p className={`text-xs font-black shrink-0 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}${Number(event.amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {futureEvents.filter(e => getDaysUntil(e.date) <= 3).length > 0 && (
          <Card className="bg-red-50/80 rounded-lg px-4 py-3 border border-red-200">
            <p className="text-xs text-red-700 leading-snug">
              ⚠️ <span className="font-medium">
                {futureEvents.filter(e => getDaysUntil(e.date) <= 3).length} próximos movimientos
              </span> en los próximos 3 días
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
