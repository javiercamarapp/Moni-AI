import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  Plus,
  Landmark,
  ChevronDown,
  Tags,
  Camera,
  ArrowLeft
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TransactionSchema } from '@/lib/validation';
import { headingPage, headingSection, kpiNumberPrimary } from '@/styles/typography';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import whatsappLogo from '@/assets/whatsapp-logo.png';
import BottomNav from '@/components/BottomNav';

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
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [account, setAccount] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('');
  const [date, setDate] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

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

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'ingreso');

      setCategories(categoriesData || []);

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
      const label = currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    return `Año ${currentMonth.getFullYear()}`;
  };

  const handleCameraCapture = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        setIsProcessingReceipt(true);
        toast({
          title: "Procesando ticket",
          description: "Analizando la imagen con AI...",
        });

        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);

          reader.onload = async () => {
            const base64Image = reader.result as string;

            const { data: receiptData, error } = await supabase.functions.invoke('analyze-receipt', {
              body: { imageBase64: base64Image, type: 'ingreso' }
            });

            if (error) throw error;

            setAmount(receiptData.amount.toString());
            setDescription(receiptData.description);
            setPaymentMethod(receiptData.payment_method);
            setDate(receiptData.date);

            const matchingCategory = categories.find(
              cat => cat.name.toLowerCase().includes(receiptData.category.toLowerCase())
            );
            if (matchingCategory) {
              setCategory(matchingCategory.id);
            }

            setShowAddDialog(true);
            setIsProcessingReceipt(false);

            toast({
              title: "Ticket analizado",
              description: "Revisa los datos y confirma el registro",
            });
          };
        } catch (error) {
          console.error('Error processing receipt:', error);
          toast({
            title: "Error",
            description: "No se pudo procesar el ticket",
            variant: "destructive",
          });
          setIsProcessingReceipt(false);
        }
      };

      input.click();
    } catch (error) {
      console.error('Error capturing image:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validationResult = TransactionSchema.safeParse({
        amount: parseFloat(amount),
        description,
        payment_method: paymentMethod,
        account,
        category_id: category || null,
        frequency,
        transaction_date: date,
        type: 'ingreso'
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Datos inválidos",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: validationResult.data.amount,
          description: validationResult.data.description,
          payment_method: validationResult.data.payment_method,
          account: validationResult.data.account,
          category_id: validationResult.data.category_id,
          frequency: validationResult.data.frequency,
          transaction_date: validationResult.data.transaction_date,
          type: validationResult.data.type,
        })
        .select()
        .single();

      if (error) throw error;

      if (!validationResult.data.category_id && newTransaction) {
        supabase.functions.invoke('categorize-transaction', {
          body: {
            transactionId: newTransaction.id,
            userId: user.id,
            description: validationResult.data.description,
            amount: validationResult.data.amount,
            type: validationResult.data.type
          }
        }).catch(error => {
          console.error('Error categorizando transacción:', error);
        });
      }

      toast({
        title: "Ingreso registrado",
        description: "Tu ingreso ha sido agregado exitosamente",
      });

      setShowAddDialog(false);
      setAmount('');
      setDescription('');
      setPaymentMethod('');
      setAccount('');
      setCategory('');
      setFrequency('');
      setDate('');
      fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el ingreso",
        variant: "destructive",
      });
    }
  };

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
                onClick={() => navigate('/balance')}
                className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div className="flex flex-col">
                <h1 className={headingPage}>Tus Ingresos</h1>
                <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                  {viewMode === 'month' && <ChevronLeft onClick={handlePreviousPeriod} className="w-3 h-3 cursor-pointer" />}
                  <span className="animate-in fade-in duration-300 whitespace-nowrap">{getPeriodLabel()}</span>
                  {viewMode === 'month' && <ChevronRight onClick={handleNextPeriod} className="w-3 h-3 cursor-pointer" />}
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
                    ? `${transactions.length} Transacciones recibidas`
                    : `${transactions.length} Transacciones anuales`
                  }
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/categorias')}
              className="w-14 h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm ml-4"
              aria-label="Editar categorías"
            >
              <Tags className="w-7 h-7 text-[#8D6E63]" />
            </button>
          </div>

          {/* Download Button */}
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
            className="py-2 px-4 border border-gray-100 bg-gray-50 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors mb-6"
          >
            <Download className="w-3 h-3 text-gray-500" />
            Descargar Reporte
          </button>

          {/* Chart Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className={headingSection}>Evolución de Ingresos</h3>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#8D6E63]"></div>
                <div className="w-2 h-2 rounded-full bg-red-400 opacity-30"></div>
              </div>
            </div>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorIncome)"
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
                    className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-500 shrink-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{tx.description}</h4>
                        <p className="text-xs text-gray-500 font-medium">
                          {txDate.toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {tx.categories && (
                            <Badge className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-600 border-0">
                              {tx.categories.name}
                            </Badge>
                          )}
                          {tx.payment_method && (
                            <Badge className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border-0 uppercase tracking-wide">
                              {tx.payment_method}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-gray-900 text-lg">
                        +${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
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

        {/* Floating Actions */}
        <div className="fixed bottom-20 left-0 right-0 px-6 flex justify-center z-50">
          <div className="flex gap-2">
            <button
              onClick={handleCameraCapture}
              disabled={isProcessingReceipt}
              className="bg-white text-gray-700 rounded-full p-4 shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
            </button>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <button className="bg-[#8D6E63] text-white rounded-full px-6 py-4 shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Nuevo Ingreso</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-[20px] shadow-xl border border-gray-100 max-h-[85vh] overflow-y-auto max-w-md w-[90%]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Registrar Ingreso
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-900 text-base">
                      ¿Cuál es el monto de tu ingreso?
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="$0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="bg-gray-50 border-gray-200 text-gray-900 h-14 text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-900 text-base">
                      ¿Qué nombre le quieres dar?
                    </Label>
                    <Input
                      id="description"
                      placeholder="Nombre de tu ingreso"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="bg-gray-50 border-gray-200 text-gray-900 h-14"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 text-base">
                      ¿El ingreso lo recibiste en?
                    </Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                      <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 h-14">
                        <SelectValue placeholder="Selecciona método de pago" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 z-50">
                        <SelectItem value="debito">Débito</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 text-base">
                      ¿En cuál tarjeta/cuenta recibiste el ingreso?
                    </Label>
                    <Select value={account} onValueChange={setAccount} required>
                      <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 h-14">
                        <SelectValue placeholder="Escoge o agrega tu tarjeta/cuenta" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 z-50">
                        <SelectItem value="banco1">Cuenta Principal</SelectItem>
                        <SelectItem value="banco2">Cuenta de Ahorros</SelectItem>
                        <SelectItem value="banco3">Tarjeta Nómina</SelectItem>
                        <SelectItem value="otro">Otra cuenta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 text-base">
                      Categoría de tu ingreso
                    </Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 h-14">
                        <SelectValue placeholder="Categorías" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 z-50">
                        {categories.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No hay categorías. Créalas en Gestionar Categorías
                          </SelectItem>
                        ) : (
                          categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 text-base">
                      ¿Cada cuánto te llega este ingreso?
                    </Label>
                    <Select value={frequency} onValueChange={setFrequency} required>
                      <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 h-14">
                        <SelectValue placeholder="Sin frecuencia" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 z-50">
                        <SelectItem value="unico">Sin frecuencia</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quincenal">Quincenal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-gray-900 text-base">
                      Fecha de tu ingreso
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="bg-gray-50 border-gray-200 text-gray-900 h-14"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#8D6E63] hover:bg-[#795E56] text-white h-14 text-lg font-semibold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    Agregar Ingreso
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Ingresos;
