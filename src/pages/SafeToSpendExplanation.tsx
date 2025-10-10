import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface SubAccount {
  nombre: string;
  monto: number;
}

interface CategoryData {
  categoria: string;
  monto: number;
  subcuentas: SubAccount[];
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
            <Card className="p-6 mb-4 bg-gradient-to-br from-[hsl(145,80%,25%)] to-[hsl(145,70%,20%)] shadow-[0_0_30px_rgba(34,197,94,0.3)] border-2 border-[hsl(145,70%,45%)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[hsl(145,70%,55%)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[hsl(145,80%,60%)] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">INGRESOS</h2>
                </div>
                <p className="text-3xl font-bold text-[hsl(145,100%,75%)] drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">
                  {formatCurrency(statement.totalIngresos)}
                </p>
              </div>

              {/* Categorías de Ingresos */}
              <div className="space-y-3">
                {statement.ingresos.length === 0 ? (
                  <p className="text-white/70 text-sm py-2">No hay ingresos registrados</p>
                ) : (
                  statement.ingresos.map((cat, idx) => (
                    <div key={idx} className="border-b border-white/20 pb-3 last:border-0 hover:bg-white/5 transition-colors duration-200 rounded-lg p-2 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                      {/* Categoría Principal */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-bold text-base">{cat.categoria}</h4>
                        <p className="text-[hsl(145,90%,70%)] font-bold text-base">{formatCurrency(cat.monto)}</p>
                      </div>
                      {/* Subcuentas */}
                      <div className="space-y-1 pl-6">
                        {cat.subcuentas.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center justify-between py-1 hover:bg-white/5 rounded px-2 transition-all duration-150">
                            <p className="text-white/80 text-sm">{sub.nombre}</p>
                            <p className="text-white/80 text-sm">{formatCurrency(sub.monto)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* GASTOS */}
            <Card className="p-6 mb-4 bg-gradient-to-br from-[hsl(0,85%,35%)] to-[hsl(0,75%,25%)] shadow-[0_0_30px_rgba(239,68,68,0.3)] border-2 border-[hsl(0,80%,55%)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all duration-300 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[hsl(0,80%,60%)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[hsl(0,90%,65%)] flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">GASTOS</h2>
                </div>
                <p className="text-3xl font-bold text-[hsl(0,100%,80%)] drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                  {formatCurrency(statement.totalGastos)}
                </p>
              </div>

              {/* Categorías de Gastos */}
              <div className="space-y-3">
                {statement.gastos.length === 0 ? (
                  <p className="text-white/70 text-sm py-2">No hay gastos registrados</p>
                ) : (
                  statement.gastos.map((cat, idx) => (
                    <div key={idx} className="border-b border-white/20 pb-3 last:border-0 hover:bg-white/5 transition-colors duration-200 rounded-lg p-2 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                      {/* Categoría Principal */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-bold text-base">{cat.categoria}</h4>
                        <p className="text-[hsl(0,90%,75%)] font-bold text-base">{formatCurrency(cat.monto)}</p>
                      </div>
                      {/* Subcuentas */}
                      <div className="space-y-1 pl-6">
                        {cat.subcuentas.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center justify-between py-1 hover:bg-white/5 rounded px-2 transition-all duration-150">
                            <p className="text-white/80 text-sm">{sub.nombre}</p>
                            <p className="text-white/80 text-sm">{formatCurrency(sub.monto)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* BALANCE */}
            <Card className={`p-6 animate-fade-in hover:scale-[1.02] transition-transform duration-300 ${statement.balance >= 0 ? 'bg-gradient-to-br from-[hsl(145,85%,30%)] to-[hsl(145,75%,22%)] shadow-[0_0_35px_rgba(34,197,94,0.4)] border-2 border-[hsl(145,80%,50%)]' : 'bg-gradient-to-br from-[hsl(0,90%,38%)] to-[hsl(0,80%,28%)] shadow-[0_0_35px_rgba(239,68,68,0.4)] border-2 border-[hsl(0,85%,58%)]'}`} style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_25px] animate-pulse ${statement.balance >= 0 ? 'bg-[hsl(145,90%,60%)] shadow-[hsl(145,90%,60%)]' : 'bg-[hsl(0,95%,65%)] shadow-[hsl(0,95%,65%)]'}`}>
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {statement.balance >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
                    </h3>
                    <p className="text-white/80 text-sm">Balance del período</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-bold text-white drop-shadow-[0_0_15px] ${statement.balance >= 0 ? 'drop-shadow-[rgba(34,197,94,0.9)]' : 'drop-shadow-[rgba(239,68,68,0.9)]'}`}>
                    {formatCurrency(Math.abs(statement.balance))}
                  </p>
                  <p className="text-white/90 text-sm mt-1 font-semibold">
                    {statement.totalIngresos > 0 ? ((statement.balance / statement.totalIngresos) * 100).toFixed(1) : '0.0'}% de ingresos
                  </p>
                </div>
              </div>
            </Card>

            {/* Nota explicativa */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/40 shadow-[0_0_15px_rgba(147,51,234,0.2)] animate-fade-in" style={{ animationDelay: '300ms' }}>
              <p className="text-card-foreground text-sm text-center font-medium">
                🤖 Categorías agrupadas inteligentemente por IA
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
