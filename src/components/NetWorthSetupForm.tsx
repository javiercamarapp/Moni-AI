import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ArrowLeft, Check, Plus, X, Banknote, ChevronRight, Wallet, Shield, Building2, Home, Car, PiggyBank, HandCoins, Watch, LucideIcon, Bitcoin, CreditCard, GraduationCap, Users, Briefcase, Upload } from "lucide-react";
import { ResponsiveCalendarPicker } from "@/components/ui/responsive-calendar-picker";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { headingPage, headingSection } from "@/styles/typography";

// Helper functions for number formatting
const formatNumberWithCommas = (value: string): string => {
  if (!value) return '';
  const cleanValue = value.replace(/[^\d.]/g, '');
  const parts = cleanValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
};

const parseFormattedNumber = (value: string): string => {
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

type StockEntry = {
  id: string;
  name: string;
  quantity: string;
  purchasePrice: string;
  purchaseDate: Date | undefined;
};

type CryptoEntry = {
  id: string;
  name: string;
  quantity: string;
  purchasePrice: string;
  purchaseDate: Date | undefined;
};

// Credit Card Types
type CreditCardEntry = {
  id: string;
  bankName: string;
  cardName: string;
  cutoffDate: string;
  amountOwed: string;
  statementFile?: File;
  statementFileName?: string;
};

// Loan Types
type LoanType = 'personal' | 'automotriz' | 'hipotecario' | 'educativo' | 'familiar';

type LoanEntry = {
  id: string;
  loanType: LoanType;
  originalAmount: string;
  currentBalance: string;
  interestRate: string;
  termMonths: string;
  monthlyPayment: string;
  dueDate: Date | undefined;
};

const loanTypeLabels: Record<LoanType, { label: string; icon: LucideIcon }> = {
  personal: { label: 'Personal', icon: Users },
  automotriz: { label: 'Automotriz', icon: Car },
  hipotecario: { label: 'Hipotecario', icon: Home },
  educativo: { label: 'Educativo', icon: GraduationCap },
  familiar: { label: 'Familiar', icon: Users },
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

export default function NetWorthSetupForm({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) {
  const navigate = useNavigate();
  const [assetEntries, setAssetEntries] = useState<AssetEntry[]>([]);
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [hasStocks, setHasStocks] = useState<boolean | null>(null);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [hasCrypto, setHasCrypto] = useState<boolean | null>(null);
  const [cryptoEntries, setCryptoEntries] = useState<CryptoEntry[]>([]);
  
  // New liability states
  const [hasCreditCards, setHasCreditCards] = useState<boolean | null>(null);
  const [creditCardEntries, setCreditCardEntries] = useState<CreditCardEntry[]>([]);
  const [hasLoans, setHasLoans] = useState<boolean | null>(null);
  const [loanEntries, setLoanEntries] = useState<LoanEntry[]>([]);
  
  // Calendar popover states
  const [openCalendars, setOpenCalendars] = useState<Record<string, boolean>>({});
  
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

  const removeAssetEntry = (id: string) => {
    setAssetEntries(assetEntries.filter(entry => entry.id !== id));
  };

  const updateAssetEntry = (id: string, field: 'name' | 'value', value: string) => {
    setAssetEntries(assetEntries.map(entry => 
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

  // Crypto functions
  const addCryptoEntry = () => {
    const newEntry: CryptoEntry = {
      id: Date.now().toString(),
      name: '',
      quantity: '',
      purchasePrice: '',
      purchaseDate: undefined
    };
    setCryptoEntries([...cryptoEntries, newEntry]);
  };

  const removeCryptoEntry = (id: string) => {
    setCryptoEntries(cryptoEntries.filter(entry => entry.id !== id));
  };

  const updateCryptoEntry = (id: string, field: keyof CryptoEntry, value: any) => {
    setCryptoEntries(cryptoEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateCryptoTotal = () => {
    return cryptoEntries.reduce((sum, entry) => {
      const qty = parseFloat(parseFormattedNumber(entry.quantity)) || 0;
      const price = parseFloat(parseFormattedNumber(entry.purchasePrice)) || 0;
      return sum + (qty * price);
    }, 0);
  };

  // Credit Card functions
  const addCreditCardEntry = () => {
    const newEntry: CreditCardEntry = {
      id: Date.now().toString(),
      bankName: '',
      cardName: '',
      cutoffDate: '',
      amountOwed: ''
    };
    setCreditCardEntries([...creditCardEntries, newEntry]);
  };

  const removeCreditCardEntry = (id: string) => {
    setCreditCardEntries(creditCardEntries.filter(entry => entry.id !== id));
  };

  const updateCreditCardEntry = (id: string, field: keyof CreditCardEntry, value: string | File) => {
    setCreditCardEntries(creditCardEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleStatementUpload = (id: string, file: File) => {
    setCreditCardEntries(creditCardEntries.map(entry => 
      entry.id === id ? { ...entry, statementFile: file, statementFileName: file.name } : entry
    ));
    toast.success(`Archivo "${file.name}" adjuntado`);
  };

  const calculateCreditCardsTotal = () => {
    return creditCardEntries.reduce((sum, entry) => {
      return sum + (parseFloat(parseFormattedNumber(entry.amountOwed)) || 0);
    }, 0);
  };

  // Loan functions
  const addLoanEntry = (loanType: LoanType) => {
    const newEntry: LoanEntry = {
      id: Date.now().toString(),
      loanType,
      originalAmount: '',
      currentBalance: '',
      interestRate: '',
      termMonths: '',
      monthlyPayment: '',
      dueDate: undefined
    };
    setLoanEntries([...loanEntries, newEntry]);
  };

  const removeLoanEntry = (id: string) => {
    setLoanEntries(loanEntries.filter(entry => entry.id !== id));
  };

  const updateLoanEntry = (id: string, field: keyof LoanEntry, value: any) => {
    setLoanEntries(loanEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateLoansTotal = () => {
    return loanEntries.reduce((sum, entry) => {
      return sum + (parseFloat(parseFormattedNumber(entry.currentBalance)) || 0);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSaveStatus('saving');

    try {
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

      // Agregar criptomonedas como activos
      cryptoEntries.forEach(crypto => {
        if (crypto.name.trim() && parseFloat(crypto.quantity) > 0 && parseFloat(crypto.purchasePrice) > 0) {
          const totalValue = parseFloat(crypto.quantity) * parseFloat(crypto.purchasePrice);
          validAssets.push({
            user_id: user.id,
            nombre: crypto.name.trim(),
            valor: totalValue,
            categoria: 'Criptomonedas',
            subcategoria: `${crypto.quantity} unidades @ $${crypto.purchasePrice}`,
            moneda: 'MXN',
            es_activo_fijo: false,
            liquidez_porcentaje: 85,
            fecha_adquisicion: crypto.purchaseDate ? format(crypto.purchaseDate, 'yyyy-MM-dd') : null
          });
        }
      });

      // Preparar pasivos de tarjetas de crédito
      const validLiabilities: Array<{
        user_id: string;
        nombre: string;
        valor: number;
        categoria: string;
        subcategoria: string;
        moneda: string;
        es_corto_plazo: boolean;
        tasa_interes?: number;
        fecha_vencimiento?: string;
      }> = [];

      creditCardEntries.forEach(card => {
        if (card.cardName.trim() && parseFloat(parseFormattedNumber(card.amountOwed)) > 0) {
          validLiabilities.push({
            user_id: user.id,
            nombre: `${card.bankName} - ${card.cardName}`,
            valor: parseFloat(parseFormattedNumber(card.amountOwed)),
            categoria: 'Pasivos corrientes (corto plazo)',
            subcategoria: `Tarjeta de crédito - Corte: ${card.cutoffDate}`,
            moneda: 'MXN',
            es_corto_plazo: true
          });
        }
      });

      // Preparar pasivos de préstamos
      loanEntries.forEach(loan => {
        if (parseFloat(parseFormattedNumber(loan.currentBalance)) > 0) {
          const loanTypeLabel = loanTypeLabels[loan.loanType].label;
          const isShortTerm = loan.loanType === 'personal' || loan.loanType === 'familiar';
          
          validLiabilities.push({
            user_id: user.id,
            nombre: `Préstamo ${loanTypeLabel}`,
            valor: parseFloat(parseFormattedNumber(loan.currentBalance)),
            categoria: isShortTerm ? 'Pasivos corrientes (corto plazo)' : 'Pasivos no corrientes (largo plazo)',
            subcategoria: `Original: $${loan.originalAmount} | Plazo: ${loan.termMonths} meses | Mensualidad: $${loan.monthlyPayment}`,
            moneda: 'MXN',
            es_corto_plazo: isShortTerm,
            tasa_interes: parseFloat(loan.interestRate) || undefined,
            fecha_vencimiento: loan.dueDate ? format(loan.dueDate, 'yyyy-MM-dd') : undefined
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
    const cryptoTotal = calculateCryptoTotal();

    const creditCardsTotal = calculateCreditCardsTotal();
    const loansTotal = calculateLoansTotal();

    return {
      assets: assetsTotal + customAssetsTotal + stocksTotal + cryptoTotal,
      liabilities: creditCardsTotal + loansTotal,
      netWorth: (assetsTotal + customAssetsTotal + stocksTotal + cryptoTotal) - (creditCardsTotal + loansTotal)
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
                {step === 2 && "Registra tus tarjetas y préstamos."}
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
                            <span className={`font-semibold text-sm ${hasEntries ? 'text-[#3E2723]' : 'text-[#8D6E63]'}`}>{asset.name}</span>
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
                                    className="h-11 text-sm bg-[#F5F0EE] border-0 focus:ring-2 focus:ring-[#5D4037]/20 rounded-xl text-[#3E2723]"
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
                                <button onClick={() => removeAssetEntry(entry.id)} className="text-[#A1887F] hover:text-white hover:bg-[#5D4037] transition-colors p-2 rounded-lg">
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
                      <>
                      <Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden mt-4">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${hasStocks ? 'bg-[#5D4037]/10 text-[#5D4037]' : 'bg-[#A1887F]/10 text-[#A1887F]'}`}>
                                {hasStocks ? <Check size={18} strokeWidth={3} /> : <TrendingUp size={18} />}
                              </div>
                              <span className="font-semibold text-sm text-[#3E2723]">¿Tienes acciones o ETFs?</span>
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
                                    <button onClick={() => removeStockEntry(entry.id)} className="text-[#A1887F] hover:text-white hover:bg-[#5D4037] transition-colors p-1 rounded-lg">
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
                                    <ResponsiveCalendarPicker
                                      date={entry.purchaseDate}
                                      onSelect={(date) => updateStockEntry(entry.id, 'purchaseDate', date)}
                                      placeholder="Fecha"
                                    />
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

                      {/* Crypto Question */}
                      <Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden mt-4">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${hasCrypto ? 'bg-[#5D4037]/10 text-[#5D4037]' : 'bg-[#A1887F]/10 text-[#A1887F]'}`}>
                                {hasCrypto ? <Check size={18} strokeWidth={3} /> : <Bitcoin size={18} />}
                              </div>
                              <span className="font-semibold text-sm text-[#3E2723]">¿Tienes criptomonedas?</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant={hasCrypto === true ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setHasCrypto(true);
                                  if (cryptoEntries.length === 0) addCryptoEntry();
                                }}
                                className={cn(
                                  "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                                  hasCrypto === true ? "bg-[#5D4037] hover:bg-[#4E342E] text-white shadow-md" : "border-[#A1887F]/30 text-[#5D4037] hover:bg-[#A1887F]/20 hover:border-[#5D4037]/50"
                                )}
                              >
                                Sí
                              </Button>
                              <Button
                                variant={hasCrypto === false ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setHasCrypto(false);
                                  setCryptoEntries([]);
                                }}
                                className={cn(
                                  "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                                  hasCrypto === false ? "bg-[#8D6E63] hover:bg-[#6D4C41] text-white shadow-md" : "border-[#A1887F]/30 text-[#8D6E63] hover:bg-[#A1887F]/20 hover:border-[#8D6E63]/50"
                                )}
                              >
                                No
                              </Button>
                            </div>
                          </div>

                          {hasCrypto && (
                            <div className="space-y-3 mt-4 pt-4 border-t border-[#A1887F]/20">
                              {cryptoEntries.map((entry) => (
                                <div key={entry.id} className="bg-[#F5F0EE] rounded-2xl p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#5D4037] uppercase tracking-wide">Criptomoneda</span>
                                    <button onClick={() => removeCryptoEntry(entry.id)} className="text-[#A1887F] hover:text-white hover:bg-[#5D4037] transition-colors p-1 rounded-lg">
                                      <X size={16} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Ej: Bitcoin, Ethereum"
                                      value={entry.name}
                                      onChange={(e) => updateCryptoEntry(entry.id, 'name', e.target.value)}
                                      className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-[#5D4037]/20"
                                    />
                                    <Input
                                      placeholder="Cantidad"
                                      value={formatNumberWithCommas(entry.quantity)}
                                      onChange={(e) => updateCryptoEntry(entry.id, 'quantity', parseFormattedNumber(e.target.value))}
                                      className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-[#5D4037]/20"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D4037] text-sm font-bold">$</span>
                                      <Input
                                        placeholder="Precio"
                                        value={formatNumberWithCommas(entry.purchasePrice)}
                                        onChange={(e) => updateCryptoEntry(entry.id, 'purchasePrice', parseFormattedNumber(e.target.value))}
                                        className="h-11 text-sm pl-7 bg-white border-0 rounded-xl focus:ring-2 focus:ring-[#5D4037]/20"
                                      />
                                    </div>
                                    <ResponsiveCalendarPicker
                                      date={entry.purchaseDate}
                                      onSelect={(date) => updateCryptoEntry(entry.id, 'purchaseDate', date)}
                                      placeholder="Fecha"
                                    />
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
                                onClick={addCryptoEntry}
                                className="text-[#5D4037] hover:text-[#4E342E] hover:bg-[#A1887F]/20 text-xs font-bold h-10 px-4 rounded-xl w-full"
                              >
                                <Plus size={14} className="mr-2" />
                                Agregar otra cripto
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Custom Assets */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-bold text-[#5D4037]">Otros Activos</h3>
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
                        className="h-11 font-semibold text-sm bg-[#F5F0EE] border-0 rounded-xl text-[#3E2723]"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeCustomAsset(customAsset.id)} className="h-11 w-11 text-[#A1887F] hover:text-white hover:bg-[#5D4037] rounded-xl">
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
                            className="h-10 text-sm bg-[#F5F0EE] border-0 rounded-xl text-[#3E2723]"
                          />
                          <Input 
                            placeholder="0.00" 
                            value={formatNumberWithCommas(acc.value)}
                            onChange={(e) => updateCustomAssetAccount(customAsset.id, acc.id, 'value', parseFormattedNumber(e.target.value))}
                            className="h-10 text-sm w-32 bg-[#F5F0EE] border-0 rounded-xl text-[#3E2723]"
                          />
                          <button onClick={() => removeCustomAssetAccount(customAsset.id, acc.id)} className="text-[#A1887F] hover:text-white hover:bg-[#5D4037] p-1 rounded-lg transition-colors">
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
              {/* Credit Cards Question */}
              <Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#A1887F]/20 text-[#8D6E63]">
                        <CreditCard size={18} />
                      </div>
                      <span className="font-semibold text-sm text-[#3E2723]">¿Tienes tarjetas de crédito?</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={hasCreditCards === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setHasCreditCards(true);
                          if (creditCardEntries.length === 0) addCreditCardEntry();
                        }}
                        className={cn(
                          "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                          hasCreditCards === true ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        )}
                      >
                        Sí
                      </Button>
                      <Button
                        variant={hasCreditCards === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setHasCreditCards(false);
                          setCreditCardEntries([]);
                        }}
                        className={cn(
                          "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                          hasCreditCards === false ? "bg-[#8D6E63] hover:bg-[#6D4C41] text-white shadow-md" : "border-[#A1887F]/30 text-[#8D6E63] hover:bg-[#A1887F]/20 hover:border-[#8D6E63]/50"
                        )}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {hasCreditCards && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-red-100">
                      {creditCardEntries.map((entry) => (
                        <div key={entry.id} className="bg-red-50/50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Tarjeta de Crédito</span>
                            <button onClick={() => removeCreditCardEntry(entry.id)} className="text-red-300 hover:text-white hover:bg-red-600 transition-colors p-1 rounded-lg">
                              <X size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-[#8D6E63] mb-1 block">Banco</Label>
                              <Input
                                placeholder="Ej: BBVA, Banamex, Santander"
                                value={entry.bankName}
                                onChange={(e) => updateCreditCardEntry(entry.id, 'bankName', e.target.value)}
                                className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-[#8D6E63] mb-1 block">Nombre de tarjeta</Label>
                              <Input
                                placeholder="Ej: Platinum, Oro, Azul"
                                value={entry.cardName}
                                onChange={(e) => updateCreditCardEntry(entry.id, 'cardName', e.target.value)}
                                className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-[#8D6E63] mb-1 block">Día de corte</Label>
                              <Input
                                placeholder="Ej: 15 (día del mes)"
                                value={entry.cutoffDate}
                                onChange={(e) => updateCreditCardEntry(entry.id, 'cutoffDate', e.target.value)}
                                className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-[#8D6E63] mb-1 block">Deuda actual</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold">$</span>
                                <Input
                                  placeholder="Ej: 15,000"
                                  value={formatNumberWithCommas(entry.amountOwed)}
                                  onChange={(e) => updateCreditCardEntry(entry.id, 'amountOwed', parseFormattedNumber(e.target.value))}
                                  className="h-11 text-sm pl-7 bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200 font-semibold text-red-600"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="file"
                              id={`statement-${entry.id}`}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleStatementUpload(entry.id, file);
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => document.getElementById(`statement-${entry.id}`)?.click()}
                              className={cn(
                                "w-full h-10 text-xs border-dashed rounded-xl transition-all",
                                entry.statementFileName 
                                  ? "text-green-600 border-green-300 bg-green-50 hover:bg-green-100" 
                                  : "text-[#8D6E63] border-[#A1887F]/30 hover:bg-[#A1887F]/10"
                              )}
                            >
                              <Upload size={14} className="mr-2" />
                              {entry.statementFileName || "Subir estado de cuenta (opcional)"}
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addCreditCardEntry}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-10 px-4 rounded-xl w-full"
                      >
                        <Plus size={14} className="mr-2" />
                        Agregar otra tarjeta
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Loans Question */}
              <Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#A1887F]/20 text-[#8D6E63]">
                        <Briefcase size={18} />
                      </div>
                      <span className="font-semibold text-sm text-[#3E2723]">¿Tienes algún préstamo a tu nombre?</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={hasLoans === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHasLoans(true)}
                        className={cn(
                          "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                          hasLoans === true ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        )}
                      >
                        Sí
                      </Button>
                      <Button
                        variant={hasLoans === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setHasLoans(false);
                          setLoanEntries([]);
                        }}
                        className={cn(
                          "text-xs h-9 px-5 rounded-xl font-bold transition-all",
                          hasLoans === false ? "bg-[#8D6E63] hover:bg-[#6D4C41] text-white shadow-md" : "border-[#A1887F]/30 text-[#8D6E63] hover:bg-[#A1887F]/20 hover:border-[#8D6E63]/50"
                        )}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {hasLoans && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-red-100">
                      {/* Loan type selection */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-[#5D4037] uppercase tracking-wide">Tipo de préstamo</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(Object.keys(loanTypeLabels) as LoanType[]).map((type) => {
                            const { label, icon: Icon } = loanTypeLabels[type];
                            const hasThisType = loanEntries.some(e => e.loanType === type);
                            return (
                              <Button
                                key={type}
                                variant={hasThisType ? "default" : "outline"}
                                size="sm"
                                onClick={() => addLoanEntry(type)}
                                className={cn(
                                  "h-12 text-xs rounded-xl font-bold transition-all flex flex-col items-center gap-1",
                                  hasThisType ? "bg-red-600 hover:bg-red-700 text-white" : "border-red-200 text-red-600 hover:bg-red-50"
                                )}
                              >
                                <Icon size={16} />
                                {label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Loan entries */}
                      {loanEntries.map((entry) => {
                        const { label, icon: Icon } = loanTypeLabels[entry.loanType];
                        return (
                          <div key={entry.id} className="bg-red-50/50 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon size={16} className="text-red-600" />
                                <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Préstamo {label}</span>
                              </div>
                              <button onClick={() => removeLoanEntry(entry.id)} className="text-red-300 hover:text-white hover:bg-red-600 transition-colors p-1 rounded-lg">
                                <X size={16} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-[#8D6E63] mb-1 block">Monto original</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold">$</span>
                                  <Input
                                    placeholder="0.00"
                                    value={formatNumberWithCommas(entry.originalAmount)}
                                    onChange={(e) => updateLoanEntry(entry.id, 'originalAmount', parseFormattedNumber(e.target.value))}
                                    className="h-11 text-sm pl-7 bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#8D6E63] mb-1 block">Saldo actual</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold">$</span>
                                  <Input
                                    placeholder="0.00"
                                    value={formatNumberWithCommas(entry.currentBalance)}
                                    onChange={(e) => updateLoanEntry(entry.id, 'currentBalance', parseFormattedNumber(e.target.value))}
                                    className="h-11 text-sm pl-7 bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200 font-semibold text-red-600"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-[10px] text-[#8D6E63] mb-1 block">Tasa de interés</Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0.00"
                                    value={entry.interestRate}
                                    onChange={(e) => updateLoanEntry(entry.id, 'interestRate', e.target.value)}
                                    className="h-11 text-sm pr-7 bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1887F] text-sm">%</span>
                                </div>
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#8D6E63] mb-1 block">Plazo (meses)</Label>
                                <Input
                                  placeholder="12"
                                  value={entry.termMonths}
                                  onChange={(e) => updateLoanEntry(entry.id, 'termMonths', e.target.value)}
                                  className="h-11 text-sm bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#8D6E63] mb-1 block">Mensualidad</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold">$</span>
                                  <Input
                                    placeholder="0.00"
                                    value={formatNumberWithCommas(entry.monthlyPayment)}
                                    onChange={(e) => updateLoanEntry(entry.id, 'monthlyPayment', parseFormattedNumber(e.target.value))}
                                    className="h-11 text-sm pl-7 bg-white border-0 rounded-xl focus:ring-2 focus:ring-red-200"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label className="text-[10px] text-[#8D6E63] mb-1 block">Fecha de vencimiento</Label>
                              <ResponsiveCalendarPicker
                                date={entry.dueDate}
                                onSelect={(date) => updateLoanEntry(entry.id, 'dueDate', date)}
                                placeholder="Seleccionar fecha"
                                buttonClassName="w-full hover:bg-red-50"
                                iconClassName="text-red-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
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
                <div className="text-4xl font-black text-[#3E2723] mt-3 tracking-tight">
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

              {/* Details */}
              {totals.assets > 0 && (
                <Card className="bg-white rounded-3xl p-4 shadow-lg border-0">
                  <h3 className="text-sm font-bold text-[#5D4037] mb-3 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Detalle de Activos
                  </h3>
                  <div className="space-y-2">
                    {assetEntries.filter(e => e.name && parseFloat(e.value) > 0).map(entry => (
                      <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{entry.name}</span>
                        <span className="text-sm font-semibold text-[#5D4037]">${formatNumberWithCommas(entry.value)}</span>
                      </div>
                    ))}
                    {stockEntries.filter(e => e.name && parseFloat(e.quantity) > 0).map(entry => (
                      <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{entry.name} ({entry.quantity} acciones)</span>
                        <span className="text-sm font-semibold text-[#5D4037]">
                          ${formatNumberWithCommas(String((parseFloat(entry.quantity) || 0) * (parseFloat(entry.purchasePrice) || 0)))}
                        </span>
                      </div>
                    ))}
                    {cryptoEntries.filter(e => e.name && parseFloat(e.quantity) > 0).map(entry => (
                      <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{entry.name} ({entry.quantity} unidades)</span>
                        <span className="text-sm font-semibold text-[#5D4037]">
                          ${formatNumberWithCommas(String((parseFloat(entry.quantity) || 0) * (parseFloat(entry.purchasePrice) || 0)))}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {totals.liabilities > 0 && (
                <Card className="bg-white rounded-3xl p-4 shadow-lg border-0">
                  <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                    <TrendingDown size={16} />
                    Detalle de Pasivos
                  </h3>
                  <div className="space-y-2">
                    {creditCardEntries.filter(e => parseFloat(parseFormattedNumber(e.amountOwed)) > 0).map(entry => (
                      <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{entry.bankName} - {entry.cardName}</span>
                        <span className="text-sm font-semibold text-red-600">${formatNumberWithCommas(entry.amountOwed)}</span>
                      </div>
                    ))}
                    {loanEntries.filter(e => parseFloat(parseFormattedNumber(e.currentBalance)) > 0).map(entry => (
                      <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">Préstamo {loanTypeLabels[entry.loanType].label}</span>
                        <span className="text-sm font-semibold text-red-600">${formatNumberWithCommas(entry.currentBalance)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-area-pb">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step < 3 ? (
            <Button
              onClick={nextStep}
              className="w-full h-14 bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold text-lg rounded-2xl shadow-lg"
            >
              Continuar
              <ChevronRight className="ml-2" size={20} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-14 bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold text-lg rounded-2xl shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : saveStatus === 'saved' ? (
                <span className="flex items-center gap-2">
                  <Check size={20} />
                  ¡Guardado!
                </span>
              ) : (
                'Guardar Patrimonio'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
