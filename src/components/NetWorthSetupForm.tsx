import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ArrowLeft, Check, Plus, X, Banknote, ChevronRight, Wallet, Shield, CalendarIcon, Building2, Home, Car, PiggyBank, HandCoins, Watch, LucideIcon } from "lucide-react";
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

const assetCategories: { name: string; category: string; examples: string[]; icon: LucideIcon }[] = [
  { name: 'Cuentas bancarias (ahorro + cheques)', category: 'Checking', examples: ['BBVA Cuenta Ahorro', 'Santander Nómina', 'Banorte Smart'], icon: Banknote },
  { name: 'Propiedad principal', category: 'Property', examples: ['Casa Polanco', 'Depto Reforma', 'Casa Santa Fe'], icon: Home },
  { name: 'Otras propiedades', category: 'Property', examples: ['Depto en Renta Centro', 'Local Comercial', 'Casa Playa'], icon: Building2 },
  { name: 'Vehículos', category: 'Other', examples: ['Toyota Corolla 2020', 'Honda CRV', 'Moto Italika'], icon: Car },
  { name: 'Fondos de ahorro', category: 'Savings', examples: ['Afore Sura', 'Fondo GBM+', 'CETES'], icon: PiggyBank },
  { name: 'Préstamos otorgados', category: 'Other', examples: ['Préstamo a Juan', 'Deuda Socio', 'Préstamo Hermano'], icon: HandCoins },
  { name: 'Relojes o joyas', category: 'Other', examples: ['Rolex Submariner', 'Anillo Oro', 'Collar Diamantes'], icon: Watch },
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
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F5] to-[#F5F0EE] pb-32">
      {/* Header - Brown gradient like dashboard */}
      <div className="bg-gradient-to-b from-[#5D4037] via-[#5D4037] to-[#5D4037]/95 pb-8 rounded-b-[2rem]">
        <div className="sticky top-0 z-40 pt-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => step === 1 ? (onBack ? onBack() : navigate(-1)) : prevStep()}
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-white/70 tracking-wide">Paso {step} de 3</span>
                <h1 className="text-lg font-bold text-white">
                  {step === 1 && "Tus Activos"}
                  {step === 2 && "Tus Pasivos"}
                  {step === 3 && "Resumen Patrimonial"}
                </h1>
              </div>
              <div className="w-10" />
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Icon and description inside header */}
            <div className="text-center pb-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
                {step === 1 && <TrendingUp className="w-7 h-7 text-white" />}
                {step === 2 && <TrendingDown className="w-7 h-7 text-white" />}
                {step === 3 && <Shield className="w-7 h-7 text-white" />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {step === 1 && "¿Qué posees?"}
                {step === 2 && "¿Qué debes?"}
                {step === 3 && "Tu Patrimonio Neto"}
              </h2>
              <p className="text-white/70 text-sm mt-1 max-w-sm mx-auto">
                {step === 1 && "Registra tus cuentas, propiedades y bienes."}
                {step === 2 && "Registra tus deudas y créditos."}
                {step === 3 && "Así se ven tus finanzas hoy."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content area with cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Assets Categories */}
              {assetCategories.map((asset, index) => {
                const entries = assetEntries.filter(e => e.categoryType === asset.name);
                const hasEntries = entries.length > 0;
                const isBankAccount = asset.name === 'Cuentas bancarias (ahorro + cheques)';
                
                return (
                  <div key={index}>
                    <Card className={`bg-white rounded-3xl shadow-lg transition-all border-0 ${hasEntries ? 'ring-2 ring-[#A1887F]/30' : ''}`}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${hasEntries ? 'bg-[#5D4037]/10 text-[#5D4037]' : 'bg-[#A1887F]/10 text-[#A1887F]'}`}>
                              {hasEntries ? <Check size={18} strokeWidth={3} /> : <asset.icon size={18} />}
                            </div>
                            <span className={`font-semibold text-sm ${hasEntries ? 'text-gray-900' : 'text-gray-600'}`}>{asset.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addAssetEntry(asset.name, asset.category, asset.examples)}
                            className="text-[#5D4037] hover:text-[#4E342E] hover:bg-[#A1887F]/20 text-xs font-bold h-9 px-4 rounded-xl"
                          >
                            <Plus size={14} className="mr-1" />
                            Agregar
                          </Button>
                        </div>

                        {entries.length > 0 && (
                          <div className="space-y-3 ml-13 pl-10 border-l-2 border-[#5D4037]/10">
                            {entries.map((entry) => (
                              <div key={entry.id} className="flex gap-3 items-center">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder={entry.placeholder}
                                    value={entry.name}
                                    onChange={(e) => updateAssetEntry(entry.id, 'name', e.target.value)}
                                    className="h-11 text-sm bg-[#F5F0EE] border-0 focus:ring-2 focus:ring-[#5D4037]/20 rounded-xl text-gray-900"
                                  />
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D4037] text-sm font-bold">$</span>
                                    <Input
                                      placeholder="0.00"
                                      value={formatNumberWithCommas(entry.value)}
                                      onChange={(e) => updateAssetEntry(entry.id, 'value', parseFormattedNumber(e.target.value))}
                                      className="h-11 text-sm pl-7 bg-[#F5F0EE] border-0 focus:ring-2 focus:ring-[#5D4037]/20 rounded-xl font-semibold text-[#5D4037]"
                                    />
                                  </div>
                                </div>
                                <button onClick={() => removeAssetEntry(entry.id)} className="text-[#A1887F] hover:text-red-500 transition-colors p-2">
                                  <X size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Stocks/ETFs Question - Right after Cuentas bancarias */}
                    {isBankAccount && (
                      <Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden mt-4">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${hasStocks ? 'bg-[#5D4037]/10 text-[#5D4037]' : 'bg-[#A1887F]/10 text-[#A1887F]'}`}>
                                {hasStocks ? <Check size={18} strokeWidth={3} /> : <TrendingUp size={18} />}
                              </div>
                              <span className="font-semibold text-sm text-gray-900">¿Tienes acciones o ETFs?</span>
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
                                  "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                                  hasStocks === true ? "bg-[#5D4037] hover:bg-[#4E342E] text-white shadow-md" : "border-[#A1887F]/30 text-[#5D4037] hover:bg-[#A1887F]/20 hover:border-[#5D4037]/50"
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
                                  "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                                  hasStocks === false ? "bg-[#8D6E63] hover:bg-[#6D4C41] text-white shadow-md" : "border-[#A1887F]/30 text-[#8D6E63] hover:bg-[#A1887F]/20 hover:border-[#8D6E63]/50"
                                )}
                              >
                                No
                              </Button>
                            </div>
                          </div>

                          {hasStocks && (
                            <div className="space-y-3 mt-4 pt-4 border-t border-[#A1887F]/20">
                              {stockEntries.map((entry) => (
                                <div key={entry.id} className="bg-[#F5F0EE] rounded-2xl p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#5D4037] uppercase tracking-wide">Acción / ETF</span>
                                    <button onClick={() => removeStockEntry(entry.id)} className="text-[#A1887F] hover:text-red-500 transition-colors p-1">
                                      <X size={16} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Ej: Apple, VOO, SPY"
                                      value={entry.name}
                                      onChange={(e) => updateStockEntry(entry.id, 'name', e.target.value)}
                                      className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-[#5D4037]/20"
                                    />
                                    <Input
                                      placeholder="Cantidad"
                                      value={formatNumberWithCommas(entry.quantity)}
                                      onChange={(e) => updateStockEntry(entry.id, 'quantity', parseFormattedNumber(e.target.value))}
                                      className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-[#5D4037]/20"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D4037] text-sm font-bold">$</span>
                                      <Input
                                        placeholder="Precio"
                                        value={formatNumberWithCommas(entry.purchasePrice)}
                                        onChange={(e) => updateStockEntry(entry.id, 'purchasePrice', parseFormattedNumber(e.target.value))}
                                        className="h-11 text-sm pl-7 bg-white border-0 rounded-xl focus:ring-2 focus:ring-[#5D4037]/20"
                                      />
                                    </div>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "h-11 text-sm justify-start text-left font-normal bg-white border-0 rounded-xl hover:bg-[#A1887F]/10",
                                            !entry.purchaseDate && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4 text-[#5D4037]" />
                                          {entry.purchaseDate ? format(entry.purchaseDate, "dd/MM/yyyy") : <span>Fecha</span>}
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
                                    <div className="text-right bg-[#5D4037]/5 rounded-xl p-3">
                                      <span className="text-xs text-[#8D6E63]">Valor total: </span>
                                      <span className="text-sm font-bold text-[#5D4037]">
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
                                className="text-[#5D4037] hover:text-[#4E342E] hover:bg-[#A1887F]/20 text-xs font-bold h-10 px-4 rounded-xl w-full"
                              >
                                <Plus size={14} className="mr-2" />
                                Agregar otra acción
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                );
              })}

              {/* Custom Assets */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-bold text-gray-700">Otros Activos</h3>
                  <Button onClick={addCustomAsset} variant="outline" size="sm" className="text-xs h-9 rounded-xl border-[#5D4037]/20 text-[#5D4037] hover:bg-[#5D4037]/10">
                    <Plus size={12} className="mr-1" />
                    Nueva Categoría
                  </Button>
                </div>
                {customAssets.map(customAsset => (
                  <Card key={customAsset.id} className="bg-white p-4 rounded-3xl shadow-lg border-0 mb-3">
                    <div className="flex gap-3 mb-3">
                      <Input 
                        placeholder="Nombre de la categoría (ej. Arte)" 
                        value={customAsset.name}
                        onChange={(e) => updateCustomAssetName(customAsset.id, e.target.value)}
                        className="h-11 font-semibold text-sm bg-gray-50 border-0 rounded-xl"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeCustomAsset(customAsset.id)} className="h-11 w-11 text-gray-400 hover:text-red-500 rounded-xl">
                        <X size={18} />
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-[#5D4037]/10">
                      {customAsset.accounts.map(acc => (
                        <div key={acc.id} className="flex gap-2">
                          <Input 
                            placeholder="Nombre del item" 
                            value={acc.name}
                            onChange={(e) => updateCustomAssetAccount(customAsset.id, acc.id, 'name', e.target.value)}
                            className="h-10 text-sm bg-gray-50 border-0 rounded-xl"
                          />
                          <Input 
                            placeholder="0.00" 
                            value={formatNumberWithCommas(acc.value)}
                            onChange={(e) => updateCustomAssetAccount(customAsset.id, acc.id, 'value', parseFormattedNumber(e.target.value))}
                            className="h-10 text-sm w-32 bg-gray-50 border-0 rounded-xl"
                          />
                          <button onClick={() => removeCustomAssetAccount(customAsset.id, acc.id)} className="text-gray-300 hover:text-red-500 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addCustomAssetAccount(customAsset.id)} className="text-xs text-[#5D4037] h-8 px-2 hover:bg-[#5D4037]/10 rounded-lg">
                        + Agregar item
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {liabilityCategories.map((liability, index) => {
                const entries = liabilityEntries.filter(e => e.categoryType === liability.name);
                const hasEntries = entries.length > 0;
                
                return (
                  <Card key={index} className={`bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all border-0 ${hasEntries ? 'ring-2 ring-red-200/50' : ''}`}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${hasEntries ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            {hasEntries ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
                          </div>
                          <span className={`font-semibold text-sm ${hasEntries ? 'text-gray-900' : 'text-gray-600'}`}>{liability.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addLiabilityEntry(liability.name, liability.category, liability.examples)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-9 px-4 rounded-xl"
                        >
                          <Plus size={14} className="mr-1" />
                          Agregar
                        </Button>
                      </div>

                      {entries.length > 0 && (
                        <div className="space-y-3 ml-13 pl-10 border-l-2 border-red-100">
                          {entries.map((entry) => (
                            <div key={entry.id} className="flex gap-3 items-center animate-in slide-in-from-top-2 duration-200">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <Input
                                  placeholder={entry.placeholder}
                                  value={entry.name}
                                  onChange={(e) => updateLiabilityEntry(entry.id, 'name', e.target.value)}
                                  className="h-11 text-sm bg-gray-50 border-0 focus:ring-2 focus:ring-red-200 rounded-xl text-gray-900"
                                />
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold">$</span>
                                  <Input
                                    placeholder="0.00"
                                    value={formatNumberWithCommas(entry.value)}
                                    onChange={(e) => updateLiabilityEntry(entry.id, 'value', parseFormattedNumber(e.target.value))}
                                    className="h-11 text-sm pl-7 bg-gray-50 border-0 focus:ring-2 focus:ring-red-200 rounded-xl font-semibold text-red-600"
                                  />
                                </div>
                              </div>
                              <button onClick={() => removeLiabilityEntry(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* Custom Liabilities */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-bold text-gray-700">Otras Deudas</h3>
                  <Button onClick={addCustomLiability} variant="outline" size="sm" className="text-xs h-9 rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                    <Plus size={12} className="mr-1" />
                    Nueva Categoría
                  </Button>
                </div>
                {customLiabilities.map(customLiability => (
                  <Card key={customLiability.id} className="bg-white p-4 rounded-3xl shadow-lg border-0 mb-3">
                    <div className="flex gap-3 mb-3">
                      <Input 
                        placeholder="Nombre de la categoría" 
                        value={customLiability.name}
                        onChange={(e) => updateCustomLiabilityName(customLiability.id, e.target.value)}
                        className="h-11 font-semibold text-sm bg-gray-50 border-0 rounded-xl"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeCustomLiability(customLiability.id)} className="h-11 w-11 text-gray-400 hover:text-red-500 rounded-xl">
                        <X size={18} />
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-red-100">
                      {customLiability.accounts.map(acc => (
                        <div key={acc.id} className="flex gap-2">
                          <Input 
                            placeholder="Nombre del item" 
                            value={acc.name}
                            onChange={(e) => updateCustomLiabilityAccount(customLiability.id, acc.id, 'name', e.target.value)}
                            className="h-10 text-sm bg-gray-50 border-0 rounded-xl"
                          />
                          <Input 
                            placeholder="0.00" 
                            value={formatNumberWithCommas(acc.value)}
                            onChange={(e) => updateCustomLiabilityAccount(customLiability.id, acc.id, 'value', parseFormattedNumber(e.target.value))}
                            className="h-10 text-sm w-32 bg-gray-50 border-0 rounded-xl"
                          />
                          <button onClick={() => removeCustomLiabilityAccount(customLiability.id, acc.id)} className="text-gray-300 hover:text-red-500 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addCustomLiabilityAccount(customLiability.id)} className="text-xs text-red-600 h-8 px-2 hover:bg-red-50 rounded-lg">
                        + Agregar item
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Main Summary Card */}
              <Card className="bg-white rounded-3xl p-6 shadow-xl border-0 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A1887F] via-[#5D4037] to-[#A1887F]"></div>
                <span className="text-xs font-bold text-[#8D6E63] tracking-widest uppercase">PATRIMONIO NETO</span>
                <div className="text-4xl font-black text-gray-900 mt-3 tracking-tight">
                  ${totals.netWorth.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-[#5D4037]/5 rounded-2xl p-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-[#5D4037]" />
                      <span className="text-xs font-bold text-[#5D4037]">ACTIVOS</span>
                    </div>
                    <span className="text-xl font-bold text-[#5D4037]">
                      ${totals.assets.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingDown size={16} className="text-red-600" />
                      <span className="text-xs font-bold text-red-600">PASIVOS</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">
                      ${totals.liabilities.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border-0 shadow-lg">
                <p className="text-sm text-gray-600 font-medium italic">
                  "Conocer tu patrimonio es el primer paso para hacerlo crecer."
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-12 rounded-2xl border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
            >
              Atrás
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-12 rounded-2xl bg-[#5D4037] text-white hover:bg-[#4E342E] font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Continuar
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 h-12 rounded-2xl bg-[#5D4037] text-white hover:bg-[#4E342E] font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? "Guardando..." : "Finalizar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
