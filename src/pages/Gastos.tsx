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
  TrendingDown
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

// Mapeo de categorías a emojis
const categoryEmojis: Record<string, string> = {
  'restaurante': '🍽️',
  'restaurantes': '🍽️',
  'comida': '🍔',
  'alimentos': '🛒',
  'supermercado': '🛒',
  'despensa': '🛒',
  'cafetería': '☕',
  'entretenimiento': '🎬',
  'cine': '🎥',
  'teatro': '🎭',
  'concierto': '🎵',
  'museo': '🖼️',
  'videojuegos': '🎮',
  'bar': '🍺',
  'bares': '🍺',
  'antro': '💃',
  'discoteca': '🪩',
  'fiesta': '🎉',
  'servicios': '⚡',
  'electricidad': '💡',
  'agua': '💧',
  'gas': '🔥',
  'internet': '📡',
  'teléfono': '📱',
  'streaming': '📺',
  'netflix': '🎬',
  'spotify': '🎵',
  'disney': '🏰',
  'prime': '📦',
  'hbo': '🎭',
  'auto': '🚗',
  'gasolina': '⛽',
  'combustible': '⛽',
  'mecánico': '🔧',
  'reparación': '🔧',
  'estacionamiento': '🅿️',
  'uber': '🚕',
  'taxi': '🚕',
};

const getCategoryEmoji = (categoryName: string): string => {
  const lowerName = categoryName.toLowerCase();
  return categoryEmojis[lowerName] || '💸';
};

const Gastos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

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
        .eq('type', 'gasto');

      setCategories(categoriesData || []);

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .lte('transaction_date', endOfMonth.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGastos = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleWhatsAppRegister = () => {
    const message = encodeURIComponent('Hola Moni, quiero registrar un gasto');
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const getPeriodLabel = () => {
    return currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
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
        type: 'gasto'
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

      const { error } = await supabase
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
        });

      if (error) throw error;

      toast({
        title: "Gasto registrado",
        description: "Tu gasto ha sido agregado exitosamente",
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
        description: "No se pudo registrar el gasto",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <p className="text-foreground text-lg">Cargando gastos...</p>
      </div>
    );
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
            className="text-foreground hover:bg-accent/50 transition-all hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Tus Gastos
            </h1>
            <p className="text-sm text-muted-foreground">Gestiona tus salidas</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            onClick={handleWhatsAppRegister}
            className="bg-card/70 hover:bg-card/90 border border-border/30 transition-all hover:scale-105"
          >
            <img src={whatsappLogo} alt="WhatsApp" className="w-5 h-5 object-contain" />
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="bg-card/70 hover:bg-card/90 border border-border/30 transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5 text-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-card border-border/30 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-card-foreground">
                  Registrar Gasto
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-card-foreground/90 text-base">
                    ¿Cuál es el monto de tu gasto?
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
                    placeholder="Nombre de tu gasto"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="bg-card/50 border-border/30 text-card-foreground placeholder:text-muted-foreground h-14"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-card-foreground/90 text-base">
                    ¿El gasto lo hiciste con?
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
                    ¿De cuál tarjeta/cuenta salió el gasto?
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
                    Categoría de tu gasto
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
                    ¿Cada cuánto tienes este gasto?
                  </Label>
                  <Select value={frequency} onValueChange={setFrequency} required>
                    <SelectTrigger className="bg-card/50 border-border/30 text-card-foreground h-14">
                      <SelectValue placeholder="Sin frecuencia" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/30 z-50">
                      <SelectItem value="unico" className="text-card-foreground">Sin frecuencia</SelectItem>
                      <SelectItem value="diario" className="text-card-foreground">Diario</SelectItem>
                      <SelectItem value="semanal" className="text-card-foreground">Semanal</SelectItem>
                      <SelectItem value="quincenal" className="text-card-foreground">Quincenal</SelectItem>
                      <SelectItem value="mensual" className="text-card-foreground">Mensual</SelectItem>
                      <SelectItem value="anual" className="text-card-foreground">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-card-foreground/90 text-base">
                    Fecha de tu gasto
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold"
                >
                  Agregar Gasto
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button
            size="icon"
            onClick={() => navigate('/categorias')}
            className="bg-card/70 hover:bg-card/90 border border-border/30 transition-all hover:scale-105"
          >
            <Sliders className="h-5 w-5 text-foreground" />
          </Button>
        </div>
      </div>

      {/* Período selector */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="text-foreground hover:bg-accent/50 transition-all hover:scale-105"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="bg-card/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/30 shadow-card">
            <p className="text-foreground font-medium capitalize text-center">
              {getPeriodLabel()}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="text-foreground hover:bg-accent/50 transition-all hover:scale-105"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Total de gastos destacado */}
        <Card className="p-6 bg-gradient-to-br from-[hsl(0,50%,30%)] to-[hsl(0,55%,25%)] border-[hsl(0,50%,35%)]/50 card-glow animate-fade-in shadow-elegant" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-card/40 backdrop-blur-sm rounded-full border border-border/30">
              <TrendingDown className="h-6 w-6 text-red-200" />
            </div>
            <div>
              <p className="text-sm text-white/90">
                Total de Gastos
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/90">
              <span>Transacciones:</span>
              <span className="font-semibold">{transactions.length}</span>
            </div>
          </div>
          
          {/* Botón de descarga de PDF */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <Button 
              variant="ghost" 
              className="w-full bg-card/40 backdrop-blur-sm border border-border/30 text-white hover:bg-card/60 transition-all duration-300 h-auto py-2.5 px-4 text-xs sm:text-sm leading-tight"
              onClick={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    toast({
                      title: "Error",
                      description: "Debes iniciar sesión para descargar el PDF",
                      variant: "destructive"
                    });
                    return;
                  }

                  toast({
                    title: "Generando PDF",
                    description: "Por favor espera...",
                  });

                  const { data, error } = await supabase.functions.invoke('generate-statement-pdf', {
                    body: {
                      userId: user.id,
                      viewMode: 'mensual',
                      month: currentMonth.getMonth() + 1,
                      year: currentMonth.getFullYear()
                    }
                  });

                  if (error) throw error;

                  // Convertir base64 a blob y descargar
                  const pdfBlob = await fetch(`data:application/pdf;base64,${data.pdf}`).then(r => r.blob());
                  const url = window.URL.createObjectURL(pdfBlob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `movimientos_${currentMonth.getMonth() + 1}_${currentMonth.getFullYear()}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);

                  toast({
                    title: "PDF generado",
                    description: "El archivo se ha descargado correctamente",
                  });
                } catch (error) {
                  console.error('Error al generar PDF:', error);
                  toast({
                    title: "Error",
                    description: "No se pudo generar el PDF",
                    variant: "destructive"
                  });
                }
              }}
            >
              <Download className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="break-words whitespace-normal">Descargar movimientos del mes en PDF</span>
            </Button>
          </div>
        </Card>

        {/* Lista de transacciones */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Historial de Gastos
          </h3>
          
          {transactions.length === 0 ? (
            <Card className="p-6 bg-gradient-card card-glow text-center shadow-card border border-border/30">
              <p className="text-muted-foreground">No hay gastos registrados este mes</p>
            </Card>
          ) : (
            transactions.map((item, index) => {
              const transactionDate = new Date(item.transaction_date);
              const categoryEmoji = item.categories ? getCategoryEmoji(item.categories.name) : '💸';
              
              const capitalizedDescription = item.description.charAt(0).toUpperCase() + item.description.slice(1);
              const capitalizedPaymentMethod = item.payment_method 
                ? item.payment_method.charAt(0).toUpperCase() + item.payment_method.slice(1) 
                : '';
              
              return (
                <Card 
                  key={item.id} 
                  className="p-2 bg-gradient-card card-glow hover-lift shadow-card border border-border/30 animate-fade-in transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    {/* Logo de categoría */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(0,55%,40%)] to-[hsl(0,65%,35%)] flex items-center justify-center flex-shrink-0 border border-[hsl(0,60%,45%)]/70 shadow-md">
                      <span className="text-base">{categoryEmoji}</span>
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
                            className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(0,60%,45%)] to-[hsl(0,70%,40%)] text-white border-0 shadow-sm px-2 py-0.5"
                          >
                            {item.categories.name.charAt(0).toUpperCase() + item.categories.name.slice(1)}
                          </Badge>
                        )}
                        {item.payment_method && (
                          <Badge 
                            className="text-[10px] font-semibold bg-gradient-to-r from-[hsl(280,60%,45%)] to-[hsl(280,70%,40%)] text-white border-0 shadow-sm px-2 py-0.5"
                          >
                            {capitalizedPaymentMethod}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Monto */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-foreground">
                        -${Number(item.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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

export default Gastos;
