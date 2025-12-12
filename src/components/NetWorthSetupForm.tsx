import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ArrowLeft, Check, Plus, X, Banknote, ChevronRight, Wallet, Shield, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { headingPage, headingSection } from "@/styles/typography";

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
  placeholder?: string;
};

type LiabilityEntry = {
  id: string;
  categoryType: string;
  name: string;
  value: string;
  category: string;
  placeholder?: string;
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

type StockEntry = {
  id: string;
  name: string;
  quantity: string;
  purchasePrice: string;
  purchaseDate: Date | undefined;
};

const assetCategories = [
  { name: 'Cuentas bancarias (ahorro + cheques)', category: 'Checking', examples: ['BBVA Cuenta Ahorro', 'Santander Nómina', 'Banorte Smart'] },
  { name: 'Propiedad principal', category: 'Property', examples: ['Casa Polanco', 'Depto Reforma', 'Casa Santa Fe'] },
  { name: 'Otras propiedades', category: 'Property', examples: ['Depto en Renta Centro', 'Local Comercial', 'Casa Playa'] },
  { name: 'Vehículos', category: 'Other', examples: ['Toyota Corolla 2020', 'Honda CRV', 'Moto Italika'] },
  { name: 'Fondos de ahorro', category: 'Savings', examples: ['Afore Sura', 'Fondo GBM+', 'CETES'] },
  { name: 'Dinero prestado', category: 'Other', examples: ['Préstamo a Juan', 'Deuda Socio', 'Préstamo Hermano'] },
  { name: 'Relojes o joyas', category: 'Other', examples: ['Rolex Submariner', 'Anillo Oro', 'Collar Diamantes'] },
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
  const [hasStocks, setHasStocks] = useState<boolean | null>(null);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [step, setStep] = useState(1);

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

  // Stock/ETF functions
  const addStockEntry = () => {
    const newEntry: StockEntry = {
      id: Date.now().toString(),
      name: '',
      quantity: '',
      purchasePrice: '',
      purchaseDate: undefined
    };
    setStockEntries([...stockEntries, newEntry]);
  };

  const removeStockEntry = (id: string) => {
    setStockEntries(stockEntries.filter(entry => entry.id !== id));
  };

  const updateStockEntry = (id: string, field: keyof StockEntry, value: any) => {
    setStockEntries(stockEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateStockTotal = () => {
    return stockEntries.reduce((sum, entry) => {
      const qty = parseFloat(parseFormattedNumber(entry.quantity)) || 0;
      const price = parseFloat(parseFormattedNumber(entry.purchasePrice)) || 0;
      return sum + (qty * price);
    }, 0);
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
      const validAssets: Array<{
        user_id: string;
        nombre: string;
        valor: number;
        categoria: string;
        subcategoria: string;
        moneda: string;
        es_activo_fijo: boolean;
        liquidez_porcentaje: number;
        fecha_adquisicion?: string | null;
      }> = assetEntries
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

      // Agregar acciones/ETFs como activos
      stockEntries.forEach(stock => {
        if (stock.name.trim() && parseFloat(stock.quantity) > 0 && parseFloat(stock.purchasePrice) > 0) {
          const totalValue = parseFloat(stock.quantity) * parseFloat(stock.purchasePrice);
          validAssets.push({
            user_id: user.id,
            nombre: stock.name.trim(),
            valor: totalValue,
            categoria: 'Acciones y ETFs',
            subcategoria: `${stock.quantity} acciones @ $${stock.purchasePrice}`,
            moneda: 'MXN',
            es_activo_fijo: false,
            liquidez_porcentaje: 90,
            fecha_adquisicion: stock.purchaseDate ? format(stock.purchaseDate, 'yyyy-MM-dd') : null
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

      // Call edge function to create/update snapshot
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-net-worth-snapshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating snapshot:', errorData);
        throw new Error(errorData.error || 'Failed to update snapshot');
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

  const calculateTotals = () => {
    const assetsTotal = assetEntries
      .filter(e => parseFloat(e.value) > 0)
      .reduce((sum, e) => sum + parseFloat(parseFormattedNumber(e.value)), 0);
    
    const customAssetsTotal = customAssets.reduce((sum, asset) => {
      return sum + asset.accounts.reduce((accSum, acc) => accSum + parseFloat(parseFormattedNumber(acc.value) || '0'), 0);
    }, 0);

    const stocksTotal = calculateStockTotal();

    const liabilitiesTotal = liabilityEntries
      .filter(e => parseFloat(e.value) > 0)
      .reduce((sum, e) => sum + parseFloat(parseFormattedNumber(e.value)), 0);

    const customLiabilitiesTotal = customLiabilities.reduce((sum, liability) => {
      return sum + liability.accounts.reduce((accSum, acc) => accSum + parseFloat(parseFormattedNumber(acc.value) || '0'), 0);
    }, 0);

    return {
      assets: assetsTotal + customAssetsTotal + stocksTotal,
      liabilities: liabilitiesTotal + customLiabilitiesTotal,
      netWorth: (assetsTotal + customAssetsTotal + stocksTotal) - (liabilitiesTotal + customLiabilitiesTotal)
    };
  };

  const totals = calculateTotals();

  const nextStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] pb-32">
      {/* Header & Progress */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === 1 ? (onBack ? onBack() : navigate(-1)) : prevStep()}
              className="h-9 w-9 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Paso {step} de 3</span>
              <h1 className="text-sm font-bold text-[#5D4037]">
                {step === 1 && "Tus Activos"}
                {step === 2 && "Tus Pasivos"}
                {step === 3 && "Resumen Patrimonial"}
              </h1>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>
          <Progress value={(step / 3) * 100} className="h-1.5 bg-gray-100" indicatorClassName="bg-[#8D6E63]" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className={headingPage}>¿Qué posees?</h2>
                <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                  Registra tus cuentas bancarias, inversiones, propiedades y otros bienes de valor.
                </p>
              </div>

              {/* Assets Categories */}
              <div className="space-y-4">
                {assetCategories.map((asset, index) => {
                  const entries = assetEntries.filter(e => e.categoryType === asset.name);
                  const hasEntries = entries.length > 0;
                  
                  return (
                    <div key={index} className={`bg-white rounded-2xl border transition-all ${hasEntries ? 'border-emerald-100 shadow-sm' : 'border-gray-100'}`}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasEntries ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                              {hasEntries ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                            </div>
                            <span className={`font-semibold text-sm ${hasEntries ? 'text-gray-900' : 'text-gray-600'}`}>{asset.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addAssetEntry(asset.name, asset.category, asset.examples)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-bold h-8 px-3 rounded-lg"
                          >
                            <Plus size={12} className="mr-1" />
                            Agregar
                          </Button>
                        </div>

                        {entries.length > 0 && (
                          <div className="space-y-3 pl-11">
                            {entries.map((entry) => (
                              <div key={entry.id} className="flex gap-3 items-center animate-in slide-in-from-top-2 duration-200">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                  <Input
                                    placeholder={entry.placeholder}
                                    value={entry.name}
                                    onChange={(e) => updateAssetEntry(entry.id, 'name', e.target.value)}
                                    className="h-9 text-xs bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                  />
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                    <Input
                                      placeholder="0.00"
                                      value={formatNumberWithCommas(entry.value)}
                                      onChange={(e) => updateAssetEntry(entry.id, 'value', parseFormattedNumber(e.target.value))}
                                      className="h-9 text-xs pl-6 bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium text-gray-900"
                                    />
                                  </div>
                                </div>
                                <button onClick={() => removeAssetEntry(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stocks/ETFs Question */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasStocks ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      {hasStocks ? <Check size={14} strokeWidth={3} /> : <TrendingUp size={14} />}
                    </div>
                    <span className="font-semibold text-sm text-gray-700">¿Tienes acciones o ETFs?</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={hasStocks === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setHasStocks(true);
                        if (stockEntries.length === 0) addStockEntry();
                      }}
                      className={cn(
                        "text-xs h-8 px-4 rounded-lg",
                        hasStocks === true ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-200"
                      )}
                    >
                      Sí
                    </Button>
                    <Button
                      variant={hasStocks === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setHasStocks(false);
                        setStockEntries([]);
                      }}
                      className={cn(
                        "text-xs h-8 px-4 rounded-lg",
                        hasStocks === false ? "bg-gray-600 hover:bg-gray-700" : "border-gray-200"
                      )}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {hasStocks && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                    {stockEntries.map((entry) => (
                      <div key={entry.id} className="bg-gray-50/50 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Acción / ETF</span>
                          <button onClick={() => removeStockEntry(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Ej: Apple, VOO, SPY"
                            value={entry.name}
                            onChange={(e) => updateStockEntry(entry.id, 'name', e.target.value)}
                            className="h-9 text-xs bg-white border-gray-200"
                          />
                          <Input
                            placeholder="Cantidad"
                            value={formatNumberWithCommas(entry.quantity)}
                            onChange={(e) => updateStockEntry(entry.id, 'quantity', parseFormattedNumber(e.target.value))}
                            className="h-9 text-xs bg-white border-gray-200"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                            <Input
                              placeholder="Precio de compra"
                              value={formatNumberWithCommas(entry.purchasePrice)}
                              onChange={(e) => updateStockEntry(entry.id, 'purchasePrice', parseFormattedNumber(e.target.value))}
                              className="h-9 text-xs pl-6 bg-white border-gray-200"
                            />
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-9 text-xs justify-start text-left font-normal bg-white border-gray-200",
                                  !entry.purchaseDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {entry.purchaseDate ? format(entry.purchaseDate, "dd/MM/yyyy") : <span>Fecha compra</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={entry.purchaseDate}
                                onSelect={(date) => updateStockEntry(entry.id, 'purchaseDate', date)}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        {entry.quantity && entry.purchasePrice && (
                          <div className="text-right">
                            <span className="text-xs text-gray-500">Valor total: </span>
                            <span className="text-xs font-bold text-emerald-600">
                              ${formatNumberWithCommas(String((parseFloat(parseFormattedNumber(entry.quantity)) || 0) * (parseFloat(parseFormattedNumber(entry.purchasePrice)) || 0)))}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addStockEntry}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-bold h-8 px-3 rounded-lg w-full"
                    >
                      <Plus size={12} className="mr-1" />
                      Agregar otra acción
                    </Button>
                  </div>
                )}
              </div>

              {/* Custom Assets */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Otros Activos</h3>
                  <Button onClick={addCustomAsset} variant="outline" size="sm" className="text-xs h-8 rounded-lg border-gray-200">
                    Nueva Categoría
                  </Button>
                </div>
                {customAssets.map(customAsset => (
                  <div key={customAsset.id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 shadow-sm">
                    <div className="flex gap-3 mb-3">
                      <Input 
                        placeholder="Nombre de la categoría (ej. Arte)" 
                        value={customAsset.name}
                        onChange={(e) => updateCustomAssetName(customAsset.id, e.target.value)}
                        className="h-9 font-semibold text-sm border-gray-200"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeCustomAsset(customAsset.id)} className="h-9 w-9 text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                      {customAsset.accounts.map(acc => (
                        <div key={acc.id} className="flex gap-2">
                          <Input 
                            placeholder="Nombre del item" 
                            value={acc.name}
                            onChange={(e) => updateCustomAssetAccount(customAsset.id, acc.id, 'name', e.target.value)}
                            className="h-8 text-xs bg-gray-50"
                          />
                          <Input 
                            placeholder="0.00" 
                            value={formatNumberWithCommas(acc.value)}
                            onChange={(e) => updateCustomAssetAccount(customAsset.id, acc.id, 'value', parseFormattedNumber(e.target.value))}
                            className="h-8 text-xs w-32 bg-gray-50"
                          />
                          <button onClick={() => removeCustomAssetAccount(customAsset.id, acc.id)} className="text-gray-300 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addCustomAssetAccount(customAsset.id)} className="text-xs text-gray-500 h-7 px-2">
                        + Agregar item
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
                <h2 className={headingPage}>¿Qué debes?</h2>
                <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                  Registra tus deudas de tarjetas, préstamos, créditos e hipotecas.
                </p>
              </div>

              <div className="space-y-4">
                {liabilityCategories.map((liability, index) => {
                  const entries = liabilityEntries.filter(e => e.categoryType === liability.name);
                  const hasEntries = entries.length > 0;
                  
                  return (
                    <div key={index} className={`bg-white rounded-2xl border transition-all ${hasEntries ? 'border-red-100 shadow-sm' : 'border-gray-100'}`}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasEntries ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                              {hasEntries ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                            </div>
                            <span className={`font-semibold text-sm ${hasEntries ? 'text-gray-900' : 'text-gray-600'}`}>{liability.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addLiabilityEntry(liability.name, liability.category, liability.examples)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-8 px-3 rounded-lg"
                          >
                            <Plus size={12} className="mr-1" />
                            Agregar
                          </Button>
                        </div>

                        {entries.length > 0 && (
                          <div className="space-y-3 pl-11">
                            {entries.map((entry) => (
                              <div key={entry.id} className="flex gap-3 items-center animate-in slide-in-from-top-2 duration-200">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                  <Input
                                    placeholder={entry.placeholder}
                                    value={entry.name}
                                    onChange={(e) => updateLiabilityEntry(entry.id, 'name', e.target.value)}
                                    className="h-9 text-xs bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                  />
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                    <Input
                                      placeholder="0.00"
                                      value={formatNumberWithCommas(entry.value)}
                                      onChange={(e) => updateLiabilityEntry(entry.id, 'value', parseFormattedNumber(e.target.value))}
                                      className="h-9 text-xs pl-6 bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium text-gray-900"
                                    />
                                  </div>
                                </div>
                                <button onClick={() => removeLiabilityEntry(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Liabilities */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Otras Deudas</h3>
                  <Button onClick={addCustomLiability} variant="outline" size="sm" className="text-xs h-8 rounded-lg border-gray-200">
                    Nueva Categoría
                  </Button>
                </div>
                {customLiabilities.map(customLiability => (
                  <div key={customLiability.id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 shadow-sm">
                    <div className="flex gap-3 mb-3">
                      <Input 
                        placeholder="Nombre de la categoría" 
                        value={customLiability.name}
                        onChange={(e) => updateCustomLiabilityName(customLiability.id, e.target.value)}
                        className="h-9 font-semibold text-sm border-gray-200"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeCustomLiability(customLiability.id)} className="h-9 w-9 text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                      {customLiability.accounts.map(acc => (
                        <div key={acc.id} className="flex gap-2">
                          <Input 
                            placeholder="Nombre del item" 
                            value={acc.name}
                            onChange={(e) => updateCustomLiabilityAccount(customLiability.id, acc.id, 'name', e.target.value)}
                            className="h-8 text-xs bg-gray-50"
                          />
                          <Input 
                            placeholder="0.00" 
                            value={formatNumberWithCommas(acc.value)}
                            onChange={(e) => updateCustomLiabilityAccount(customLiability.id, acc.id, 'value', parseFormattedNumber(e.target.value))}
                            className="h-8 text-xs w-32 bg-gray-50"
                          />
                          <button onClick={() => removeCustomLiabilityAccount(customLiability.id, acc.id)} className="text-gray-300 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addCustomLiabilityAccount(customLiability.id)} className="text-xs text-gray-500 h-7 px-2">
                        + Agregar item
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className={headingPage}>Tu Patrimonio Neto</h2>
                <p className="text-gray-500 text-sm mt-2">
                  Así se ven tus finanzas hoy. ¡Buen trabajo completando la información!
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-indigo-50 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-indigo-500 to-emerald-400"></div>
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">PATRIMONIO NETO TOTAL</span>
                <div className="text-4xl font-black text-[#5D4037] mt-2 tracking-tight">
                  ${totals.netWorth.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-emerald-50 rounded-2xl p-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingUp size={14} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">ACTIVOS</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-900">
                      ${totals.assets.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingDown size={14} className="text-red-600" />
                      <span className="text-xs font-bold text-red-700">PASIVOS</span>
                    </div>
                    <span className="text-lg font-bold text-red-900">
                      ${totals.liabilities.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5F0EE] rounded-xl p-4 text-center">
                <p className="text-sm text-[#5D4037] font-medium">
                  "Conocer tu patrimonio es el primer paso para hacerlo crecer."
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 font-bold"
            >
              Atrás
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-12 rounded-xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Continuar
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? "Guardando..." : "Finalizar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
