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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Tag,
  Sliders
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import whatsappLogo from '@/assets/whatsapp-logo.png';
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
  const [loading, setLoading] = useState(false); // Changed to false for instant load

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

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'ingreso');

      setCategories(categoriesData || []);

      // Fetch transactions for current month
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

  // Calcular totales por categoría
  const categoriasConTotales = categories.map(cat => {
    const total = transactions
      .filter(t => t.category_id === cat.id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { ...cat, total };
  }).filter(cat => cat.total > 0);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          description,
          category_id: category || null,
          payment_method: paymentMethod,
          account,
          frequency,
          transaction_date: date,
          type: 'ingreso',
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
    <div className="min-h-screen animated-wave-bg">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Tus Ingresos
            </h1>
            <p className="text-sm text-white/80">Gestiona tus entradas</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="icon"
            onClick={handleWhatsAppRegister}
            className="bg-white/20 hover:bg-white/30 border-white/30 p-2"
          >
            <img src={whatsappLogo} alt="WhatsApp" className="w-6 h-6 object-contain" />
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                <Plus className="h-5 w-5 text-white" />
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
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            <Sliders className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Total y navegación de mes */}
      <div className="px-4 mb-6">
        <Card className="p-6 bg-gradient-card card-glow text-center">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div>
              <p className="text-sm text-white/70 mb-2">Total del mes</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-green-500 mb-2">
                ${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-white/80">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Tabs: Historial y Categorías */}
      <div className="px-4">
        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="w-full bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="historial" className="flex-1 data-[state=active]:bg-white/20 text-white">
              Tu Historial
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex-1 data-[state=active]:bg-white/20 text-white">
              Tus Categorías
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-white text-center">Cargando...</p>
            ) : transactions.length === 0 ? (
              <Card className="p-6 bg-gradient-card card-glow text-center">
                <p className="text-white/70">No hay ingresos registrados este mes</p>
              </Card>
            ) : (
              transactions.map((item) => (
                <Card key={item.id} className="p-4 bg-gradient-card card-glow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.description}
                      </h3>
                      <div className="flex gap-2">
                        {item.categories && (
                          <Badge className="bg-white/20 text-white border-white/30">
                            {item.categories.name}
                          </Badge>
                        )}
                        {item.payment_method && (
                          <Badge className="bg-white/10 text-white/80 border-white/20">
                            {item.payment_method}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        ${Number(item.amount).toLocaleString('es-MX')}
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        {new Date(item.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="categorias" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-white text-center">Cargando...</p>
            ) : categoriasConTotales.length === 0 ? (
              <Card className="p-6 bg-gradient-card card-glow text-center">
                <p className="text-white/70 mb-4">No hay categorías con ingresos este mes</p>
                <Button
                  onClick={() => navigate('/categorias')}
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  Gestionar Categorías
                </Button>
              </Card>
            ) : (
              categoriasConTotales.map((cat) => (
                <Card key={cat.id} className="p-4 bg-gradient-card card-glow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${cat.color} flex items-center justify-center`}>
                        <Tag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {cat.name}
                        </h3>
                        <p className="text-sm text-white/70">
                          Categoría de ingreso
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${cat.total.toLocaleString('es-MX')}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Ingresos;
