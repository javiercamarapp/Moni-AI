import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from 'sonner';

interface FutureEvent {
  date: string;
  type: "ingreso" | "gasto";
  description: string;
  amount: number;
  confidence: "high" | "medium" | "low";
}

export default function ProximosMovimientos() {
  const navigate = useNavigate();
  const [futureEvents, setFutureEvents] = useState<FutureEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    fetchAIPredictions();
  }, []);

  const fetchAIPredictions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      console.log('Calling predict-future-transactions...');
      
      const { data, error } = await supabase.functions.invoke('predict-future-transactions', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Error calling function:', error);
        toast.error('Error al predecir movimientos');
        throw error;
      }

      console.log('Predictions received:', data);

      const predictions: FutureEvent[] = data.predictions || [];
      setFutureEvents(predictions);

      // Calcular totales
      const income = predictions
        .filter(e => e.type === 'ingreso')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const expense = predictions
        .filter(e => e.type === 'gasto')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Error al cargar predicciones');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const futureDate = parseISO(dateStr);
    const diffTime = futureDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen pb-20">
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
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Próximos Movimientos
              </h1>
              <p className="text-xs text-gray-600">Predicciones con IA de tus futuros gastos e ingresos</p>
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
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Analizando patrones con IA...</p>
            </div>
          ) : futureEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="font-bold text-foreground mb-2">No hay predicciones disponibles</h3>
              <p className="text-sm text-muted-foreground">
                Necesitas más historial de transacciones para generar predicciones
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {futureEvents.map((event, index) => {
                const daysUntil = getDaysUntil(event.date);
                const isUrgent = daysUntil <= 3;
                const isIncome = event.type === "ingreso";
                
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 py-1.5 transition-colors hover:bg-gray-50/50"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      isIncome ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <span className="text-white">{isIncome ? '💰' : '💳'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] text-muted-foreground">
                          {format(parseISO(event.date), "d MMM", { locale: es })}
                        </span>
                        <span className="text-[9px] text-muted-foreground">•</span>
                        <span className="text-[9px] text-muted-foreground">
                          {daysUntil === 0 
                            ? "Hoy" 
                            : daysUntil === 1 
                            ? "Mañana" 
                            : `En ${daysUntil}d`
                          }
                        </span>
                        <span className="text-[9px] text-muted-foreground">•</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded ${getConfidenceColor(event.confidence)} text-white`}>
                          {getConfidenceBadge(event.confidence)}
                        </span>
                        {isUrgent && <AlertCircle className="h-3 w-3 text-red-600" />}
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
