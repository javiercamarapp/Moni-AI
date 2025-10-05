import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar,
  DollarSign,
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

const Ingresos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  // Datos de ejemplo
  const totalIngresos = 50000;
  const historial = [
    { id: 1, concepto: 'Sueldo', categoria: 'Salario', tipo: 'Débito', monto: 50000, fecha: '04 Oct 2025' },
    { id: 2, concepto: 'Freelance', categoria: 'Trabajo', tipo: 'Transferencia', monto: 15000, fecha: '02 Oct 2025' },
    { id: 3, concepto: 'Venta', categoria: 'Negocio', tipo: 'Efectivo', monto: 8500, fecha: '01 Oct 2025' },
  ];

  const categorias = [
    { nombre: 'Salario', total: 50000, color: 'bg-primary/20' },
    { nombre: 'Freelance', total: 15000, color: 'bg-secondary/20' },
    { nombre: 'Negocio', total: 8500, color: 'bg-accent/20' },
  ];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Ingreso registrado",
      description: "Tu ingreso ha sido agregado exitosamente",
    });
    setShowAddDialog(false);
    setAmount('');
    setDescription('');
    setCategory('');
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
            <DialogContent className="bg-gradient-card border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Registrar Ingreso</DialogTitle>
                <DialogDescription className="text-white/70">
                  Completa los detalles de tu ingreso
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white">
                    Monto
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="$0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Ej: Sueldo mensual, Freelance, Venta..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">
                    Categoría
                  </Label>
                  <Input
                    id="category"
                    placeholder="Ej: Salario, Negocio, Inversión..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-white">
                    Fecha
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white"
                  >
                    Registrar
                  </Button>
                </div>
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
                        Categoría de ingreso
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

export default Ingresos;
