import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ArrowLeft, Check, Plus, X, Banknote } from "lucide-react";
import { format } from "date-fns";

// Helper functions for number formatting
const formatNumberWithCommas = (value: string): string => {
  if (!value) return '';
  // Remove all non-digit and non-decimal point characters
  const cleanValue = value.replace(/[^\d.]/g, '');
  // Split into integer and decimal parts
  const parts = cleanValue.split('.');
  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Return formatted value (with max 2 decimals if decimal part exists)
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
};

const parseFormattedNumber = (value: string): string => {
  // Remove commas and return clean number string
  return value.replace(/,/g, '');
};

type AssetEntry = {
  id: string;
  categoryType: string;
  name: string;
  value: string;
  category: string;
};

type LiabilityEntry = {
  id: string;
  categoryType: string;
  name: string;
  value: string;
  category: string;
};

type CustomAssetAccount = {
  id: string;
  name: string;
  value: string;
};

type CustomAsset = {
  id: string;
  name: string;
  accounts: CustomAssetAccount[];
};

type CustomLiabilityAccount = {
  id: string;
  name: string;
  value: string;
};

type CustomLiability = {
  id: string;
  name: string;
  accounts: CustomLiabilityAccount[];
};

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
  { name: 'Otros activos personalizados', category: 'Other', examples: ['Otro Activo 1', 'Activo Diverso', 'Activo Personal'] },
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
  { name: 'Otros pasivos personalizados', category: 'Other', examples: ['Otro Pasivo 1', 'Deuda Diversa', 'Compromiso Personal'] },
];

export default function NetWorthSetupForm({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) {
  const navigate = useNavigate();
  const [assetEntries, setAssetEntries] = useState<AssetEntry[]>([]);
  const [liabilityEntries, setLiabilityEntries] = useState<LiabilityEntry[]>([]);
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [customLiabilities, setCustomLiabilities] = useState<CustomLiability[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const addAssetEntry = (categoryType: string, category: string, examples: string[]) => {
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    const newEntry: AssetEntry = {
      id: Date.now().toString(),
      categoryType,
      name: '',
      value: '',
      category
    };
    setAssetEntries([...assetEntries, { ...newEntry, placeholder: randomExample }] as any);
  };

  const addLiabilityEntry = (categoryType: string, category: string, examples: string[]) => {
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    const newEntry: LiabilityEntry = {
      id: Date.now().toString(),
      categoryType,
      name: '',
      value: '',
      category
    };
    setLiabilityEntries([...liabilityEntries, { ...newEntry, placeholder: randomExample }] as any);
  };

  const removeAssetEntry = (id: string) => {
    setAssetEntries(assetEntries.filter(entry => entry.id !== id));
  };

  const removeLiabilityEntry = (id: string) => {
    setLiabilityEntries(liabilityEntries.filter(entry => entry.id !== id));
  };

  const updateAssetEntry = (id: string, field: 'name' | 'value', value: string) => {
    setAssetEntries(assetEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const updateLiabilityEntry = (id: string, field: 'name' | 'value', value: string) => {
    setLiabilityEntries(liabilityEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Custom Assets functions
  const addCustomAsset = () => {
    const newAsset: CustomAsset = {
      id: Date.now().toString(),
      name: '',
      accounts: []
    };
    setCustomAssets([...customAssets, newAsset]);
  };

  const removeCustomAsset = (id: string) => {
    setCustomAssets(customAssets.filter(asset => asset.id !== id));
  };

  const updateCustomAssetName = (id: string, name: string) => {
    setCustomAssets(customAssets.map(asset => 
      asset.id === id ? { ...asset, name } : asset
    ));
  };

  const addCustomAssetAccount = (assetId: string) => {
    setCustomAssets(customAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          accounts: [...asset.accounts, { id: Date.now().toString(), name: '', value: '' }]
        };
      }
      return asset;
    }));
  };

  const removeCustomAssetAccount = (assetId: string, accountId: string) => {
    setCustomAssets(customAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          accounts: asset.accounts.filter(acc => acc.id !== accountId)
        };
      }
      return asset;
    }));
  };

  const updateCustomAssetAccount = (assetId: string, accountId: string, field: 'name' | 'value', value: string) => {
    setCustomAssets(customAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          accounts: asset.accounts.map(acc => 
            acc.id === accountId ? { ...acc, [field]: value } : acc
          )
        };
      }
      return asset;
    }));
  };

  // Custom Liabilities functions
  const addCustomLiability = () => {
    const newLiability: CustomLiability = {
      id: Date.now().toString(),
      name: '',
      accounts: []
    };
    setCustomLiabilities([...customLiabilities, newLiability]);
  };

  const removeCustomLiability = (id: string) => {
    setCustomLiabilities(customLiabilities.filter(liability => liability.id !== id));
  };

  const updateCustomLiabilityName = (id: string, name: string) => {
    setCustomLiabilities(customLiabilities.map(liability => 
      liability.id === id ? { ...liability, name } : liability
    ));
  };

  const addCustomLiabilityAccount = (liabilityId: string) => {
    setCustomLiabilities(customLiabilities.map(liability => {
      if (liability.id === liabilityId) {
        return {
          ...liability,
          accounts: [...liability.accounts, { id: Date.now().toString(), name: '', value: '' }]
        };
      }
      return liability;
    }));
  };

  const removeCustomLiabilityAccount = (liabilityId: string, accountId: string) => {
    setCustomLiabilities(customLiabilities.map(liability => {
      if (liability.id === liabilityId) {
        return {
          ...liability,
          accounts: liability.accounts.filter(acc => acc.id !== accountId)
        };
      }
      return liability;
    }));
  };

  const updateCustomLiabilityAccount = (liabilityId: string, accountId: string, field: 'name' | 'value', value: string) => {
    setCustomLiabilities(customLiabilities.map(liability => {
      if (liability.id === liabilityId) {
        return {
          ...liability,
          accounts: liability.accounts.map(acc => 
            acc.id === accountId ? { ...acc, [field]: value } : acc
          )
        };
      }
      return liability;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSaveStatus('saving');

    try {
      // Mapeo de categorías a nombres en español
      const categoryMap: Record<string, string> = {
        'Checking': 'Activos líquidos',
        'Savings': 'Activos líquidos',
        'Investments': 'Activos financieros',
        'Property': 'Activos fijos',
        'Other': 'Otros activos',
        'Credit': 'Pasivos corrientes (corto plazo)',
        'Loans': 'Pasivos no corrientes (largo plazo)',
        'Mortgage': 'Pasivos no corrientes (largo plazo)'
      };

      // Preparar activos válidos
      const validAssets = assetEntries
        .filter(entry => entry.name.trim() && parseFloat(entry.value) > 0)
        .map(entry => ({
          user_id: user.id,
          nombre: entry.name.trim(),
          valor: parseFloat(entry.value),
          categoria: categoryMap[entry.category] || 'Otros activos',
          subcategoria: entry.categoryType,
          moneda: 'MXN',
          es_activo_fijo: entry.category === 'Property',
          liquidez_porcentaje: entry.category === 'Checking' || entry.category === 'Savings' ? 100 : 50
        }));

      // Agregar activos personalizados
      customAssets.forEach(customAsset => {
        if (customAsset.name.trim()) {
          customAsset.accounts.forEach(account => {
            if (account.name.trim() && parseFloat(account.value) > 0) {
              validAssets.push({
                user_id: user.id,
                nombre: account.name.trim(),
                valor: parseFloat(account.value),
                categoria: 'Activo personalizado',
                subcategoria: customAsset.name.trim(),
                moneda: 'MXN',
                es_activo_fijo: false,
                liquidez_porcentaje: 50
              });
            }
          });
        }
      });

      // Preparar pasivos válidos
      const validLiabilities = liabilityEntries
        .filter(entry => entry.name.trim() && parseFloat(entry.value) > 0)
        .map(entry => ({
          user_id: user.id,
          nombre: entry.name.trim(),
          valor: parseFloat(entry.value),
          categoria: categoryMap[entry.category] || 'Otros pasivos',
          subcategoria: entry.categoryType,
          moneda: 'MXN',
          es_corto_plazo: entry.category === 'Credit'
        }));

      // Agregar pasivos personalizados
      customLiabilities.forEach(customLiability => {
        if (customLiability.name.trim()) {
          customLiability.accounts.forEach(account => {
            if (account.name.trim() && parseFloat(account.value) > 0) {
              validLiabilities.push({
                user_id: user.id,
                nombre: account.name.trim(),
                valor: parseFloat(account.value),
                categoria: 'Pasivo personalizado',
                subcategoria: customLiability.name.trim(),
                moneda: 'MXN',
                es_corto_plazo: true
              });
            }
          });
        }
      });

      // Insert activos
      if (validAssets.length > 0) {
        const { error: assetsError } = await supabase
          .from('activos')
          .insert(validAssets);

        if (assetsError) {
          console.error('Error inserting activos:', assetsError);
          throw assetsError;
        }
      }

      // Insert pasivos
      if (validLiabilities.length > 0) {
        const { error: liabilitiesError } = await supabase
          .from('pasivos')
          .insert(validLiabilities);

        if (liabilitiesError) {
          console.error('Error inserting pasivos:', liabilitiesError);
          throw liabilitiesError;
        }
      }

      // Create initial snapshot
      const totalAssets = validAssets.reduce((sum, a) => sum + a.valor, 0);
      const totalLiabilities = validLiabilities.reduce((sum, l) => sum + l.valor, 0);
      const netWorth = totalAssets - totalLiabilities;

      const { error: snapshotError } = await supabase
        .from('net_worth_snapshots')
        .insert({
          user_id: user.id,
          snapshot_date: format(new Date(), 'yyyy-MM-dd'),
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth
        });

      if (snapshotError) {
        console.error('Error creating snapshot:', snapshotError);
        throw snapshotError;
      }

      setSaveStatus('saved');
      toast.success('Patrimonio guardado exitosamente');
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error: any) {
      console.error('Error setting up net worth:', error);
      toast.error('Error al guardar patrimonio: ' + error.message);
      setSaveStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onBack ? onBack() : navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Configura tu Patrimonio</h1>
                <p className="text-xs text-gray-500">Completa la información financiera</p>
              </div>
              {saveStatus !== 'idle' && (
                <div className="flex items-center gap-2 text-sm animate-fade-in flex-shrink-0">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline text-gray-900">Guardando...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="hidden sm:inline text-green-600">Guardado</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Activos Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 border border-green-200">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">💰 Activos Esenciales</h3>
                  <p className="text-xs text-gray-600">Lo que posees</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 bg-white">
              {assetCategories.map((asset, index) => {
                const entriesForCategory = assetEntries.filter(e => e.categoryType === asset.name);
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-900 text-sm font-medium">
                        {asset.name}
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addAssetEntry(asset.name, asset.category, asset.examples)}
                        className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-8 px-3 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3 text-gray-700" />
                        <span className="text-gray-900">Agregar</span>
                      </Button>
                    </div>
                    
                    {entriesForCategory.map((entry) => (
                      <div key={entry.id} className="flex gap-1.5 items-start">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder={(entry as any).placeholder || 'Nombre de la cuenta'}
                            value={entry.name}
                            onChange={(e) => updateAssetEntry(entry.id, 'name', e.target.value)}
                            className="bg-white border-gray-200 text-gray-900 text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-xs">$</span>
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={formatNumberWithCommas(entry.value)}
                              onChange={(e) => {
                                const rawValue = parseFormattedNumber(e.target.value);
                                updateAssetEntry(entry.id, 'value', rawValue);
                              }}
                              className="pl-6 bg-white border-gray-200 text-gray-900 focus:border-green-500 transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAssetEntry(entry.id)}
                          className="mt-0.5 h-6 w-6 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:shadow-md transition-all border-0"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activos y Pasivos Personalizados - En fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activos Personalizados Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-gray-900 whitespace-nowrap">Activos Personalizados</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={addCustomAsset}
                  className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-8 px-3 text-xs gap-1"
                >
                  <Plus className="h-4 w-4 text-gray-700" />
                  <span className="hidden sm:inline text-gray-900">Nueva Categoría</span>
                  <span className="sm:hidden text-gray-900">Nuevo</span>
                </Button>
              </div>
            </div>

            <div className="p-5 bg-white/80 backdrop-blur-sm space-y-2">
              {customAssets.length === 0 && (
                <div className="text-center py-4 space-y-1">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mb-1">
                    <Plus className="h-4 w-4 text-gray-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    Crea tus propias categorías de activos
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Agrega categorías como colecciones, inversiones privadas o cualquier otro activo
                  </p>
                </div>
              )}

              {customAssets.map((customAsset) => (
                <div key={customAsset.id} className="space-y-2 p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all shadow-sm">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Label className="text-gray-900 text-xs font-semibold mb-1 block">
                        📁 Categoría de Activo
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ej: Colección de Arte, Negocios, Inversiones Privadas"
                        value={customAsset.name}
                        onChange={(e) => updateCustomAssetName(customAsset.id, e.target.value)}
                        className="bg-white border-gray-200 text-gray-900 font-semibold text-sm h-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomAsset(customAsset.id)}
                      className="mt-5 h-7 w-7 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:shadow-md transition-all border-0"
                    >
                      <X className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>

                  <div className="pl-2 border-l-2 border-gray-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-900 text-[10px] font-semibold uppercase tracking-wide">
                        Cuentas dentro de esta categoría
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addCustomAssetAccount(customAsset.id)}
                        className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-6 px-2 text-[10px] gap-1"
                      >
                        <Plus className="h-2.5 w-2.5 text-gray-700" />
                        <span className="text-gray-900">Agregar Cuenta</span>
                      </Button>
                    </div>

                    {customAsset.accounts.length === 0 && (
                      <div className="text-center py-2 px-2 bg-gray-50 rounded-md border border-dashed border-gray-300">
                        <p className="text-[10px] text-gray-600">
                          Agrega cuentas específicas dentro de esta categoría
                        </p>
                      </div>
                    )}

                    {customAsset.accounts.map((account) => (
                      <div key={account.id} className="flex gap-1.5 items-start p-2 rounded-md bg-white border border-gray-200">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder="Nombre específico (ej: Pintura Picasso, Local Centro)"
                            value={account.name}
                            onChange={(e) => updateCustomAssetAccount(customAsset.id, account.id, 'name', e.target.value)}
                            className="bg-white border-gray-200 text-gray-900 text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-xs">$</span>
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={formatNumberWithCommas(account.value)}
                              onChange={(e) => {
                                const rawValue = parseFormattedNumber(e.target.value);
                                updateCustomAssetAccount(customAsset.id, account.id, 'value', rawValue);
                              }}
                              className="pl-6 bg-white border-gray-200 text-gray-900 focus:border-green-500 transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomAssetAccount(customAsset.id, account.id)}
                          className="mt-0.5 h-6 w-6 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:shadow-md transition-all border-0"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          </div>

          {/* Pasivos Esenciales Card - Debajo del grid */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 border border-red-200">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">💸 Pasivos Esenciales</h3>
                  <p className="text-xs text-gray-600">Lo que debes</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 bg-white">
              {liabilityCategories.map((liability, index) => {
                const entriesForCategory = liabilityEntries.filter(e => e.categoryType === liability.name);
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-900 text-sm font-medium">
                        {liability.name}
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addLiabilityEntry(liability.name, liability.category, liability.examples)}
                        className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-8 px-3 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3 text-gray-700" />
                        <span className="text-gray-900">Agregar</span>
                      </Button>
                    </div>
                    
                    {entriesForCategory.map((entry) => (
                      <div key={entry.id} className="flex gap-1.5 items-start">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder={(entry as any).placeholder || 'Nombre de la deuda'}
                            value={entry.name}
                            onChange={(e) => updateLiabilityEntry(entry.id, 'name', e.target.value)}
                            className="bg-white border-gray-200 text-gray-900 text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-xs">$</span>
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={formatNumberWithCommas(entry.value)}
                              onChange={(e) => {
                                const rawValue = parseFormattedNumber(e.target.value);
                                updateLiabilityEntry(entry.id, 'value', rawValue);
                              }}
                              className="pl-6 bg-white border-gray-200 text-gray-900 focus:border-red-500 transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLiabilityEntry(entry.id)}
                          className="mt-0.5 h-6 w-6 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:shadow-md transition-all border-0"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pasivos Personalizados Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-gray-900 whitespace-nowrap">Pasivos Personalizados</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={addCustomLiability}
                  className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-8 px-3 text-xs gap-1"
                >
                  <Plus className="h-4 w-4 text-gray-700" />
                  <span className="hidden sm:inline text-gray-900">Nueva Categoría</span>
                  <span className="sm:hidden text-gray-900">Nuevo</span>
                </Button>
              </div>
            </div>

            <div className="p-5 bg-white/80 backdrop-blur-sm space-y-2">
              {customLiabilities.length === 0 && (
                <div className="text-center py-4 space-y-1">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mb-1">
                    <Plus className="h-4 w-4 text-gray-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    Crea tus propias categorías de pasivos
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Agrega categorías como compromisos personales, deudas informales o cualquier otro pasivo
                  </p>
                </div>
              )}

              {customLiabilities.map((customLiability) => (
                <div key={customLiability.id} className="space-y-2 p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all shadow-sm">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Label className="text-gray-900 text-xs font-semibold mb-1 block">
                        📁 Categoría de Pasivo
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ej: Deudas Familiares, Compromisos Personales, Otros"
                        value={customLiability.name}
                        onChange={(e) => updateCustomLiabilityName(customLiability.id, e.target.value)}
                        className="bg-white border-gray-200 text-gray-900 font-semibold text-sm h-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomLiability(customLiability.id)}
                      className="mt-5 h-7 w-7 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:shadow-md transition-all border-0"
                    >
                      <X className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>

                  <div className="pl-2 border-l-2 border-gray-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-gray-900 text-[10px] font-semibold uppercase tracking-wide">
                        Cuentas dentro de esta categoría
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addCustomLiabilityAccount(customLiability.id)}
                        className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-6 px-2 text-[10px] gap-1"
                      >
                        <Plus className="h-2.5 w-2.5 text-gray-700" />
                        <span className="text-gray-900">Agregar Cuenta</span>
                      </Button>
                    </div>

                    {customLiability.accounts.length === 0 && (
                      <div className="text-center py-2 px-2 bg-gray-50 rounded-md border border-dashed border-gray-300">
                        <p className="text-[10px] text-gray-600">
                          Agrega cuentas específicas dentro de esta categoría
                        </p>
                      </div>
                    )}

                    {customLiability.accounts.map((account) => (
                      <div key={account.id} className="flex gap-1.5 items-start p-2 rounded-md bg-white border border-gray-200">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder="Nombre específico (ej: Préstamo Mamá, Deuda Tienda)"
                            value={account.name}
                            onChange={(e) => updateCustomLiabilityAccount(customLiability.id, account.id, 'name', e.target.value)}
                            className="bg-white border-gray-200 text-gray-900 text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-xs">$</span>
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={formatNumberWithCommas(account.value)}
                              onChange={(e) => {
                                const rawValue = parseFormattedNumber(e.target.value);
                                updateCustomLiabilityAccount(customLiability.id, account.id, 'value', rawValue);
                              }}
                              className="pl-6 bg-white border-gray-200 text-gray-900 focus:border-red-500 transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomLiabilityAccount(customLiability.id, account.id)}
                          className="mt-0.5 h-6 w-6 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:shadow-md transition-all border-0"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit" 
            className="w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-14 text-base font-semibold text-gray-900"
            disabled={loading}
          >
            {loading ? 'Guardando tu patrimonio...' : 'Enviar patrimonio'}
          </Button>
        </form>
      </div>
    </div>
  );
}
