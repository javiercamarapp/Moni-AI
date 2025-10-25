import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
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
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Sliders,
  Download,
  TrendingUp,
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import whatsappLogo from '@/assets/whatsapp-logo.png';
import { TransactionSchema } from '@/lib/validation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingScreen } from '@/components/LoadingScreen';

const Ingresos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'mensual' | 'anual'>(() => {
    const saved = localStorage.getItem('balanceViewMode');
    return (saved as 'mensual' | 'anual') || 'mensual';
  });
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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
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

      // Calcular rango de fechas según el modo de vista
      let startDate: Date, endDate: Date;
      
      if (viewMode === 'mensual') {
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
    } finally {
      setLoading(false);
    }
  };

  const totalIngresos = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handlePreviousPeriod = () => {
    if (viewMode === 'mensual') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'mensual') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()));
    }
  };

  const handleWhatsAppRegister = () => {
    const message = encodeURIComponent('Hola Moni, quiero registrar un ingreso');
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const getPeriodLabel = () => {
    if (viewMode === 'mensual') {
      return currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    }
    return currentMonth.getFullYear().toString();
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
          // Convertir imagen a base64
          const reader = new FileReader();
          reader.readAsDataURL(file);
          
          reader.onload = async () => {
            const base64Image = reader.result as string;
            
            const { data: receiptData, error } = await supabase.functions.invoke('analyze-receipt', {
              body: { imageBase64: base64Image, type: 'ingreso' }
            });

            if (error) throw error;

            // Llenar el formulario con los datos extraídos
            setAmount(receiptData.amount.toString());
            setDescription(receiptData.description);
            setPaymentMethod(receiptData.payment_method);
            setDate(receiptData.date);
            
            // Buscar categoría por nombre
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

      // Si no tiene categoría, categorizar automáticamente con IA
      if (!validationResult.data.category_id && newTransaction) {
        console.log('Categorizando automáticamente transacción:', newTransaction.id);
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/balance')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-12 w-12"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Tus Ingresos
            </h1>
            <p className="text-sm text-muted-foreground">Gestiona tus entradas</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            onClick={handleWhatsAppRegister}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 border border-blue-100 transition-all hover:scale-105 h-8 w-8"
          >
            <img src={whatsappLogo} alt="WhatsApp" className="w-4 h-4 object-contain" />
          </Button>

          <Button
            size="icon"
            onClick={handleCameraCapture}
            disabled={isProcessingReceipt}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 border border-blue-100 transition-all hover:scale-105 h-8 w-8 disabled:opacity-50"
          >
            <Camera className="h-4 w-4 text-foreground" />
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 border border-blue-100 transition-all hover:scale-105 h-8 w-8"
              >
                <Plus className="h-4 w-4 text-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-[20px] shadow-xl border border-blue-100 max-h-[85vh] overflow-y-auto max-w-md w-[90%] animate-fade-in">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-card-foreground">
                  Registrar Ingreso
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-card-foreground/90 text-base">
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
                    className="bg-card/50 border-border/30 text-card-foreground placeholder:text-muted-foreground h-14 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-card-foreground/90 text-base">
                    ¿Qué nombre le quieres dar?
                  </Label>
                  <Input
                    id="description"
                    placeholder="Nombre de tu ingreso"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="bg-card/50 border-border/30 text-card-foreground placeholder:text-muted-foreground h-14"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground/90 text-base">
                    ¿El ingreso lo recibiste en?
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                    <SelectTrigger className="bg-card/50 border-border/30 text-card-foreground h-14">
                      <SelectValue placeholder="Selecciona método de pago" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/30 z-50">
                      <SelectItem value="debito" className="text-card-foreground">Débito</SelectItem>
                      <SelectItem value="credito" className="text-card-foreground">Crédito</SelectItem>
                      <SelectItem value="efectivo" className="text-card-foreground">Efectivo</SelectItem>
                      <SelectItem value="transferencia" className="text-card-foreground">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground/90 text-base">
                    ¿En cuál tarjeta/cuenta recibiste el ingreso?
                  </Label>
                  <Select value={account} onValueChange={setAccount} required>
                    <SelectTrigger className="bg-card/50 border-border/30 text-card-foreground h-14">
                      <SelectValue placeholder="Escoge o agrega tu tarjeta/cuenta" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/30 z-50">
                      <SelectItem value="banco1" className="text-card-foreground">Cuenta Principal</SelectItem>
                      <SelectItem value="banco2" className="text-card-foreground">Cuenta de Ahorros</SelectItem>
                      <SelectItem value="banco3" className="text-card-foreground">Tarjeta Nómina</SelectItem>
                      <SelectItem value="otro" className="text-card-foreground">Otra cuenta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground/90 text-base">
                    Categoría de tu ingreso
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="bg-card/50 border-border/30 text-card-foreground h-14">
                      <SelectValue placeholder="Categorías" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/30 z-50">
                      {categories.length === 0 ? (
                        <SelectItem value="none" className="text-card-foreground" disabled>
                          No hay categorías. Créalas en Gestionar Categorías
                        </SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-card-foreground">
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground/90 text-base">
                    ¿Cada cuánto te llega este ingreso?
                  </Label>
                  <Select value={frequency} onValueChange={setFrequency} required>
                    <SelectTrigger className="bg-card/50 border-border/30 text-card-foreground h-14">
                      <SelectValue placeholder="Sin frecuencia" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/30 z-50">
                      <SelectItem value="unico" className="text-card-foreground">Sin frecuencia</SelectItem>
                      <SelectItem value="semanal" className="text-card-foreground">Semanal</SelectItem>
                      <SelectItem value="quincenal" className="text-card-foreground">Quincenal</SelectItem>
                      <SelectItem value="mensual" className="text-card-foreground">Mensual</SelectItem>
                      <SelectItem value="anual" className="text-card-foreground">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-card-foreground/90 text-base">
                    Fecha de tu ingreso
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="bg-card/50 border-border/30 text-card-foreground h-14"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 hover:shadow-2xl transition-all duration-200"
                >
                  Agregar Ingreso
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button
            size="icon"
            onClick={() => navigate('/categorias')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 border border-blue-100 transition-all hover:scale-105 h-8 w-8"
          >
            <Sliders className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </div>

      {/* Período selector */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousPeriod}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="bg-white rounded-[20px] shadow-xl px-4 py-2 border border-blue-100">
            <p className="text-foreground font-medium capitalize text-center">
              {getPeriodLabel()}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPeriod}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Total de ingresos destacado */}
        <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-emerald-100 animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/60 mb-1 font-medium">
                Total de Ingresos {viewMode === 'mensual' ? 'Mensuales' : 'Anuales'}
              </p>
              <p className="text-3xl sm:text-4xl font-bold leading-tight break-words text-emerald-600">
                ${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Transacciones:</span>
              <span className="text-lg font-bold text-foreground">{transactions.length}</span>
            </div>
          </div>
          
          {/* Botón de descarga de PDF */}
          <div>
            <Button 
              variant="ghost" 
              className="w-full bg-muted/50 hover:bg-muted rounded-[20px] text-foreground transition-all h-auto py-3 px-4 text-xs font-semibold flex items-center justify-center"
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
                      viewMode: viewMode,
                      month: currentMonth.getMonth() + 1,
                      year: currentMonth.getFullYear(),
                      type: 'ingreso'
                    }
                  });

                  if (error) throw error;

                  // Crear blob del HTML y descargar
                  const blob = new Blob([data.html], { type: 'text/html' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = data.filename || `ingresos_${viewMode === 'mensual' ? `${currentMonth.getMonth() + 1}_${currentMonth.getFullYear()}` : currentMonth.getFullYear()}.html`;
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
            >
              <Download className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="break-words whitespace-normal">Descargar reporte de ingresos en PDF</span>
            </Button>
          </div>
        </Card>

        {/* Lista de transacciones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Historial de Ingresos
            </h3>
            
            <Select value={sortBy} onValueChange={(value: 'recent' | 'highest' | 'lowest') => setSortBy(value)}>
              <SelectTrigger className="w-[160px] bg-white rounded-[12px] shadow-md border border-blue-100 text-foreground h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/30 z-[100]">
                <SelectItem value="recent" className="text-foreground text-xs">Más recientes</SelectItem>
                <SelectItem value="highest" className="text-foreground text-xs">Mayor a menor</SelectItem>
                <SelectItem value="lowest" className="text-foreground text-xs">Menor a mayor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {transactions.length === 0 ? (
            <Card className="p-6 bg-white rounded-[20px] shadow-xl text-center border border-blue-100">
              <p className="text-muted-foreground">No hay ingresos registrados este mes</p>
            </Card>
          ) : (
            [...transactions].sort((a, b) => {
              if (sortBy === 'recent') {
                return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
              } else if (sortBy === 'highest') {
                return Number(b.amount) - Number(a.amount);
              } else {
                return Number(a.amount) - Number(b.amount);
              }
            }).map((item, index) => {
              const transactionDate = new Date(item.transaction_date);
              
              const capitalizedDescription = item.description.charAt(0).toUpperCase() + item.description.slice(1);
              const capitalizedPaymentMethod = item.payment_method 
                ? item.payment_method.charAt(0).toUpperCase() + item.payment_method.slice(1) 
                : '';
              
              return (
                <Card 
                  key={item.id} 
                  className="p-2 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all animate-fade-in active:scale-95 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    {/* Logo del banco */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(145,45%,35%)] to-[hsl(145,60%,30%)] flex items-center justify-center flex-shrink-0 border border-[hsl(145,55%,40%)]/70 shadow-md">
                      <span className="text-base">🏦</span>
                    </div>
                    
                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm leading-tight">
                        {capitalizedDescription}
                      </h4>
                      <p className="text-xs text-foreground/80 font-medium leading-tight">
                        {transactionDate.toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {item.categories && (
                          <Badge 
                            className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(145,50%,40%)] to-[hsl(145,60%,35%)] text-white border-0 shadow-sm px-2 py-0.5"
                          >
                            {item.categories.name.charAt(0).toUpperCase() + item.categories.name.slice(1)}
                          </Badge>
                        )}
                        {item.payment_method && (
                          <Badge 
                            className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(210,60%,45%)] to-[hsl(210,70%,40%)] text-white border-0 shadow-sm px-2 py-0.5"
                          >
                            {capitalizedPaymentMethod}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Monto */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-foreground">
                        +${Number(item.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Ingresos;
