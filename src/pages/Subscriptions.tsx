import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CreditCard, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  paymentMethod: string;
  account: string;
  nextPaymentDate: string;
  lastPaymentDate: string;
  icon: string;
}

const getSubscriptionIcon = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('netflix')) return '🎬';
  if (lowerName.includes('spotify')) return '🎵';
  if (lowerName.includes('disney')) return '🏰';
  if (lowerName.includes('prime') || lowerName.includes('amazon')) return '📦';
  if (lowerName.includes('hbo')) return '🎭';
  if (lowerName.includes('apple')) return '🍎';
  if (lowerName.includes('youtube')) return '📺';
  if (lowerName.includes('gym') || lowerName.includes('gimnasio')) return '💪';
  if (lowerName.includes('internet') || lowerName.includes('telmex') || lowerName.includes('izzi')) return '📡';
  if (lowerName.includes('luz') || lowerName.includes('cfe')) return '💡';
  if (lowerName.includes('agua')) return '💧';
  if (lowerName.includes('gas')) return '🔥';
  if (lowerName.includes('teléfono') || lowerName.includes('telcel')) return '📱';
  return '📋';
};

const calculateNextPaymentDate = (frequency: string): string => {
  const now = new Date();
  switch (frequency.toLowerCase()) {
    case 'mensual':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'anual':
      now.setFullYear(now.getFullYear() + 1);
      break;
    case 'semanal':
      now.setDate(now.getDate() + 7);
      break;
    case 'quincenal':
      now.setDate(now.getDate() + 15);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }
  return now.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Subscriptions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Obtener TODAS las transacciones de gastos para análisis completo
      const { data: allExpenses, error: expensesError } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .order('transaction_date', { ascending: false });

      if (expensesError) throw expensesError;

      if (allExpenses && allExpenses.length > 0) {
        // Use AI to detect subscriptions
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('detect-subscriptions', {
          body: { transactions: allExpenses }
        });

        if (aiError) throw aiError;

        // Group by subscription name
        const uniqueSubs = new Map();
        (aiResult?.subscriptions || []).forEach((sub: any) => {
          const normalizedName = sub.description.toLowerCase()
            .replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '')
            .replace(/\s*\d{4}$/g, '')
            .trim();
          
          if (!uniqueSubs.has(normalizedName)) {
            uniqueSubs.set(normalizedName, {
              id: `sub-${Date.now()}-${Math.random()}`,
              name: sub.description.replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '').trim(),
              amount: Number(sub.amount),
              frequency: sub.frequency || 'mensual',
              category: sub.category || 'Streaming',
              paymentMethod: sub.payment_method || 'Tarjeta de crédito',
              account: sub.account || 'Cuenta principal',
              nextPaymentDate: calculateNextPaymentDate(sub.frequency || 'mensual'),
              lastPaymentDate: new Date(sub.transaction_date).toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              }),
              icon: getSubscriptionIcon(sub.description),
            });
          }
        });

        const detectedSubs = Array.from(uniqueSubs.values());
        setSubscriptions(detectedSubs);

        // Calculate total monthly cost
        const total = detectedSubs.reduce((sum: number, sub: any) => {
          const amount = sub.amount;
          switch (sub.frequency.toLowerCase()) {
            case 'anual':
              return sum + (amount / 12);
            case 'semanal':
              return sum + (amount * 4);
            case 'quincenal':
              return sum + (amount * 2);
            default: // mensual
              return sum + amount;
          }
        }, 0);
        setTotalMonthly(total);
      } else {
        toast({
          title: "Sin transacciones",
          description: "No hay suficientes transacciones para detectar suscripciones",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las suscripciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'mensual':
        return 'bg-blue-100 text-blue-800';
      case 'anual':
        return 'bg-purple-100 text-purple-800';
      case 'semanal':
        return 'bg-green-100 text-green-800';
      case 'quincenal':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-24">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/gastos')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Suscripciones</h1>
            <p className="text-xs sm:text-sm text-foreground/70">Pagadas 3+ meses • Monto fijo</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadSubscriptions}
          disabled={loading}
          className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Total mensual */}
        <Card className="p-6 rounded-[20px] shadow-xl animate-fade-in border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-full border border-blue-200">
              <TrendingDown className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Gasto Mensual Total</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                ${totalMonthly.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="flex justify-between text-sm text-foreground/70">
            <span>Suscripciones activas:</span>
            <span className="font-semibold text-foreground">{subscriptions.length}</span>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-blue-100">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-foreground/70">Analizando tus transacciones...</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && subscriptions.length === 0 && (
          <Card className="p-8 text-center bg-white rounded-[20px] shadow-xl border border-blue-100">
            <p className="text-foreground/70 mb-4">No se detectaron suscripciones activas</p>
            <p className="text-sm text-foreground/50">La IA requiere suscripciones pagadas en 3+ meses para detectarlas</p>
          </Card>
        )}

        {/* Subscriptions list */}
        {!loading && subscriptions.map((sub, index) => (
          <Card 
            key={sub.id}
            className="p-3 bg-white rounded-[16px] shadow-lg border border-blue-100 hover:scale-105 transition-all animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 border border-blue-300">
                <span className="text-xl">{sub.icon}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-bold text-foreground text-base truncate">{sub.name}</h3>
                  <Badge className={`${getFrequencyBadgeColor(sub.frequency)} shrink-0 text-xs`}>
                    {sub.frequency}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-foreground/70">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-semibold text-foreground text-base">
                      ${sub.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>{sub.paymentMethod} • {sub.account}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Próximo cargo: <span className="font-medium text-foreground">{sub.nextPaymentDate}</span></span>
                  </div>

                  <div className="text-[10px] text-foreground/50">
                    Último pago: {sub.lastPaymentDate}
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
