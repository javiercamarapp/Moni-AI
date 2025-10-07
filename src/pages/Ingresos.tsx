import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Download
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

const Ingresos = () => {
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
        .eq('type', 'ingreso');

      setCategories(categoriesData || []);

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*, categories(name, color)')
        .eq('user_id', user.id)
        .eq('type', 'ingreso')
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

  const totalIngresos = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthNamesFull = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleWhatsAppRegister = () => {
    const message = encodeURIComponent('Hola Moni, quiero registrar un ingreso');
    window.open(`https://wa.me/?text=${message}`, '_blank');
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header con mes y navegación */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/balance')}
            className="text-white hover:bg-white/10 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <h1 className="text-base font-medium min-w-[140px] text-center">
              {monthNamesFull[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h1>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="text-primary hover:bg-white/10 text-sm -mr-2"
          >
            Filtrar
          </Button>
        </div>
      </div>

      {/* Card de total */}
      <div className="px-4 -mt-4 mb-4">
        <Card className="bg-card border-border shadow-lg rounded-3xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Total de Ingresos</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-3">
              ${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{transactions.length} Transacciones</p>
            
            <Button 
              variant="ghost"
              className="w-full justify-start text-primary hover:bg-primary/10 gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Descargar Estado de Cuenta en PDF</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Botones de acción flotantes */}
      <div className="fixed top-[180px] right-4 flex flex-col gap-2 z-10">
        <Button
          size="icon"
          onClick={handleWhatsAppRegister}
          className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <img src={whatsappLogo} alt="WhatsApp" className="w-5 h-5 object-contain" />
        </Button>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gradient-card border-white/20 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                Registrar Ingreso
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white/90 text-base">
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
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40 h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white/90 text-base">
                  ¿Qué nombre le quieres dar?
                </Label>
                <Input
                  id="description"
                  placeholder="Nombre de tu ingreso"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40 h-14"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-base">
                  ¿El ingreso lo recibiste en?
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                    <SelectValue placeholder="Selecciona método de pago" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20 z-50">
                    <SelectItem value="debito" className="text-white">Débito</SelectItem>
                    <SelectItem value="credito" className="text-white">Crédito</SelectItem>
                    <SelectItem value="efectivo" className="text-white">Efectivo</SelectItem>
                    <SelectItem value="transferencia" className="text-white">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-base">
                  ¿En cuál tarjeta/cuenta recibiste el ingreso?
                </Label>
                <Select value={account} onValueChange={setAccount} required>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                    <SelectValue placeholder="Escoge o agrega tu tarjeta/cuenta" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20 z-50">
                    <SelectItem value="banco1" className="text-white">Cuenta Principal</SelectItem>
                    <SelectItem value="banco2" className="text-white">Cuenta de Ahorros</SelectItem>
                    <SelectItem value="banco3" className="text-white">Tarjeta Nómina</SelectItem>
                    <SelectItem value="otro" className="text-white">Otra cuenta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-base">
                  Categoría de tu ingreso
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                    <SelectValue placeholder="Categorías" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20 z-50">
                    {categories.length === 0 ? (
                      <SelectItem value="none" className="text-white" disabled>
                        No hay categorías. Créalas en Gestionar Categorías
                      </SelectItem>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-base">
                  ¿Cada cuánto te llega este ingreso?
                </Label>
                <Select value={frequency} onValueChange={setFrequency} required>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                    <SelectValue placeholder="Sin frecuencia" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20 z-50">
                    <SelectItem value="unico" className="text-white">Sin frecuencia</SelectItem>
                    <SelectItem value="semanal" className="text-white">Semanal</SelectItem>
                    <SelectItem value="quincenal" className="text-white">Quincenal</SelectItem>
                    <SelectItem value="mensual" className="text-white">Mensual</SelectItem>
                    <SelectItem value="anual" className="text-white">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-white/90 text-base">
                  Fecha de tu ingreso
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white h-14"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white h-14 text-lg font-semibold"
              >
                Agregar Ingreso
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Button
          size="icon"
          onClick={() => navigate('/categorias')}
          className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Sliders className="h-5 w-5" />
        </Button>
      </div>

      {/* Ordenar por */}
      <div className="px-4 mb-4">
        <p className="text-primary text-center text-sm">Ordenar por: <span className="font-medium">Más reciente</span></p>
      </div>

      {/* Lista de transacciones */}
      <div className="px-4 space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : transactions.length === 0 ? (
          <Card className="p-6 bg-card text-center">
            <p className="text-muted-foreground">No hay ingresos registrados este mes</p>
          </Card>
        ) : (
          transactions.map((item) => {
            const transactionDate = new Date(item.transaction_date);
            const day = transactionDate.getDate();
            const month = monthNames[transactionDate.getMonth()];
            const year = transactionDate.getFullYear();
            
            return (
              <Card key={item.id} className="bg-card border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Logo del banco */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🏦</span>
                    </div>
                    
                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm">
                        {item.description.toUpperCase()}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {day} {month} {year}
                      </p>
                    </div>
                    
                    {/* Monto */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-foreground">
                        ${Number(item.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Ingresos;
