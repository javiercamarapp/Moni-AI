import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface CategoryData {
  categoria: string;
  monto: number;
  transacciones: number;
}

interface IncomeStatement {
  ingresos: CategoryData[];
  gastos: CategoryData[];
  totalIngresos: number;
  totalGastos: number;
  balance: number;
}

export default function SafeToSpendExplanation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState<IncomeStatement | null>(null);
  const [currentMonth] = useState(new Date());

  useEffect(() => {
    fetchIncomeStatement();
  }, []);

  const fetchIncomeStatement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      // Obtener todas las transacciones del mes
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      // Llamar al edge function para categorizar con IA
      const { data: categorizedData, error: aiError } = await supabase.functions.invoke(
        'categorize-income-statement',
        { body: { transactions } }
      );

      if (aiError) throw aiError;

      setStatement(categorizedData);
    } catch (error) {
      console.error('Error fetching income statement:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Estado de Resultados</h1>
            <p className="text-white/70 text-sm">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>

        {statement && (
          <>
            {/* INGRESOS */}
            <Card className="p-6 mb-4 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">INGRESOS</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(statement.totalIngresos)}
                  </p>
                </div>
              </div>

              {/* Categorías de Ingresos */}
              <div className="space-y-2 pl-4">
                {statement.ingresos.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10">
                    <div className="flex-1">
                      <p className="text-white/90 font-medium">{cat.categoria}</p>
                      <p className="text-white/50 text-xs">{cat.transacciones} transacción(es)</p>
                    </div>
                    <p className="text-white font-semibold">{formatCurrency(cat.monto)}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* GASTOS */}
            <Card className="p-6 mb-4 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">GASTOS</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-danger">
                    {formatCurrency(statement.totalGastos)}
                  </p>
                </div>
              </div>

              {/* Categorías de Gastos */}
              <div className="space-y-2 pl-4">
                {statement.gastos.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10">
                    <div className="flex-1">
                      <p className="text-white/90 font-medium">{cat.categoria}</p>
                      <p className="text-white/50 text-xs">{cat.transacciones} transacción(es)</p>
                    </div>
                    <p className="text-white font-semibold">-{formatCurrency(cat.monto)}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* RESULTADO FINAL */}
            <Card className={`p-6 ${statement.balance >= 0 ? 'bg-success/20' : 'bg-danger/20'} backdrop-blur-sm border-white/20`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${statement.balance >= 0 ? 'bg-success/30' : 'bg-danger/30'} flex items-center justify-center`}>
                    <DollarSign className={`w-6 h-6 ${statement.balance >= 0 ? 'text-success' : 'text-danger'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {statement.balance >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
                    </h3>
                    <p className="text-white/70 text-sm">Balance del período</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${statement.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(Math.abs(statement.balance))}
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    {((statement.balance / statement.totalIngresos) * 100).toFixed(1)}% de ingresos
                  </p>
                </div>
              </div>
            </Card>

            {/* Nota explicativa */}
            <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <p className="text-white/80 text-sm text-center">
                🤖 Categorías agrupadas inteligentemente por IA para una mejor comprensión de tus finanzas
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
