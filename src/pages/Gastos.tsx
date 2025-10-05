import { useState } from 'react';
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
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import whatsappLogo from '@/assets/whatsapp-logo.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  // Datos de ejemplo
  const totalGastos = 35000;
  const historial = [
    { id: 1, concepto: 'Renta', categoria: 'Vivienda', tipo: 'Transferencia', monto: 15000, fecha: '05 Oct 2025' },
    { id: 2, concepto: 'Supermercado', categoria: 'Alimentación', tipo: 'Tarjeta', monto: 8500, fecha: '03 Oct 2025' },
    { id: 3, concepto: 'Gasolina', categoria: 'Transporte', tipo: 'Efectivo', monto: 2500, fecha: '02 Oct 2025' },
    { id: 4, concepto: 'Luz', categoria: 'Servicios', tipo: 'Débito', monto: 1200, fecha: '01 Oct 2025' },
  ];

  const categorias = [
    { nombre: 'Vivienda', total: 15000, color: 'bg-red-500/20' },
    { nombre: 'Alimentación', total: 8500, color: 'bg-orange-500/20' },
    { nombre: 'Transporte', total: 5500, color: 'bg-yellow-500/20' },
    { nombre: 'Servicios', total: 3200, color: 'bg-blue-500/20' },
    { nombre: 'Entretenimiento', total: 2800, color: 'bg-purple-500/20' },
  ];

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
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
              Tus Gastos
            </h1>
            <p className="text-sm text-white/80">Gestiona tus salidas</p>
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
                  Registrar Gasto
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white/90 text-base">
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
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 h-14 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white/90 text-base">
                    ¿Qué nombre le quieres dar?
                  </Label>
                  <Input
                    id="description"
                    placeholder="Nombre de tu gasto"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 h-14"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-base">
                    ¿El gasto lo hiciste con?
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                      <SelectValue placeholder="Selecciona método de pago" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/20 z-50">
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-base">
                    ¿De cuál tarjeta/cuenta salió el gasto?
                  </Label>
                  <Select value={account} onValueChange={setAccount} required>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                      <SelectValue placeholder="Escoge o agrega tu tarjeta/cuenta" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/20 z-50">
                      <SelectItem value="banco1">Cuenta Principal</SelectItem>
                      <SelectItem value="banco2">Cuenta de Ahorros</SelectItem>
                      <SelectItem value="banco3">Tarjeta Nómina</SelectItem>
                      <SelectItem value="otro">Otra cuenta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-base">
                    Categoría de tu gasto
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                      <SelectValue placeholder="Categorías" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/20 z-50">
                      <SelectItem value="vivienda">Vivienda</SelectItem>
                      <SelectItem value="alimentacion">Alimentación</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="servicios">Servicios</SelectItem>
                      <SelectItem value="entretenimiento">Entretenimiento</SelectItem>
                      <SelectItem value="salud">Salud</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-base">
                    ¿Cada cuánto tienes este gasto?
                  </Label>
                  <Select value={frequency} onValueChange={setFrequency} required>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white h-14">
                      <SelectValue placeholder="Sin frecuencia" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/20 z-50">
                      <SelectItem value="unico">Sin frecuencia</SelectItem>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-white/90 text-base">
                    Fecha de tu gasto
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
                  Agregar Gasto
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-2">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
            {historial.map((item) => (
              <Card key={item.id} className="p-4 bg-gradient-card card-glow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.concepto}
                    </h3>
                    <div className="flex gap-2">
                      <Badge className="bg-white/20 text-white border-white/30">
                        {item.categoria}
                      </Badge>
                      <Badge className="bg-white/10 text-white/80 border-white/20">
                        {item.tipo}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      ${item.monto.toLocaleString('es-MX')}
                    </p>
                    <p className="text-sm text-white/70 mt-1">
                      {item.fecha}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="categorias" className="space-y-3 mt-4">
            {categorias.map((cat, index) => (
              <Card key={index} className="p-4 bg-gradient-card card-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {cat.nombre}
                      </h3>
                      <p className="text-sm text-white/70">
                        Categoría de gasto
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${cat.total.toLocaleString('es-MX')}
                  </p>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gastos;
