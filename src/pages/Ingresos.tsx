import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingDown,
  Plus,
  Landmark,
  ChevronDown,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { headingPage, headingSection, kpiNumberPrimary } from '@/styles/typography';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import QuickRecordModal from '@/components/dashboard/QuickRecordModal';

interface Transaction {
  id: string;
  description: string;
  transaction_date: string;
  amount: number;
  payment_method: string;
  categories?: { name: string; color: string };
}

interface ChartPoint {
  label: string;
  amount: number;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
  { value: 'amount-desc', label: 'Mayor cantidad' },
  { value: 'amount-asc', label: 'Menor cantidad' },
];

const Ingresos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Get the referrer to determine where to navigate back
  const referrer = location.state?.from || 'dashboard';

  useEffect(() => {
    fetchData();
  }, [currentMonth, viewMode]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      let startDate: Date, endDate: Date;

      if (viewMode === 'month') {
        startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      } else {
        startDate = new Date(currentMonth.getFullYear(), 0, 1);
        endDate = new Date(currentMonth.getFullYear(), 11, 31);
      }

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .eq('type', 'ingreso')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Ingreso eliminado",
        description: "La transacción ha sido eliminada correctamente",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción",
        variant: "destructive"
      });
    }
  };

  const totalIngresos = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handlePreviousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'month') {
      return currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    }
    return `Año ${currentMonth.getFullYear()}`;
  };

  // Removed handleCameraCapture and handleSubmit - now handled by QuickRecordModal

  // Generate chart data from transactions
  const chartData: ChartPoint[] = useMemo(() => {
    if (viewMode === 'month') {
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const dataPoints: ChartPoint[] = [];

      for (let day = 1; day <= daysInMonth; day += Math.ceil(daysInMonth / 7)) {
        const dayTransactions = transactions.filter(t => {
          const txDate = new Date(t.transaction_date);
          return txDate.getDate() === day;
        });
        const dayTotal = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        dataPoints.push({ label: day.toString(), amount: dayTotal });
      }
      return dataPoints;
    } else {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return months.map((month, index) => {
        const monthTransactions = transactions.filter(t => {
          const txDate = new Date(t.transaction_date);
          return txDate.getMonth() === index;
        });
        const monthTotal = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return { label: month, amount: monthTotal };
      });
    }
  }, [transactions, viewMode, currentMonth]);

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];
    switch (sortOption) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
      case 'amount-desc':
        return sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
      case 'amount-asc':
        return sorted.sort((a, b) => Number(a.amount) - Number(b.amount));
      default:
        return sorted;
    }
  }, [transactions, sortOption]);

  const selectedLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-gray-800 font-sans pb-24">
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(referrer === 'balance' ? '/balance' : '/dashboard')}
                className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div className="flex flex-col">
                <h1 className={headingPage}>Ingresos</h1>
                <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-500 font-medium -ml-0.5">
                  {viewMode === 'month' && <ChevronLeft onClick={handlePreviousPeriod} className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer" />}
                  <span className="animate-in fade-in duration-300 whitespace-nowrap">{getPeriodLabel()}</span>
                  {viewMode === 'month' && <ChevronRight onClick={handleNextPeriod} className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer" />}
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="bg-white p-1 rounded-full shadow-sm flex items-center">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${viewMode === 'month'
                  ? 'bg-[#8D6E63] text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${viewMode === 'year'
                  ? 'bg-[#8D6E63] text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                Año
              </button>
            </div>
          </div>
        </div>

        {/* Main Stats Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Ingresos Totales</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={kpiNumberPrimary}>
                  ${totalIngresos.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xl text-gray-400 font-medium">
                  {totalIngresos % 1 === 0 ? '.00' : `.${totalIngresos.toFixed(2).split('.')[1]}`}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-[#8D6E63]"></div>
                <span className="text-sm text-gray-500 font-medium">
                  {viewMode === 'month'
                    ? `${transactions.length} Transacciones realizadas`
                    : `${transactions.length} Transacciones anuales`
                  }
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    toast({
                      title: "Error",
                      description: "Debes iniciar sesión para descargar el reporte",
                      variant: "destructive"
                    });
                    return;
                  }

                  toast({
                    title: "Generando reporte",
                    description: "Por favor espera...",
                  });

                  const { data, error } = await supabase.functions.invoke('generate-statement-pdf', {
                    body: {
                      userId: user.id,
                      viewMode: viewMode === 'month' ? 'mensual' : 'anual',
                      month: currentMonth.getMonth() + 1,
                      year: currentMonth.getFullYear(),
                      type: 'ingreso'
                    }
                  });

                  if (error) throw error;

                  const blob = new Blob([data.html], { type: 'text/html' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = data.filename || `ingresos_${viewMode === 'month' ? `${currentMonth.getMonth() + 1}_${currentMonth.getFullYear()}` : currentMonth.getFullYear()}.html`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);

                  toast({
                    title: "Reporte generado",
                    description: "Abre el archivo y usa Ctrl+P para guardar como PDF",
                  });
                } catch (error) {
                  console.error('Error al generar reporte:', error);
                  toast({
                    title: "Error",
                    description: "No se pudo generar el reporte",
                    variant: "destructive"
                  });
                }
              }}
              className="w-14 h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm ml-4"
              aria-label="Descargar reporte"
            >
              <Download className="w-6 h-6 text-[#8D6E63]" />
            </button>
          </div>

          {/* Chart Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className={headingSection}>Evolución de Ingresos</h3>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#8D6E63]"></div>
                <div className="w-2 h-2 rounded-full bg-[#8D6E63] opacity-30"></div>
              </div>
            </div>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8D6E63" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8D6E63" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8D6E63"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Custom X Axis Labels */}
            <div className="flex justify-between px-2 mt-2 text-xs text-gray-400 font-medium">
              {viewMode === 'month' ? (
                <>
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20</span>
                  <span>25</span>
                  <span>30</span>
                </>
              ) : (
                <>
                  <span>Ene</span>
                  <span>Abr</span>
                  <span>Ago</span>
                  <span>Dic</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="flex items-center justify-between mb-4 px-2 relative z-10">
            <h3 className="text-lg font-bold text-gray-900">Historial de Ingresos</h3>

            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold text-gray-600 border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {selectedLabel}
                <ChevronDown className={`w-3 h-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortOption(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${sortOption === option.value ? 'font-bold text-[#8D6E63] bg-gray-50' : 'text-gray-600 font-medium'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overlay to close sort menu */}
          {isSortOpen && (
            <div className="fixed inset-0 z-0" onClick={() => setIsSortOpen(false)}></div>
          )}

          {/* Transactions List */}
          <div className="flex flex-col gap-3 relative z-0 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((tx, index) => {
                const [year, month, day] = tx.transaction_date.split('-').map(Number);
                const txDate = new Date(year, month - 1, day);

                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 group cursor-pointer hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-500 shrink-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#EFEBE9] flex items-center justify-center flex-shrink-0">
                      <Landmark className="w-4 h-4 text-[#A1887F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{tx.description}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {txDate.toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {tx.categories && (
                          <Badge className="text-[9px] font-medium px-1.5 py-0 rounded bg-[#EFEBE9] text-[#A1887F] border-0">
                            {tx.categories.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}
                          </Badge>
                        )}
                        {tx.payment_method && (
                          <Badge className="text-[9px] font-medium px-1.5 py-0 rounded bg-gray-100 text-gray-600 border-0 capitalize">
                            {tx.payment_method}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <span className="block font-bold text-[#A1887F] text-sm">
                        +${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTransaction(tx.id);
                        }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                        aria-label="Eliminar transacción"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                No hay transacciones en este periodo.
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsQuickRecordOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-16 md:right-10 z-50 w-14 h-14 rounded-full bg-[#A1887F] text-white shadow-xl flex items-center justify-center hover:bg-[#8D6E63] transition-all hover:scale-110 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Quick Record Modal */}
        <QuickRecordModal
          isOpen={isQuickRecordOpen}
          onClose={() => {
            setIsQuickRecordOpen(false);
            fetchData(); // Refresh data after closing
          }}
          mode="expense"
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default Ingresos;
