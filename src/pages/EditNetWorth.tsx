import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Trash2, Wallet, Home, TrendingUp, FileText, Sparkles, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Item {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  items: Item[];
  insight: string;
}

const ASSET_CATEGORIES: Category[] = [
  {
    id: 'liquidos',
    name: 'Activos líquidos',
    icon: '💧',
    insight: 'Dinero disponible inmediatamente para usar',
    items: [
      { id: 'efectivo', name: 'Efectivo' },
      { id: 'caja_chica', name: 'Caja chica' },
      { id: 'cuenta_ahorro', name: 'Cuenta de ahorro' },
      { id: 'cuenta_corriente', name: 'Cuenta corriente' },
      { id: 'fondo_liquido', name: 'Fondo de inversión líquido' },
      { id: 'paypal', name: 'PayPal' },
      { id: 'mercadopago', name: 'MercadoPago' },
      { id: 'wise', name: 'Wise' },
      { id: 'dolares', name: 'Dólares' },
      { id: 'criptomonedas', name: 'Criptomonedas' },
    ]
  },
  {
    id: 'fijos',
    name: 'Activos fijos',
    icon: '🏠',
    insight: 'Bienes tangibles de largo plazo',
    items: [
      { id: 'vivienda', name: 'Vivienda principal' },
      { id: 'casa_veraneo', name: 'Casa de veraneo' },
      { id: 'terreno', name: 'Terreno' },
      { id: 'auto', name: 'Auto' },
      { id: 'moto', name: 'Moto' },
      { id: 'embarcacion', name: 'Embarcación' },
      { id: 'muebles', name: 'Muebles' },
      { id: 'equipo_computo', name: 'Equipo de cómputo' },
      { id: 'arte', name: 'Arte' },
      { id: 'joyeria', name: 'Joyería' },
    ]
  },
  {
    id: 'financieros',
    name: 'Activos financieros',
    icon: '📈',
    insight: 'Inversiones que generan rendimiento',
    items: [
      { id: 'acciones', name: 'Acciones' },
      { id: 'bonos', name: 'Bonos' },
      { id: 'etfs', name: 'ETFs' },
      { id: 'cetes', name: 'Cetes' },
      { id: 'afore', name: 'AFORE' },
      { id: 'crowdfunding', name: 'Crowdfunding' },
      { id: 'reit', name: 'REIT' },
      { id: 'inversion_negocio', name: 'Inversión en negocio' },
      { id: 'contrato_renta', name: 'Contrato de renta' },
      { id: 'cripto_staking', name: 'Cripto staking' },
    ]
  },
  {
    id: 'por_cobrar',
    name: 'Activos por cobrar',
    icon: '📄',
    insight: 'Dinero que te deben otras personas',
    items: [
      { id: 'prestamos_terceros', name: 'Préstamos a terceros' },
      { id: 'cuentas_cobrar', name: 'Cuentas por cobrar' },
      { id: 'anticipos', name: 'Anticipos' },
      { id: 'reembolsos', name: 'Reembolsos' },
      { id: 'dividendos', name: 'Dividendos pendientes' },
    ]
  },
  {
    id: 'intangibles',
    name: 'Activos intangibles',
    icon: '✨',
    insight: 'Activos sin forma física pero con valor',
    items: [
      { id: 'dominio_web', name: 'Dominio web' },
      { id: 'software', name: 'Software propio' },
      { id: 'licencias', name: 'Licencias' },
      { id: 'derechos_autor', name: 'Derechos de autor' },
      { id: 'marca', name: 'Marca registrada' },
      { id: 'nft', name: 'NFT' },
    ]
  },
  {
    id: 'personalizado_activo',
    name: 'Activo personalizado',
    icon: '⭐',
    insight: 'Crea tu propia categoría de activos',
    items: [
      { id: 'activo_personalizado_1', name: 'Concepto 1' },
    ]
  },
];

const LIABILITY_CATEGORIES: Category[] = [
  {
    id: 'corrientes',
    name: 'Pasivos corrientes (corto plazo)',
    icon: '💳',
    insight: 'Deudas a pagar en el corto plazo (< 1 año)',
    items: [
      { id: 'tarjeta_credito', name: 'Tarjeta de crédito' },
      { id: 'credito_nomina', name: 'Crédito de nómina' },
      { id: 'prestamo_personal', name: 'Préstamo personal' },
      { id: 'credito_auto_corto', name: 'Crédito automotriz corto' },
      { id: 'servicios_pagar', name: 'Servicios por pagar' },
      { id: 'renta_corriente', name: 'Renta corriente' },
      { id: 'suscripciones', name: 'Suscripciones' },
      { id: 'impuestos_mensuales', name: 'Impuestos mensuales' },
      { id: 'compras_plazos', name: 'Compras a plazos' },
      { id: 'deudas_familiares', name: 'Deudas familiares' },
    ]
  },
  {
    id: 'no_corrientes',
    name: 'Pasivos no corrientes (largo plazo)',
    icon: '🏦',
    insight: 'Deudas a pagar en el largo plazo (> 1 año)',
    items: [
      { id: 'hipoteca', name: 'Hipoteca' },
      { id: 'credito_auto_largo', name: 'Crédito automotriz largo' },
      { id: 'credito_educativo', name: 'Crédito educativo' },
      { id: 'credito_infonavit', name: 'Crédito Infonavit' },
      { id: 'prestamo_empresarial', name: 'Préstamo bancario empresarial' },
      { id: 'leasing', name: 'Leasing de equipo' },
      { id: 'prestamo_aval', name: 'Préstamo con aval' },
      { id: 'credito_consolidado', name: 'Crédito consolidado' },
      { id: 'deuda_inversion', name: 'Deuda inversión' },
      { id: 'obligaciones_fiscales', name: 'Obligaciones fiscales' },
    ]
  },
  {
    id: 'contingentes',
    name: 'Pasivos contingentes o legales',
    icon: '⚠️',
    insight: 'Obligaciones potenciales o legales',
    items: [
      { id: 'multas', name: 'Multas' },
      { id: 'litigios', name: 'Litigios' },
      { id: 'pension', name: 'Pensión alimenticia' },
      { id: 'avales', name: 'Avales' },
      { id: 'garantias', name: 'Garantías' },
      { id: 'pagos_diferidos', name: 'Pagos diferidos' },
      { id: 'deuda_socios', name: 'Deuda con socios' },
      { id: 'anticipos_clientes', name: 'Anticipos de clientes' },
      { id: 'mantenimiento', name: 'Mantenimiento pendiente' },
      { id: 'contratos_futuros', name: 'Contratos futuros' },
    ]
  },
  {
    id: 'personalizado_pasivo',
    name: 'Pasivo personalizado',
    icon: '⭐',
    insight: 'Crea tu propia categoría de pasivos',
    items: [
      { id: 'pasivo_personalizado_1', name: 'Concepto 1' },
    ]
  },
];

export default function EditNetWorth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [assetValues, setAssetValues] = useState<Record<string, { nombre: string; valor: number }>>({});
  const [liabilityValues, setLiabilityValues] = useState<Record<string, { nombre: string; valor: number }>>({});
  const [customItems, setCustomItems] = useState<Record<string, string>>({});

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
        .from('activos')
        .select('*')
        .eq('user_id', user.id);

      // Cargar pasivos existentes
      const { data: liabilities } = await supabase
        .from('pasivos')
        .select('*')
        .eq('user_id', user.id);

      const loadedAssets: Record<string, { nombre: string; valor: number }> = {};
      const loadedLiabilities: Record<string, { nombre: string; valor: number }> = {};

      // Mapear activos por subcategoría
      if (assets) {
        for (const asset of assets) {
          // Buscar el item correspondiente
          for (const category of ASSET_CATEGORIES) {
            const item = category.items.find(i => i.name.toLowerCase() === asset.subcategoria?.toLowerCase());
            if (item) {
              loadedAssets[item.id] = { nombre: asset.nombre, valor: Number(asset.valor) };
            }
          }
        }
      }

      // Mapear pasivos por subcategoría
      if (liabilities) {
        for (const liability of liabilities) {
          // Buscar el item correspondiente
          for (const category of LIABILITY_CATEGORIES) {
            const item = category.items.find(i => i.name.toLowerCase() === liability.subcategoria?.toLowerCase());
            if (item) {
              loadedLiabilities[item.id] = { nombre: liability.nombre, valor: Number(liability.valor) };
            }
          }
        }
      }

      setAssetValues(loadedAssets);
      setLiabilityValues(loadedLiabilities);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (!value || value === 0) return "";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const updateItemValue = (itemId: string, field: 'nombre' | 'valor', value: string, isAsset: boolean) => {
    if (isAsset) {
      const current = assetValues[itemId] || { nombre: '', valor: 0 };
      setAssetValues({ 
        ...assetValues, 
        [itemId]: { 
          ...current, 
          [field]: field === 'valor' ? (value === "" ? 0 : Number(value)) : value 
        } 
      });
    } else {
      const current = liabilityValues[itemId] || { nombre: '', valor: 0 };
      setLiabilityValues({ 
        ...liabilityValues, 
        [itemId]: { 
          ...current, 
          [field]: field === 'valor' ? (value === "" ? 0 : Number(value)) : value 
        } 
      });
    }
  };

  const handleSaveCategory = async (category: Category, isAsset: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const values = isAsset ? assetValues : liabilityValues;
      const tableName = isAsset ? 'activos' : 'pasivos';

      // Procesar todos los items de la categoría
      for (const item of category.items) {
        const itemData = values[item.id];
        
        // Obtener el nombre del item (personalizado o predeterminado)
        const itemName = (item.id.includes('custom_') || category.id.includes('personalizado')) && customItems[item.id]
          ? customItems[item.id]
          : item.name;

        // Buscar si ya existe un registro con esta subcategoría y usuario
        const { data: existing } = await supabase
          .from(tableName)
          .select('id')
          .eq('user_id', user.id)
          .eq('subcategoria', itemName)
          .maybeSingle();

        if (itemData && itemData.valor > 0) {
          // Si tiene valor, insertar o actualizar
          const dataToSave = {
            user_id: user.id,
            nombre: itemData.nombre || itemName,
            valor: itemData.valor,
            categoria: category.name,
            subcategoria: itemName,
            moneda: 'MXN',
            ...(isAsset ? {
              es_activo_fijo: category.id === 'fijos'
            } : {
              es_corto_plazo: category.id === 'corrientes'
            })
          };

          if (existing) {
            // Actualizar registro existente
            await supabase
              .from(tableName)
              .update(dataToSave)
              .eq('id', existing.id);
          } else {
            // Insertar nuevo registro
            await supabase
              .from(tableName)
              .insert(dataToSave);
          }
        } else if (existing) {
          // Si no tiene valor pero existe en la BD, eliminarlo
          await supabase
            .from(tableName)
            .delete()
            .eq('id', existing.id);
        }
      }

      toast.success(`${category.name} actualizado`);
      setExpandedCategory(null);
      await loadData(); // Recargar datos para reflejar cambios
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">✏️ Gestionar Patrimonio</h1>
          <div className="w-9" />
        </div>

        {/* Main Card */}
        <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">💰</div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Modifica tus activos y pasivos
              </h2>
              <p className="text-xs text-muted-foreground">
                Toca para ver subcategorías y ajustar valores
              </p>
            </div>

            <Tabs defaultValue="activos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="activos">Activos</TabsTrigger>
                <TabsTrigger value="pasivos">Pasivos</TabsTrigger>
              </TabsList>

              {/* ACTIVOS TAB */}
              <TabsContent value="activos" className="space-y-2">
                {ASSET_CATEGORIES.map((category, index) => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.id ? null : category.id
                      )}
                      className="w-full p-3 rounded-[15px] border-2 transition-all text-left border-blue-100 bg-white hover:border-primary/50 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {category.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {Object.values(assetValues).filter(v => v.valor > 0).length} items
                            </p>
                          </div>
                        </div>
                        <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedCategory === category.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </button>

                    {/* Expanded Panel */}
                    {expandedCategory === category.id && (
                      <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-1.5 py-2 animate-fade-in">
                        <p className="text-[9px] text-muted-foreground italic mb-2">
                          💡 {category.insight}
                        </p>

                        {/* Items */}
                        <div className="space-y-1.5">
                          {category.items.map((item) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg px-2 py-2">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                {item.id.includes('custom_') || category.id.includes('personalizado') ? (
                                  <>
                                    <Input
                                      type="text"
                                      placeholder={item.name}
                                      value={customItems[item.id] || ""}
                                      onChange={(e) => {
                                        setCustomItems({ ...customItems, [item.id]: e.target.value });
                                      }}
                                      className="flex-1 h-7 text-[10px] bg-white border-gray-200"
                                    />
                                    {(item.id.includes('personalizado_') || item.id.includes('custom_')) && (
                                      <Button
                                        onClick={() => {
                                          const index = category.items.findIndex(s => s.id === item.id);
                                          if (index > -1) {
                                            category.items.splice(index, 1);
                                          }
                                          const newCustom = { ...customItems };
                                          delete newCustom[item.id];
                                          setCustomItems(newCustom);
                                          
                                          const newAssets = { ...assetValues };
                                          delete newAssets[item.id];
                                          setAssetValues(newAssets);
                                        }}
                                        variant="ghost"
                                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex-1">
                                    <p className="text-[10px] font-semibold text-foreground">
                                      • {item.name}
                                    </p>
                                  </div>
                                )}
                               </div>
                               <div className="space-y-1">
                                 <Input
                                   type="text"
                                   placeholder="Nombre de tu cuenta (ej: BBVA, Santander)"
                                   value={assetValues[item.id]?.nombre || ""}
                                   onChange={(e) => updateItemValue(item.id, 'nombre', e.target.value, true)}
                                   className="w-full h-7 text-[10px] bg-white border-gray-200"
                                 />
                                 <div className="relative flex items-center">
                                   <span className="absolute left-2 text-[10px] font-semibold text-muted-foreground">$</span>
                                   <Input
                                     type="text"
                                     inputMode="numeric"
                                     placeholder="0"
                                     value={assetValues[item.id]?.valor ? formatCurrency(assetValues[item.id].valor) : ""}
                                     onChange={(e) => {
                                       const value = e.target.value.replace(/[^\d]/g, '');
                                       updateItemValue(item.id, 'valor', value, true);
                                     }}
                                     className="w-full h-7 text-[10px] text-right font-semibold pl-4 pr-2 bg-white border-gray-200"
                                   />
                                 </div>
                               </div>
                               {/* Botón + para agregar otra cuenta del mismo tipo */}
                               <div className="flex justify-center mt-1">
                                 <Button
                                   onClick={() => {
                                     const newId = `custom_${item.id}_${Date.now()}`;
                                     const newItem = { id: newId, name: `${item.name} adicional` };
                                     const insertIndex = category.items.findIndex(i => i.id === item.id) + 1;
                                     category.items.splice(insertIndex, 0, newItem);
                                     setCustomItems({ ...customItems });
                                   }}
                                   variant="ghost"
                                   size="sm"
                                   className="h-6 w-6 p-0 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs"
                                 >
                                   +
                                 </Button>
                               </div>
                             </div>
                          ))}
                        </div>

                        {/* Add subcuenta button - para todas las categorías */}
                        <div className="flex justify-center mt-2">
                          <Button
                            onClick={() => {
                              const newId = `custom_${category.id}_${Date.now()}`;
                              const newItem = { id: newId, name: `Cuenta personalizada ${category.items.filter(i => i.id.includes('custom_')).length + 1}` };
                              category.items.push(newItem);
                              setCustomItems({ ...customItems });
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-4"
                          >
                            + Agregar subcuenta
                          </Button>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleSaveCategory(category, true)}
                          disabled={saving}
                          className="w-full mt-2 h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-[15px] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* PASIVOS TAB */}
              <TabsContent value="pasivos" className="space-y-2">
                {LIABILITY_CATEGORIES.map((category, index) => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.id ? null : category.id
                      )}
                      className="w-full p-3 rounded-[15px] border-2 transition-all text-left border-blue-100 bg-white hover:border-primary/50 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {category.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {Object.values(liabilityValues).filter(v => v.valor > 0).length} items
                            </p>
                          </div>
                        </div>
                        <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedCategory === category.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </button>

                    {/* Expanded Panel */}
                    {expandedCategory === category.id && (
                      <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-1.5 py-2 animate-fade-in">
                        <p className="text-[9px] text-muted-foreground italic mb-2">
                          💡 {category.insight}
                        </p>

                        {/* Items */}
                        <div className="space-y-1.5">
                          {category.items.map((item) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg px-2 py-2">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                {item.id.includes('custom_') || category.id.includes('personalizado') ? (
                                  <>
                                    <Input
                                      type="text"
                                      placeholder={item.name}
                                      value={customItems[item.id] || ""}
                                      onChange={(e) => {
                                        setCustomItems({ ...customItems, [item.id]: e.target.value });
                                      }}
                                      className="flex-1 h-7 text-[10px] bg-white border-gray-200"
                                    />
                                    {(item.id.includes('personalizado_') || item.id.includes('custom_')) && (
                                      <Button
                                        onClick={() => {
                                          const index = category.items.findIndex(s => s.id === item.id);
                                          if (index > -1) {
                                            category.items.splice(index, 1);
                                          }
                                          const newCustom = { ...customItems };
                                          delete newCustom[item.id];
                                          setCustomItems(newCustom);
                                          
                                          const newLiabilities = { ...liabilityValues };
                                          delete newLiabilities[item.id];
                                          setLiabilityValues(newLiabilities);
                                        }}
                                        variant="ghost"
                                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex-1">
                                    <p className="text-[10px] font-semibold text-foreground">
                                      • {item.name}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  placeholder="Nombre de tu deuda (ej: BBVA Oro, Chase Sapphire)"
                                  value={liabilityValues[item.id]?.nombre || ""}
                                  onChange={(e) => updateItemValue(item.id, 'nombre', e.target.value, false)}
                                  className="w-full h-7 text-[10px] bg-white border-gray-200"
                                />
                                <div className="relative flex items-center">
                                  <span className="absolute left-2 text-[10px] font-semibold text-muted-foreground">$</span>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={liabilityValues[item.id]?.valor ? formatCurrency(liabilityValues[item.id].valor) : ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d]/g, '');
                                      updateItemValue(item.id, 'valor', value, false);
                                    }}
                                    className="w-full h-7 text-[10px] text-right font-semibold pl-4 pr-2 bg-white border-gray-200"
                                  />
                                </div>
                              </div>
                              {/* Botón + para agregar otra deuda del mismo tipo */}
                              <div className="flex justify-center mt-1">
                                <Button
                                  onClick={() => {
                                    const newId = `custom_${item.id}_${Date.now()}`;
                                    const newItem = { id: newId, name: `${item.name} adicional` };
                                    const insertIndex = category.items.findIndex(i => i.id === item.id) + 1;
                                    category.items.splice(insertIndex, 0, newItem);
                                    setCustomItems({ ...customItems });
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add subcuenta button - para todas las categorías */}
                        <div className="flex justify-center mt-2">
                          <Button
                            onClick={() => {
                              const newId = `custom_${category.id}_${Date.now()}`;
                              const newItem = { id: newId, name: `Deuda personalizada ${category.items.filter(i => i.id.includes('custom_')).length + 1}` };
                              category.items.push(newItem);
                              setCustomItems({ ...customItems });
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-4"
                          >
                            + Agregar subcuenta
                          </Button>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleSaveCategory(category, false)}
                          disabled={saving}
                          className="w-full mt-2 h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-[15px] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
