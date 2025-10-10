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
          <Card className="p-6 bg-gradient-card card-glow shadow-elegant border border-border/30">
            {/* INGRESOS */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-success/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-card-foreground">INGRESOS</h2>
                </div>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(statement.totalIngresos)}
                </p>
              </div>

              {/* Categorías de Ingresos */}
              <div className="space-y-3">
                {statement.ingresos.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-2">No hay ingresos registrados</p>
                ) : (
                  statement.ingresos.map((cat, idx) => (
                    <div key={idx} className="border-b border-border/20 pb-3 last:border-0">
                      {/* Categoría Principal */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-card-foreground font-bold text-base">{cat.categoria}</h4>
                        <p className="text-card-foreground font-bold text-base">{formatCurrency(cat.monto)}</p>
                      </div>
                      {/* Subcuentas */}
                      <div className="space-y-1 pl-6">
                        {cat.subcuentas.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center justify-between py-1">
                            <p className="text-muted-foreground text-sm">{sub.nombre}</p>
                            <p className="text-muted-foreground text-sm">{formatCurrency(sub.monto)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* GASTOS */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-destructive/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  </div>
                  <h2 className="text-xl font-bold text-card-foreground">GASTOS</h2>
                </div>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(statement.totalGastos)}
                </p>
              </div>

              {/* Categorías de Gastos */}
              <div className="space-y-3">
                {statement.gastos.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-2">No hay gastos registrados</p>
                ) : (
                  statement.gastos.map((cat, idx) => (
                    <div key={idx} className="border-b border-border/20 pb-3 last:border-0">
                      {/* Categoría Principal */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-card-foreground font-bold text-base">{cat.categoria}</h4>
                        <p className="text-card-foreground font-bold text-base">{formatCurrency(cat.monto)}</p>
                      </div>
                      {/* Subcuentas */}
                      <div className="space-y-1 pl-6">
                        {cat.subcuentas.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center justify-between py-1">
                            <p className="text-muted-foreground text-sm">{sub.nombre}</p>
                            <p className="text-muted-foreground text-sm">{formatCurrency(sub.monto)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* BALANCE */}
            <div className={`p-5 rounded-xl ${statement.balance >= 0 ? 'bg-gradient-to-br from-[hsl(145,45%,30%)] to-[hsl(145,55%,25%)] border-2 border-[hsl(145,50%,35%)]/50' : 'bg-gradient-to-br from-[hsl(0,50%,30%)] to-[hsl(0,55%,25%)] border-2 border-[hsl(0,50%,35%)]/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${statement.balance >= 0 ? 'bg-white/20' : 'bg-white/20'} flex items-center justify-center`}>
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {statement.balance >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
                    </h3>
                    <p className="text-white/70 text-sm">Balance del período</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(Math.abs(statement.balance))}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    {statement.totalIngresos > 0 ? ((statement.balance / statement.totalIngresos) * 100).toFixed(1) : '0.0'}% de ingresos
                  </p>
                </div>
              </div>
            </div>

            {/* Nota explicativa */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-muted-foreground text-xs text-center">
                🤖 Categorías agrupadas inteligentemente por IA
              </p>
            </div>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
