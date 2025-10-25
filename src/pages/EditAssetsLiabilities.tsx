import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, TrendingUp, TrendingDown, Droplet, Home, CreditCard, Building2, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const assetCategories = [
  { name: 'Cuentas bancarias (ahorro + cheques)', category: 'Checking', examples: ['BBVA Cuenta Ahorro', 'Santander Nómina', 'Banorte Smart'] },
  { name: 'Inversiones financieras (fondos, CETES, bonos)', category: 'Investments', examples: ['CETES 28 días', 'Fondo GBM+', 'Bonos HSBC'] },
  { name: 'Acciones o ETFs en bolsa', category: 'Investments', examples: ['Apple (AAPL)', 'Tesla (TSLA)', 'VOO ETF'] },
  { name: 'Criptomonedas', category: 'Investments', examples: ['Bitcoin (BTC)', 'Ethereum (ETH)', 'USDT Stablecoin'] },
  { name: 'Propiedad principal (casa o departamento)', category: 'Property', examples: ['Casa Polanco', 'Depto Reforma', 'Casa Santa Fe'] },
  { name: 'Propiedades adicionales (en renta o inversión)', category: 'Property', examples: ['Depto en Renta Centro', 'Local Comercial', 'Casa Playa'] },
  { name: 'Vehículos (auto o moto)', category: 'Other', examples: ['Toyota Corolla 2020', 'Honda CRV', 'Moto Italika'] },
  { name: 'Ahorro para el retiro (Afore o plan privado)', category: 'Savings', examples: ['Afore Sura', 'Plan Pensión', 'Afore XXI Banorte'] },
  { name: 'Seguros con valor de rescate / inversión', category: 'Savings', examples: ['Seguro Vida GNP', 'Plan Metlife', 'AXA Inversión'] },
  { name: 'Dinero prestado a terceros (por cobrar)', category: 'Other', examples: ['Préstamo a Juan', 'Deuda Socio', 'Préstamo Hermano'] },
  { name: 'Participaciones en empresas o startups', category: 'Investments', examples: ['Startup Tech', 'Negocio Restaurante', 'Empresa Familiar'] },
  { name: 'Propiedad intelectual (marca, royalties, licencias)', category: 'Other', examples: ['Marca Registrada', 'Royalties Libro', 'Patente Software'] },
  { name: 'Saldos en apps fintech (MercadoPago, PayPal, Revolut)', category: 'Checking', examples: ['Mercado Pago', 'PayPal USD', 'Revolut EUR'] },
  { name: 'Inventario o mercancía para venta', category: 'Other', examples: ['Inventario Tienda', 'Productos Bodega', 'Mercancía Online'] },
  { name: 'Obras de arte / joyas / metales preciosos', category: 'Other', examples: ['Anillo Oro', 'Cuadro Arte', 'Monedas Plata'] },
];

const liabilityCategories = [
  { name: 'Deuda de tarjetas de crédito', category: 'Credit', examples: ['Tarjeta Banamex', 'BBVA Azul', 'Liverpool Premium'] },
  { name: 'Préstamo personal bancario o fintech', category: 'Loans', examples: ['Préstamo Personal HSBC', 'Kueski', 'Crédito Santander'] },
  { name: 'Crédito automotriz', category: 'Loans', examples: ['Crédito Auto VW', 'Ford Credit', 'Santander Auto'] },
  { name: 'Hipoteca o préstamo hipotecario', category: 'Mortgage', examples: ['Hipoteca Infonavit', 'HSBC Hipotecario', 'Scotiabank Casa'] },
  { name: 'Créditos educativos / estudiantiles', category: 'Loans', examples: ['Crédito Universidad', 'Préstamo Maestría', 'Sofes Educativo'] },
  { name: 'Préstamos con familiares o amigos', category: 'Other', examples: ['Préstamo Mamá', 'Deuda Hermano', 'Préstamo Amigo'] },
  { name: 'Créditos de nómina o payroll loans', category: 'Loans', examples: ['Crédito Nómina', 'Adelanto Sueldo', 'Préstamo Empresa'] },
  { name: 'Deudas en tiendas departamentales (Liverpool, Coppel)', category: 'Credit', examples: ['Liverpool', 'Coppel', 'Palacio de Hierro'] },
  { name: 'Pagos diferidos / meses sin intereses', category: 'Credit', examples: ['iPhone 12 MSI', 'Laptop HP', 'Muebles 18 MSI'] },
  { name: 'Créditos empresariales / de negocio', category: 'Loans', examples: ['Crédito Pyme', 'Capital Trabajo', 'Préstamo Negocio'] },
  { name: 'Cuotas de mantenimiento o servicios atrasados', category: 'Other', examples: ['Mantenimiento Edificio', 'Luz CFE', 'Agua Pendiente'] },
  { name: 'Deudas con proveedores o socios', category: 'Other', examples: ['Deuda Proveedor', 'Pago Socio', 'Factura Pendiente'] },
  { name: 'Créditos en moneda extranjera (USD/EUR)', category: 'Loans', examples: ['Crédito USD', 'Préstamo EUR', 'Deuda Dólares'] },
  { name: 'Impuestos o multas pendientes de pago', category: 'Other', examples: ['ISR Pendiente', 'Multa Tránsito', 'IVA por Pagar'] },
  { name: 'Arrendamientos financieros (leasing)', category: 'Loans', examples: ['Leasing Auto', 'Renta Equipo', 'Arrendamiento Oficina'] },
];

type ExistingAsset = {
  id: string;
  name: string;
  value: number;
  category: string;
};

type ExistingLiability = {
  id: string;
  name: string;
  value: number;
  category: string;
};

export default function EditAssetsLiabilities() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'assets';
  
  const [existingAssets, setExistingAssets] = useState<ExistingAsset[]>([]);
  const [existingLiabilities, setExistingLiabilities] = useState<ExistingLiability[]>([]);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetValue, setNewAssetValue] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState("");
  const [newLiabilityName, setNewLiabilityName] = useState("");
  const [newLiabilityValue, setNewLiabilityValue] = useState("");
  const [newLiabilityCategory, setNewLiabilityCategory] = useState("");
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Cargar activos existentes
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('value', { ascending: false });

      // Cargar pasivos existentes
      const { data: liabilities } = await supabase
        .from('liabilities')
        .select('*')
        .eq('user_id', user.id)
        .order('value', { ascending: false });

      setExistingAssets(assets || []);
      setExistingLiabilities(liabilities || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Error al cargar datos");
    }
  };

  const isLiquidAsset = (category: string) => {
    const liquidCategories = ['Checking', 'Savings', 'Investments'];
    return liquidCategories.includes(category);
  };

  const isCurrentLiability = (category: string) => {
    return category === 'Credit';
  };

  const handleAddAsset = async () => {
    if (!newAssetName.trim() || !newAssetValue || !newAssetCategory) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          name: newAssetName.trim(),
          value: parseFloat(newAssetValue),
          category: newAssetCategory
        });

      if (error) throw error;

      toast.success("Activo agregado");
      setNewAssetName("");
      setNewAssetValue("");
      setNewAssetCategory("");
      setShowAddAsset(false);
      loadData();
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error("Error al agregar activo");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiability = async () => {
    if (!newLiabilityName.trim() || !newLiabilityValue || !newLiabilityCategory) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('liabilities')
        .insert({
          user_id: user.id,
          name: newLiabilityName.trim(),
          value: parseFloat(newLiabilityValue),
          category: newLiabilityCategory
        });

      if (error) throw error;

      toast.success("Pasivo agregado");
      setNewLiabilityName("");
      setNewLiabilityValue("");
      setNewLiabilityCategory("");
      setShowAddLiability(false);
      loadData();
    } catch (error) {
      console.error('Error adding liability:', error);
      toast.error("Error al agregar pasivo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("¿Eliminar este activo?")) return;

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Activo eliminado");
      loadData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error("Error al eliminar activo");
    }
  };

  const handleDeleteLiability = async (id: string) => {
    if (!confirm("¿Eliminar este pasivo?")) return;

    try {
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Pasivo eliminado");
      loadData();
    } catch (error) {
      console.error('Error deleting liability:', error);
      toast.error("Error al eliminar pasivo");
    }
  };

  const handleUpdateAsset = async (id: string, field: 'name' | 'value', value: string) => {
    try {
      const updateData = field === 'value' 
        ? { value: parseFloat(value) }
        : { name: value };

      const { error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setExistingAssets(prev => prev.map(a => 
        a.id === id ? { ...a, [field]: field === 'value' ? parseFloat(value) : value } : a
      ));
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error("Error al actualizar activo");
    }
  };

  const handleUpdateLiability = async (id: string, field: 'name' | 'value', value: string) => {
    try {
      const updateData = field === 'value' 
        ? { value: parseFloat(value) }
        : { name: value };

      const { error } = await supabase
        .from('liabilities')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setExistingLiabilities(prev => prev.map(l => 
        l.id === id ? { ...l, [field]: field === 'value' ? parseFloat(value) : value } : l
      ));
    } catch (error) {
      console.error('Error updating liability:', error);
      toast.error("Error al actualizar pasivo");
    }
  };

  const liquidAssets = existingAssets.filter(a => isLiquidAsset(a.category));
  const fixedAssets = existingAssets.filter(a => !isLiquidAsset(a.category));
  const currentLiabilities = existingLiabilities.filter(l => isCurrentLiability(l.category));
  const nonCurrentLiabilities = existingLiabilities.filter(l => !isCurrentLiability(l.category));

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-12 w-12"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestionar Patrimonio</h1>
              <p className="text-sm text-foreground/80">Activos y Pasivos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="assets">
              <TrendingUp className="h-4 w-4 mr-2" />
              Activos
            </TabsTrigger>
            <TabsTrigger value="liabilities">
              <TrendingDown className="h-4 w-4 mr-2" />
              Pasivos
            </TabsTrigger>
          </TabsList>

          {/* ACTIVOS TAB */}
          <TabsContent value="assets" className="space-y-6">
            {/* Activos Líquidos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <Droplet className="h-5 w-5 text-white" />
                  </div>
                  Activos Líquidos
                </h3>
                <div className="px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-blue-700">
                    {liquidAssets.length}
                  </p>
                </div>
              </div>

              {liquidAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 pointer-events-none" />
                    
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Droplet className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={asset.name}
                          onChange={(e) => handleUpdateAsset(asset.id, 'name', e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== asset.name) {
                              handleUpdateAsset(asset.id, 'name', e.target.value.trim());
                            }
                          }}
                          className="font-bold text-base bg-white/50 border-gray-200/50"
                          placeholder="Nombre del activo"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={asset.value}
                            onChange={(e) => handleUpdateAsset(asset.id, 'value', e.target.value)}
                            onBlur={(e) => {
                              if (parseFloat(e.target.value) !== asset.value) {
                                handleUpdateAsset(asset.id, 'value', e.target.value);
                              }
                            }}
                            className="flex-1 text-lg font-semibold bg-white/50 border-gray-200/50"
                            placeholder="Valor"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-red-600 hover:bg-red-50 hover:scale-110 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{asset.category}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Agregar nuevo activo líquido */}
              {!showAddAsset && (
                <Button
                  onClick={() => {
                    setShowAddAsset(true);
                    setNewAssetCategory('Checking');
                  }}
                  className="w-full bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg hover:bg-white/80 border border-blue-100 hover:scale-105 transition-all"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Activo Líquido
                </Button>
              )}
            </div>

            {/* Activos Fijos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  Activos Fijos
                </h3>
                <div className="px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-amber-700">
                    {fixedAssets.length}
                  </p>
                </div>
              </div>

              {fixedAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-amber-600/10 pointer-events-none" />
                    
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Home className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={asset.name}
                          onChange={(e) => handleUpdateAsset(asset.id, 'name', e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== asset.name) {
                              handleUpdateAsset(asset.id, 'name', e.target.value.trim());
                            }
                          }}
                          className="font-bold text-base bg-white/50 border-gray-200/50"
                          placeholder="Nombre del activo"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={asset.value}
                            onChange={(e) => handleUpdateAsset(asset.id, 'value', e.target.value)}
                            onBlur={(e) => {
                              if (parseFloat(e.target.value) !== asset.value) {
                                handleUpdateAsset(asset.id, 'value', e.target.value);
                              }
                            }}
                            className="flex-1 text-lg font-semibold bg-white/50 border-gray-200/50"
                            placeholder="Valor"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-red-600 hover:bg-red-50 hover:scale-110 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{asset.category}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Agregar nuevo activo fijo */}
              <Button
                onClick={() => {
                  setShowAddAsset(true);
                  setNewAssetCategory('Property');
                }}
                className="w-full bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg hover:bg-white/80 border border-blue-100 hover:scale-105 transition-all"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Activo Fijo
              </Button>
            </div>

            {/* Formulario para agregar activo */}
            {showAddAsset && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-5 bg-white/70 backdrop-blur-xl rounded-[20px] shadow-xl border-2 border-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Agregar Nuevo Activo
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">Tipo de Activo</Label>
                        <select
                          value={newAssetCategory}
                          onChange={(e) => setNewAssetCategory(e.target.value)}
                          className="w-full p-3 border rounded-xl bg-white/50 border-gray-200/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                          <option value="">Selecciona...</option>
                          {assetCategories.map((cat, idx) => (
                            <option key={idx} value={cat.category}>{cat.name}</option>
                          ))}
                          <option value="Custom">Activo Personalizado</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold">Nombre</Label>
                        <Input
                          value={newAssetName}
                          onChange={(e) => setNewAssetName(e.target.value)}
                          placeholder="Ej: BBVA Cuenta Ahorro"
                          className="bg-white/50 border-gray-200/50 focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold">Valor</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">$</span>
                          <Input
                            type="number"
                            value={newAssetValue}
                            onChange={(e) => setNewAssetValue(e.target.value)}
                            placeholder="0"
                            className="flex-1 bg-white/50 border-gray-200/50 focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleAddAsset}
                          disabled={loading}
                          className="flex-1 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddAsset(false);
                            setNewAssetName("");
                            setNewAssetValue("");
                            setNewAssetCategory("");
                          }}
                          variant="outline"
                          className="bg-white/50 hover:bg-white/80"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* PASIVOS TAB */}
          <TabsContent value="liabilities" className="space-y-6">
            {/* Pasivos Corrientes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  Pasivos Corrientes
                </h3>
                <div className="px-3 py-1 rounded-full bg-red-500/20 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-red-700">
                    {currentLiabilities.length}
                  </p>
                </div>
              </div>

              {currentLiabilities.map((liability, index) => (
                <motion.div
                  key={liability.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-red-600/10 pointer-events-none" />
                    
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={liability.name}
                          onChange={(e) => handleUpdateLiability(liability.id, 'name', e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== liability.name) {
                              handleUpdateLiability(liability.id, 'name', e.target.value.trim());
                            }
                          }}
                          className="font-bold text-base bg-white/50 border-gray-200/50"
                          placeholder="Nombre del pasivo"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={liability.value}
                            onChange={(e) => handleUpdateLiability(liability.id, 'value', e.target.value)}
                            onBlur={(e) => {
                              if (parseFloat(e.target.value) !== liability.value) {
                                handleUpdateLiability(liability.id, 'value', e.target.value);
                              }
                            }}
                            className="flex-1 text-lg font-semibold bg-white/50 border-gray-200/50"
                            placeholder="Valor"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLiability(liability.id)}
                            className="text-red-600 hover:bg-red-50 hover:scale-110 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{liability.category}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              <Button
                onClick={() => {
                  setShowAddLiability(true);
                  setNewLiabilityCategory('Credit');
                }}
                className="w-full bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg hover:bg-white/80 border border-blue-100 hover:scale-105 transition-all"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Pasivo Corriente
              </Button>
            </div>

            {/* Pasivos No Corrientes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  Pasivos No Corrientes
                </h3>
                <div className="px-3 py-1 rounded-full bg-orange-500/20 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-orange-700">
                    {nonCurrentLiabilities.length}
                  </p>
                </div>
              </div>

              {nonCurrentLiabilities.map((liability, index) => (
                <motion.div
                  key={liability.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/10 pointer-events-none" />
                    
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={liability.name}
                          onChange={(e) => handleUpdateLiability(liability.id, 'name', e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== liability.name) {
                              handleUpdateLiability(liability.id, 'name', e.target.value.trim());
                            }
                          }}
                          className="font-bold text-base bg-white/50 border-gray-200/50"
                          placeholder="Nombre del pasivo"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={liability.value}
                            onChange={(e) => handleUpdateLiability(liability.id, 'value', e.target.value)}
                            onBlur={(e) => {
                              if (parseFloat(e.target.value) !== liability.value) {
                                handleUpdateLiability(liability.id, 'value', e.target.value);
                              }
                            }}
                            className="flex-1 text-lg font-semibold bg-white/50 border-gray-200/50"
                            placeholder="Valor"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLiability(liability.id)}
                            className="text-red-600 hover:bg-red-50 hover:scale-110 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{liability.category}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              <Button
                onClick={() => {
                  setShowAddLiability(true);
                  setNewLiabilityCategory('Mortgage');
                }}
                className="w-full bg-white/70 backdrop-blur-xl rounded-[20px] shadow-lg hover:bg-white/80 border border-blue-100 hover:scale-105 transition-all"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Pasivo No Corriente
              </Button>
            </div>

            {/* Formulario para agregar pasivo */}
            {showAddLiability && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-5 bg-white/70 backdrop-blur-xl rounded-[20px] shadow-xl border-2 border-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Agregar Nuevo Pasivo
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">Tipo de Pasivo</Label>
                        <select
                          value={newLiabilityCategory}
                          onChange={(e) => setNewLiabilityCategory(e.target.value)}
                          className="w-full p-3 border rounded-xl bg-white/50 border-gray-200/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                          <option value="">Selecciona...</option>
                          {liabilityCategories.map((cat, idx) => (
                            <option key={idx} value={cat.category}>{cat.name}</option>
                          ))}
                          <option value="Custom">Pasivo Personalizado</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold">Nombre</Label>
                        <Input
                          value={newLiabilityName}
                          onChange={(e) => setNewLiabilityName(e.target.value)}
                          placeholder="Ej: Tarjeta Banamex"
                          className="bg-white/50 border-gray-200/50 focus:border-primary/50"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold">Valor</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">$</span>
                          <Input
                            type="number"
                            value={newLiabilityValue}
                            onChange={(e) => setNewLiabilityValue(e.target.value)}
                            placeholder="0"
                            className="flex-1 bg-white/50 border-gray-200/50 focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleAddLiability}
                          disabled={loading}
                          className="flex-1 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddLiability(false);
                            setNewLiabilityName("");
                            setNewLiabilityValue("");
                            setNewLiabilityCategory("");
                          }}
                          variant="outline"
                          className="bg-white/50 hover:bg-white/80"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}
