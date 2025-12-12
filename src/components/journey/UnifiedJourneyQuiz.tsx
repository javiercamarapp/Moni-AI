import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Car,
  Wallet,
  TrendingUp,
  Building2,
  CreditCard,
  PiggyBank,
  Search,
  Plus,
  X,
  Check,
  Loader2,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { JourneyType } from "./JourneyTypeSelector";

interface UnifiedJourneyQuizProps {
  journeyType: JourneyType;
  onComplete: () => void;
  onBack: () => void;
}

interface Investment {
  id: string;
  type: 'stock_mx' | 'stock_us' | 'etf' | 'crypto' | 'cetes' | 'bonds';
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
}

interface AssetEntry {
  category: string;
  name: string;
  value: number;
}

interface LiabilityEntry {
  category: string;
  name: string;
  value: number;
}

interface QuizData {
  // Real Estate
  hasProperty: boolean;
  propertyValue: number;
  
  // Vehicles
  hasVehicle: boolean;
  vehicleValue: number;
  
  // Cash & Savings
  cashSavings: number;
  emergencyFund: number;
  
  // Investments
  investments: Investment[];
  
  // Other Assets
  otherAssets: AssetEntry[];
  
  // Liabilities
  hasMortgage: boolean;
  mortgageBalance: number;
  hasCarLoan: boolean;
  carLoanBalance: number;
  hasCreditCardDebt: boolean;
  creditCardDebt: number;
  otherDebts: LiabilityEntry[];
  
  // Journey specific
  targetAmount: number;
  targetYears: number;
  monthlyCapacity: number;
}

const initialQuizData: QuizData = {
  hasProperty: false,
  propertyValue: 0,
  hasVehicle: false,
  vehicleValue: 0,
  cashSavings: 0,
  emergencyFund: 0,
  investments: [],
  otherAssets: [],
  hasMortgage: false,
  mortgageBalance: 0,
  hasCarLoan: false,
  carLoanBalance: 0,
  hasCreditCardDebt: false,
  creditCardDebt: 0,
  otherDebts: [],
  targetAmount: 1000000,
  targetYears: 10,
  monthlyCapacity: 5000,
};

const STEPS = [
  { id: 'property', title: 'Propiedades', icon: Home },
  { id: 'vehicles', title: 'Vehículos', icon: Car },
  { id: 'cash', title: 'Efectivo y Ahorro', icon: Wallet },
  { id: 'investments', title: 'Inversiones', icon: TrendingUp },
  { id: 'debts', title: 'Deudas', icon: CreditCard },
  { id: 'goals', title: 'Tu Meta', icon: PiggyBank },
];

export default function UnifiedJourneyQuiz({ journeyType, onComplete, onBack }: UnifiedJourneyQuizProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuizData>(initialQuizData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInvestmentType, setSelectedInvestmentType] = useState<Investment['type']>('stock_us');

  const updateData = useCallback((updates: Partial<QuizData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Use Yahoo Finance API via edge function
      const { data: results, error } = await supabase.functions.invoke('search-stocks', {
        body: { query, market: selectedInvestmentType === 'stock_mx' ? 'MX' : 'US' }
      });
      
      if (error) throw error;
      setSearchResults(results?.quotes || []);
    } catch (error) {
      console.error('Error searching stocks:', error);
      // Fallback mock results for demo
      setSearchResults([
        { symbol: query.toUpperCase(), name: `${query} Inc.`, price: 150.00 },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const addInvestment = (stock: any) => {
    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      type: selectedInvestmentType,
      symbol: stock.symbol,
      name: stock.name || stock.longname || stock.shortname,
      quantity: 1,
      currentPrice: stock.price || stock.regularMarketPrice || 0,
      totalValue: stock.price || stock.regularMarketPrice || 0,
    };
    
    updateData({ investments: [...data.investments, newInvestment] });
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateInvestmentQuantity = (id: string, quantity: number) => {
    const updated = data.investments.map(inv => 
      inv.id === id 
        ? { ...inv, quantity, totalValue: quantity * inv.currentPrice }
        : inv
    );
    updateData({ investments: updated });
  };

  const removeInvestment = (id: string) => {
    updateData({ investments: data.investments.filter(inv => inv.id !== id) });
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Save assets to activos table
      const assetsToInsert = [];
      
      if (data.hasProperty && data.propertyValue > 0) {
        assetsToInsert.push({
          user_id: user.id,
          categoria: 'Inmuebles',
          nombre: 'Propiedad principal',
          valor: data.propertyValue,
          es_activo_fijo: true,
        });
      }
      
      if (data.hasVehicle && data.vehicleValue > 0) {
        assetsToInsert.push({
          user_id: user.id,
          categoria: 'Vehículos',
          nombre: 'Vehículo',
          valor: data.vehicleValue,
          es_activo_fijo: true,
        });
      }
      
      if (data.cashSavings > 0) {
        assetsToInsert.push({
          user_id: user.id,
          categoria: 'Efectivo',
          nombre: 'Ahorros en efectivo',
          valor: data.cashSavings,
          liquidez_porcentaje: 100,
        });
      }
      
      if (data.emergencyFund > 0) {
        assetsToInsert.push({
          user_id: user.id,
          categoria: 'Efectivo',
          nombre: 'Fondo de emergencia',
          valor: data.emergencyFund,
          liquidez_porcentaje: 100,
        });
      }
      
      // Add investments as assets
      for (const inv of data.investments) {
        assetsToInsert.push({
          user_id: user.id,
          categoria: 'Inversiones',
          subcategoria: inv.type,
          nombre: `${inv.symbol} - ${inv.name}`,
          valor: inv.totalValue,
          descripcion: `${inv.quantity} unidades @ $${inv.currentPrice}`,
          tasa_rendimiento: 0,
        });
      }

      if (assetsToInsert.length > 0) {
        const { error: assetsError } = await supabase.from('activos').insert(assetsToInsert);
        if (assetsError) throw assetsError;
      }

      // Save liabilities to pasivos table
      const liabilitiesToInsert = [];
      
      if (data.hasMortgage && data.mortgageBalance > 0) {
        liabilitiesToInsert.push({
          user_id: user.id,
          categoria: 'Hipoteca',
          nombre: 'Hipoteca',
          valor: data.mortgageBalance,
          es_corto_plazo: false,
        });
      }
      
      if (data.hasCarLoan && data.carLoanBalance > 0) {
        liabilitiesToInsert.push({
          user_id: user.id,
          categoria: 'Préstamo automotriz',
          nombre: 'Crédito de auto',
          valor: data.carLoanBalance,
          es_corto_plazo: false,
        });
      }
      
      if (data.hasCreditCardDebt && data.creditCardDebt > 0) {
        liabilitiesToInsert.push({
          user_id: user.id,
          categoria: 'Tarjetas de crédito',
          nombre: 'Deuda de tarjetas',
          valor: data.creditCardDebt,
          es_corto_plazo: true,
        });
      }

      if (liabilitiesToInsert.length > 0) {
        const { error: liabilitiesError } = await supabase.from('pasivos').insert(liabilitiesToInsert);
        if (liabilitiesError) throw liabilitiesError;
      }

      // Calculate totals
      const totalInvested = data.investments.reduce((sum, inv) => sum + inv.totalValue, 0);
      const totalAssets = (data.hasProperty ? data.propertyValue : 0) + 
                          (data.hasVehicle ? data.vehicleValue : 0) + 
                          data.cashSavings + 
                          data.emergencyFund + 
                          totalInvested;

      // Save journey path
      const { error: journeyError } = await supabase.from('user_journey_paths').insert({
        user_id: user.id,
        journey_type: journeyType,
        target_amount: data.targetAmount,
        target_years: data.targetYears,
        current_invested: totalInvested,
        monthly_investment_capacity: data.monthlyCapacity,
        is_active: true,
        milestones: generateMilestones(data.targetAmount, data.targetYears),
      } as any);

      if (journeyError) throw journeyError;

      // Mark quiz as completed
      await supabase.from('profiles').update({ level_quiz_completed: true }).eq('id', user.id);

      toast.success('¡Tu perfil financiero ha sido guardado!');
      onComplete();
    } catch (error) {
      console.error('Error saving quiz data:', error);
      toast.error('Error al guardar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMilestones = (target: number, years: number) => {
    const milestones = [];
    const intervals = [0.1, 0.25, 0.5, 0.75, 1.0];
    
    for (const pct of intervals) {
      milestones.push({
        amount: Math.round(target * pct),
        percentage: pct * 100,
        label: pct === 1 ? '¡Meta alcanzada!' : `${(pct * 100).toFixed(0)}% del objetivo`,
      });
    }
    
    return milestones;
  };

  const CurrentStepIcon = STEPS[step].icon;

  const renderStep = () => {
    switch (step) {
      case 0: // Property
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#3E2723] mb-2">¿Tienes propiedades?</h2>
              <p className="text-[#8D6E63] text-sm">Incluye tu casa, departamento o terrenos</p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                variant={data.hasProperty ? "default" : "outline"}
                onClick={() => updateData({ hasProperty: true })}
                className={cn(
                  "w-32 h-24 flex-col gap-2 rounded-2xl",
                  data.hasProperty && "bg-[#5D4037] hover:bg-[#4E342E]"
                )}
              >
                <Check className="w-6 h-6" />
                <span>Sí</span>
              </Button>
              <Button
                variant={!data.hasProperty ? "default" : "outline"}
                onClick={() => updateData({ hasProperty: false, propertyValue: 0 })}
                className={cn(
                  "w-32 h-24 flex-col gap-2 rounded-2xl",
                  !data.hasProperty && "bg-[#5D4037] hover:bg-[#4E342E]"
                )}
              >
                <X className="w-6 h-6" />
                <span>No</span>
              </Button>
            </div>
            
            {data.hasProperty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-[#5D4037]">
                  Valor estimado de tu propiedad
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                  <Input
                    type="number"
                    value={data.propertyValue || ''}
                    onChange={(e) => updateData({ propertyValue: Number(e.target.value) })}
                    placeholder="2,000,000"
                    className="pl-10 text-lg h-14 rounded-xl border-[#D7CCC8]"
                  />
                </div>
              </motion.div>
            )}
          </div>
        );

      case 1: // Vehicles
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#3E2723] mb-2">¿Tienes vehículos?</h2>
              <p className="text-[#8D6E63] text-sm">Autos, motos u otros vehículos de valor</p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                variant={data.hasVehicle ? "default" : "outline"}
                onClick={() => updateData({ hasVehicle: true })}
                className={cn(
                  "w-32 h-24 flex-col gap-2 rounded-2xl",
                  data.hasVehicle && "bg-[#5D4037] hover:bg-[#4E342E]"
                )}
              >
                <Check className="w-6 h-6" />
                <span>Sí</span>
              </Button>
              <Button
                variant={!data.hasVehicle ? "default" : "outline"}
                onClick={() => updateData({ hasVehicle: false, vehicleValue: 0 })}
                className={cn(
                  "w-32 h-24 flex-col gap-2 rounded-2xl",
                  !data.hasVehicle && "bg-[#5D4037] hover:bg-[#4E342E]"
                )}
              >
                <X className="w-6 h-6" />
                <span>No</span>
              </Button>
            </div>
            
            {data.hasVehicle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-[#5D4037]">
                  Valor estimado de tu(s) vehículo(s)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                  <Input
                    type="number"
                    value={data.vehicleValue || ''}
                    onChange={(e) => updateData({ vehicleValue: Number(e.target.value) })}
                    placeholder="350,000"
                    className="pl-10 text-lg h-14 rounded-xl border-[#D7CCC8]"
                  />
                </div>
              </motion.div>
            )}
          </div>
        );

      case 2: // Cash & Savings
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#3E2723] mb-2">Efectivo y Ahorros</h2>
              <p className="text-[#8D6E63] text-sm">¿Cuánto tienes disponible en efectivo?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-2">
                  Ahorros en cuenta bancaria
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                  <Input
                    type="number"
                    value={data.cashSavings || ''}
                    onChange={(e) => updateData({ cashSavings: Number(e.target.value) })}
                    placeholder="50,000"
                    className="pl-10 text-lg h-14 rounded-xl border-[#D7CCC8]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-2">
                  Fondo de emergencia
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                  <Input
                    type="number"
                    value={data.emergencyFund || ''}
                    onChange={(e) => updateData({ emergencyFund: Number(e.target.value) })}
                    placeholder="30,000"
                    className="pl-10 text-lg h-14 rounded-xl border-[#D7CCC8]"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Investments
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#3E2723] mb-2">Tus Inversiones</h2>
              <p className="text-[#8D6E63] text-sm">Agrega tus acciones, ETFs, cripto y más</p>
            </div>
            
            {/* Investment Type Selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { type: 'stock_us' as const, label: '🇺🇸 Acciones US' },
                { type: 'stock_mx' as const, label: '🇲🇽 Acciones MX' },
                { type: 'etf' as const, label: '📊 ETFs' },
                { type: 'crypto' as const, label: '₿ Cripto' },
                { type: 'cetes' as const, label: '🏛️ CETES' },
                { type: 'bonds' as const, label: '📜 Bonos' },
              ].map(({ type, label }) => (
                <Button
                  key={type}
                  variant={selectedInvestmentType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInvestmentType(type)}
                  className={cn(
                    "rounded-full text-xs",
                    selectedInvestmentType === type && "bg-[#5D4037]"
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
            
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchStocks(e.target.value);
                }}
                placeholder={
                  selectedInvestmentType === 'crypto' ? "Buscar: BTC, ETH..." :
                  selectedInvestmentType === 'cetes' ? "Buscar: CETES 28, 91..." :
                  "Buscar: AAPL, AMZN, VOO..."
                }
                className="pl-10 h-12 rounded-xl border-[#D7CCC8]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F] animate-spin" />
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-xl border border-[#D7CCC8] shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => addInvestment(result)}
                    className="w-full p-3 text-left hover:bg-[#FAF7F5] flex items-center justify-between border-b border-[#F5F0EE] last:border-0"
                  >
                    <div>
                      <span className="font-medium text-[#3E2723]">{result.symbol}</span>
                      <span className="text-sm text-[#8D6E63] ml-2">{result.name || result.longname}</span>
                    </div>
                    <span className="text-[#5D4037] font-medium">
                      ${(result.price || result.regularMarketPrice || 0).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Added Investments */}
            {data.investments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#5D4037]">Tus inversiones agregadas</h3>
                {data.investments.map((inv) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#FAF7F5] rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[#3E2723]">{inv.symbol}</div>
                      <div className="text-xs text-[#8D6E63]">{inv.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={inv.quantity}
                        onChange={(e) => updateInvestmentQuantity(inv.id, Number(e.target.value))}
                        className="w-20 h-10 text-center rounded-lg border-[#D7CCC8]"
                        min={1}
                      />
                      <span className="text-sm text-[#8D6E63]">× ${inv.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="font-bold text-[#5D4037]">
                        ${inv.totalValue.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeInvestment(inv.id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                <div className="text-right pt-2 border-t border-[#D7CCC8]">
                  <span className="text-sm text-[#8D6E63]">Total inversiones: </span>
                  <span className="text-lg font-bold text-[#5D4037]">
                    ${data.investments.reduce((sum, inv) => sum + inv.totalValue, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Debts
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#3E2723] mb-2">Tus Deudas</h2>
              <p className="text-[#8D6E63] text-sm">Es importante conocer tus pasivos</p>
            </div>
            
            <div className="space-y-4">
              {/* Mortgage */}
              <div className="bg-[#FAF7F5] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-[#3E2723]">¿Tienes hipoteca?</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={data.hasMortgage ? "default" : "outline"}
                      onClick={() => updateData({ hasMortgage: true })}
                      className={data.hasMortgage ? "bg-[#5D4037]" : ""}
                    >
                      Sí
                    </Button>
                    <Button
                      size="sm"
                      variant={!data.hasMortgage ? "default" : "outline"}
                      onClick={() => updateData({ hasMortgage: false, mortgageBalance: 0 })}
                      className={!data.hasMortgage ? "bg-[#5D4037]" : ""}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {data.hasMortgage && (
                  <Input
                    type="number"
                    value={data.mortgageBalance || ''}
                    onChange={(e) => updateData({ mortgageBalance: Number(e.target.value) })}
                    placeholder="Saldo pendiente"
                    className="h-12 rounded-xl border-[#D7CCC8]"
                  />
                )}
              </div>
              
              {/* Car Loan */}
              <div className="bg-[#FAF7F5] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-[#3E2723]">¿Crédito automotriz?</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={data.hasCarLoan ? "default" : "outline"}
                      onClick={() => updateData({ hasCarLoan: true })}
                      className={data.hasCarLoan ? "bg-[#5D4037]" : ""}
                    >
                      Sí
                    </Button>
                    <Button
                      size="sm"
                      variant={!data.hasCarLoan ? "default" : "outline"}
                      onClick={() => updateData({ hasCarLoan: false, carLoanBalance: 0 })}
                      className={!data.hasCarLoan ? "bg-[#5D4037]" : ""}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {data.hasCarLoan && (
                  <Input
                    type="number"
                    value={data.carLoanBalance || ''}
                    onChange={(e) => updateData({ carLoanBalance: Number(e.target.value) })}
                    placeholder="Saldo pendiente"
                    className="h-12 rounded-xl border-[#D7CCC8]"
                  />
                )}
              </div>
              
              {/* Credit Card */}
              <div className="bg-[#FAF7F5] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-[#3E2723]">¿Deuda de tarjetas?</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={data.hasCreditCardDebt ? "default" : "outline"}
                      onClick={() => updateData({ hasCreditCardDebt: true })}
                      className={data.hasCreditCardDebt ? "bg-[#5D4037]" : ""}
                    >
                      Sí
                    </Button>
                    <Button
                      size="sm"
                      variant={!data.hasCreditCardDebt ? "default" : "outline"}
                      onClick={() => updateData({ hasCreditCardDebt: false, creditCardDebt: 0 })}
                      className={!data.hasCreditCardDebt ? "bg-[#5D4037]" : ""}
                    >
                      No
                    </Button>
                  </div>
                </div>
                {data.hasCreditCardDebt && (
                  <Input
                    type="number"
                    value={data.creditCardDebt || ''}
                    onChange={(e) => updateData({ creditCardDebt: Number(e.target.value) })}
                    placeholder="Deuda total"
                    className="h-12 rounded-xl border-[#D7CCC8]"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 5: // Goals
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#3E2723] mb-2">
                {journeyType === 'first_million' ? 'Tu Primer Millón' :
                 journeyType === 'first_property' ? 'Tu Primera Propiedad' :
                 'Tu Plan Financiero'}
              </h2>
              <p className="text-[#8D6E63] text-sm">Define tu meta y capacidad de ahorro</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-2">
                  {journeyType === 'first_million' ? 'Meta de inversión' :
                   journeyType === 'first_property' ? 'Valor de la propiedad' :
                   'Meta financiera total'}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                  <Input
                    type="number"
                    value={data.targetAmount || ''}
                    onChange={(e) => updateData({ targetAmount: Number(e.target.value) })}
                    placeholder={journeyType === 'first_million' ? "1,000,000" : "3,000,000"}
                    className="pl-10 text-lg h-14 rounded-xl border-[#D7CCC8]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-2">
                  ¿En cuántos años quieres lograrlo?
                </label>
                <Input
                  type="number"
                  value={data.targetYears || ''}
                  onChange={(e) => updateData({ targetYears: Number(e.target.value) })}
                  placeholder="10"
                  className="text-lg h-14 rounded-xl border-[#D7CCC8]"
                  min={1}
                  max={40}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-2">
                  ¿Cuánto puedes invertir/ahorrar al mes?
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1887F]" />
                  <Input
                    type="number"
                    value={data.monthlyCapacity || ''}
                    onChange={(e) => updateData({ monthlyCapacity: Number(e.target.value) })}
                    placeholder="5,000"
                    className="pl-10 text-lg h-14 rounded-xl border-[#D7CCC8]"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F5] to-[#F5F0EE] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={prevStep}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-[#5D4037]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-[#8D6E63]">
              <CurrentStepIcon className="w-4 h-4" />
              <span>Paso {step + 1} de {STEPS.length}</span>
            </div>
            <h1 className="text-lg font-bold text-[#3E2723]">{STEPS[step].title}</h1>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-[#D7CCC8] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#5D4037] rounded-full"
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 bg-white/80 backdrop-blur-sm border-t border-[#D7CCC8]">
        <Button
          onClick={step === STEPS.length - 1 ? handleComplete : nextStep}
          disabled={isLoading}
          className="w-full h-14 rounded-2xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-medium text-lg"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step === STEPS.length - 1 ? (
            'Crear mi plan financiero'
          ) : (
            <>
              Continuar
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
