import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CreditCard, TrendingDown, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
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

const getSubscriptionUrl = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('netflix')) return 'https://www.netflix.com';
  if (lowerName.includes('spotify')) return 'https://www.spotify.com';
  if (lowerName.includes('disney')) return 'https://www.disneyplus.com';
  if (lowerName.includes('prime') || lowerName.includes('amazon')) return 'https://www.amazon.com/prime';
  if (lowerName.includes('hbo')) return 'https://www.hbomax.com';
  if (lowerName.includes('apple music')) return 'https://music.apple.com';
  if (lowerName.includes('apple tv')) return 'https://tv.apple.com';
  if (lowerName.includes('youtube')) return 'https://www.youtube.com/premium';
  if (lowerName.includes('shopify')) return 'https://www.shopify.com';
  if (lowerName.includes('adobe')) return 'https://www.adobe.com';
  if (lowerName.includes('canva')) return 'https://www.canva.com';
  if (lowerName.includes('dropbox')) return 'https://www.dropbox.com';
  if (lowerName.includes('google')) return 'https://one.google.com';
  if (lowerName.includes('icloud')) return 'https://www.icloud.com';
  if (lowerName.includes('microsoft') || lowerName.includes('office')) return 'https://www.microsoft.com/microsoft-365';
  if (lowerName.includes('zoom')) return 'https://zoom.us';
  return null;
};

export default function Subscriptions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [totalMonthly, setTotalMonthly] = useState(0);

  const handleBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate(-1);
    }
  };

  const { data: subscriptions = [], isLoading: loading } = useQuery({
    queryKey: ['subscriptions'],
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
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('detect-subscriptions', {
          body: { transactions: allExpenses }
        });

        if (aiError) throw aiError;

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

        return Array.from(uniqueSubs.values());
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const total = subscriptions.reduce((sum: number, sub: any) => {
      const amount = sub.amount;
      switch (sub.frequency.toLowerCase()) {
        case 'anual':
          return sum + (amount / 12);
        case 'semanal':
          return sum + (amount * 4);
        case 'quincenal':
          return sum + (amount * 2);
        default:
          return sum + amount;
      }
    }, 0);
    setTotalMonthly(total);
  }, [subscriptions]);

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
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Suscripciones</h1>
              <p className="text-sm text-gray-500">Pagadas 3+ meses • Monto fijo</p>
            </div>
          </div>
        </div>
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
            
            {/* Subscription link button */}
            {getSubscriptionUrl(sub.name) && (
              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
                  onClick={() => window.open(getSubscriptionUrl(sub.name)!, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Ir a {sub.name}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
