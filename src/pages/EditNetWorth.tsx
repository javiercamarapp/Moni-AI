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
import { LoadingScreen } from "@/components/LoadingScreen";

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
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="mx-auto px-4 py-6 space-y-6" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 p-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Patrimonio</h1>
          <div className="w-10" />
        </div>

        {/* Main Card */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 animate-fade-in">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl mb-1.5">💰</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1 tracking-tight">
                Gestiona tu patrimonio
              </h2>
              <p className="text-xs text-gray-500">
                Toca una categoría para ver y editar tus cuentas
              </p>
            </div>

            <Tabs defaultValue="activos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/80 p-1 rounded-2xl h-12">
                <TabsTrigger 
                  value="activos"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600 font-medium transition-all"
                >
                  Activos
                </TabsTrigger>
                <TabsTrigger 
                  value="pasivos"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-600 font-medium transition-all"
                >
                  Pasivos
                </TabsTrigger>
              </TabsList>

              {/* ACTIVOS TAB */}
              <TabsContent value="activos" className="space-y-3">
                {ASSET_CATEGORIES.map((category, index) => (
                  <div key={category.id} className="space-y-2">
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.id ? null : category.id
                      )}
                      className="w-full p-4 rounded-2xl transition-all text-left bg-white hover:bg-gray-50 border-0 shadow-sm hover:shadow-md animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{category.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {category.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Object.values(assetValues).filter(v => v.valor > 0).length} cuentas
                            </p>
                          </div>
                        </div>
                        <ArrowRight className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedCategory === category.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </button>

                    {/* Expanded Panel */}
                    {expandedCategory === category.id && (
                      <div className="ml-2 pl-4 border-l-2 border-gray-200 space-y-2 py-3 animate-fade-in">
                        <p className="text-xs text-gray-500 italic mb-3">
                          💡 {category.insight}
                        </p>

                        {/* Items */}
                        <div className="space-y-2">
                          {category.items.map((item) => (
                            <div key={item.id} className="bg-gray-50/50 rounded-xl px-3 py-3 border border-gray-100">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                {item.id.includes('custom_') || category.id.includes('personalizado') ? (
                                  <>
                                    <Input
                                      type="text"
                                      placeholder={item.name}
                                      value={customItems[item.id] || ""}
                                      onChange={(e) => {
                                        setCustomItems({ ...customItems, [item.id]: e.target.value });
                                      }}
                                      className="flex-1 h-8 text-xs bg-white border-gray-200 rounded-lg"
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
                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-700">
                                      • {item.name}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Input
                                  type="text"
                                  placeholder="Nombre de tu cuenta (ej: BBVA, Santander)"
                                  value={assetValues[item.id]?.nombre || ""}
                                  onChange={(e) => updateItemValue(item.id, 'nombre', e.target.value, true)}
                                  className="w-full h-8 text-xs bg-white border-gray-200 rounded-lg"
                                />
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 text-xs font-medium text-gray-500">$</span>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={assetValues[item.id]?.valor ? formatCurrency(assetValues[item.id].valor) : ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d]/g, '');
                                      updateItemValue(item.id, 'valor', value, true);
                                    }}
                                    className="w-full h-8 text-xs text-right font-medium pl-6 pr-3 bg-white border-gray-200 rounded-lg"
                                  />
                                </div>
                              </div>
                              {/* Botón + para agregar otra cuenta del mismo tipo */}
                              <div className="flex justify-center mt-2">
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
                                  className="h-7 w-7 p-0 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add subcuenta button - para todas las categorías */}
                        <div className="flex justify-center mt-3">
                          <Button
                            onClick={() => {
                              const newId = `custom_${category.id}_${Date.now()}`;
                              const newItem = { id: newId, name: `Cuenta personalizada ${category.items.filter(i => i.id.includes('custom_')).length + 1}` };
                              category.items.push(newItem);
                              setCustomItems({ ...customItems });
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-9 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5"
                          >
                            + Agregar subcuenta
                          </Button>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleSaveCategory(category, true)}
                          disabled={saving}
                          className="w-full mt-4 h-11 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* PASIVOS TAB */}
              <TabsContent value="pasivos" className="space-y-3">
                {LIABILITY_CATEGORIES.map((category, index) => (
                  <div key={category.id} className="space-y-2">
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.id ? null : category.id
                      )}
                      className="w-full p-4 rounded-2xl transition-all text-left bg-white hover:bg-gray-50 border-0 shadow-sm hover:shadow-md animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{category.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {category.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Object.values(liabilityValues).filter(v => v.valor > 0).length} deudas
                            </p>
                          </div>
                        </div>
                        <ArrowRight className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedCategory === category.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </button>

                    {/* Expanded Panel */}
                    {expandedCategory === category.id && (
                      <div className="ml-2 pl-4 border-l-2 border-gray-200 space-y-2 py-3 animate-fade-in">
                        <p className="text-xs text-gray-500 italic mb-3">
                          💡 {category.insight}
                        </p>

                        {/* Items */}
                        <div className="space-y-2">
                          {category.items.map((item) => (
                            <div key={item.id} className="bg-gray-50/50 rounded-xl px-3 py-3 border border-gray-100">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                {item.id.includes('custom_') || category.id.includes('personalizado') ? (
                                  <>
                                    <Input
                                      type="text"
                                      placeholder={item.name}
                                      value={customItems[item.id] || ""}
                                      onChange={(e) => {
                                        setCustomItems({ ...customItems, [item.id]: e.target.value });
                                      }}
                                      className="flex-1 h-8 text-xs bg-white border-gray-200 rounded-lg"
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
                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-700">
                                      • {item.name}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Input
                                  type="text"
                                  placeholder="Nombre de tu deuda (ej: BBVA Oro, Chase Sapphire)"
                                  value={liabilityValues[item.id]?.nombre || ""}
                                  onChange={(e) => updateItemValue(item.id, 'nombre', e.target.value, false)}
                                  className="w-full h-8 text-xs bg-white border-gray-200 rounded-lg"
                                />
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 text-xs font-medium text-gray-500">$</span>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={liabilityValues[item.id]?.valor ? formatCurrency(liabilityValues[item.id].valor) : ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d]/g, '');
                                      updateItemValue(item.id, 'valor', value, false);
                                    }}
                                    className="w-full h-8 text-xs text-right font-medium pl-6 pr-3 bg-white border-gray-200 rounded-lg"
                                  />
                                </div>
                              </div>
                              {/* Botón + para agregar otra deuda del mismo tipo */}
                              <div className="flex justify-center mt-2">
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
                                  className="h-7 w-7 p-0 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add subcuenta button - para todas las categorías */}
                        <div className="flex justify-center mt-3">
                          <Button
                            onClick={() => {
                              const newId = `custom_${category.id}_${Date.now()}`;
                              const newItem = { id: newId, name: `Deuda personalizada ${category.items.filter(i => i.id.includes('custom_')).length + 1}` };
                              category.items.push(newItem);
                              setCustomItems({ ...customItems });
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-9 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5"
                          >
                            + Agregar subcuenta
                          </Button>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleSaveCategory(category, false)}
                          disabled={saving}
                          className="w-full mt-4 h-11 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
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
