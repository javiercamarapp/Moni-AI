import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, Wallet, LineChart, Bitcoin, Landmark, Briefcase, Home, Car, CreditCard, PiggyBank, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

// Questions for First Million - focus on net worth and investment capacity
const quizSteps = [
  {
    name: "Tus Inversiones Actuales",
    icon: TrendingUp,
    description: "¿Cuánto tienes invertido actualmente?",
    questions: [
      { id: 'stocks', question: "Acciones y ETFs", placeholder: "Ej: 100,000", hint: "Bolsa de valores, fondos indexados", icon: LineChart },
      { id: 'crypto', question: "Criptomonedas", placeholder: "Ej: 50,000", hint: "Bitcoin, Ethereum, etc.", icon: Bitcoin },
      { id: 'retirement', question: "Fondos de retiro", placeholder: "Ej: 80,000", hint: "AFORE voluntario, PPR", icon: Landmark },
      { id: 'business', question: "Inversiones en negocios", placeholder: "Ej: 200,000", hint: "Participaciones en empresas", icon: Briefcase },
      { id: 'savings', question: "Ahorros líquidos", placeholder: "Ej: 150,000", hint: "Cuentas bancarias, CETES", icon: Wallet },
    ]
  },
  {
    name: "Tus Activos",
    icon: Home,
    description: "¿Qué propiedades y bienes tienes?",
    questions: [
      { id: 'property', question: "Valor de propiedades", placeholder: "Ej: 2,000,000", hint: "Casa, departamento, terrenos", icon: Home },
      { id: 'vehicles', question: "Valor de vehículos", placeholder: "Ej: 300,000", hint: "Autos, motos, etc.", icon: Car },
      { id: 'other_assets', question: "Otros activos de valor", placeholder: "Ej: 100,000", hint: "Joyas, arte, equipos", icon: Briefcase },
    ]
  },
  {
    name: "Tus Deudas y Capacidad",
    icon: CreditCard,
    description: "¿Cuánto debes y cuánto puedes invertir?",
    questions: [
      { id: 'mortgage', question: "Hipoteca pendiente", placeholder: "Ej: 1,500,000", hint: "Saldo actual del crédito", icon: Home },
      { id: 'car_loan', question: "Crédito automotriz", placeholder: "Ej: 200,000", hint: "Saldo pendiente", icon: Car },
      { id: 'credit_cards', question: "Deudas de tarjetas", placeholder: "Ej: 50,000", hint: "Saldo total adeudado", icon: CreditCard },
      { id: 'other_debt', question: "Otras deudas", placeholder: "Ej: 100,000", hint: "Préstamos personales, etc.", icon: Wallet },
      { id: 'monthly_investment', question: "¿Cuánto puedes invertir al mes?", placeholder: "Ej: 10,000", hint: "Capacidad mensual de inversión", icon: PiggyBank, required: true },
    ]
  }
];

interface FirstMillionQuizProps {
  onComplete: (data: {
    currentInvested: number;
    totalAssets: number;
    totalLiabilities: number;
    monthlyInvestmentCapacity: number;
    breakdown: Record<string, number>;
  }) => void;
  isSaving: boolean;
}

export default function FirstMillionQuiz({ onComplete, isSaving }: FirstMillionQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const handleAnswer = (questionId: string, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setAnswers({ ...answers, [questionId]: numericValue });
  };

  const handleComplete = () => {
    const getNum = (key: string) => parseFloat(answers[key] || '0') || 0;
    
    const currentInvested = 
      getNum('stocks') + getNum('crypto') + getNum('retirement') + 
      getNum('business') + getNum('savings');
    
    const totalAssets = 
      currentInvested + getNum('property') + getNum('vehicles') + getNum('other_assets');
    
    const totalLiabilities = 
      getNum('mortgage') + getNum('car_loan') + getNum('credit_cards') + getNum('other_debt');
    
    const monthlyInvestmentCapacity = getNum('monthly_investment');

    const breakdown: Record<string, number> = {};
    Object.entries(answers).forEach(([key, value]) => {
      const numValue = parseFloat(value);
      if (numValue > 0) {
        breakdown[key] = numValue;
      }
    });

    onComplete({
      currentInvested,
      totalAssets,
      totalLiabilities,
      monthlyInvestmentCapacity,
      breakdown
    });
  };

  const currentStep = quizSteps[step - 1];
  const CategoryIcon = currentStep?.icon || TrendingUp;

  // Check if monthly investment is filled (required)
  const isComplete = answers['monthly_investment'] && parseFloat(answers['monthly_investment']) > 0;

  const nextStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Calculate totals for display
  const getNum = (key: string) => parseFloat(answers[key] || '0') || 0;
  const currentInvested = 
    getNum('stocks') + getNum('crypto') + getNum('retirement') + 
    getNum('business') + getNum('savings');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F5] to-[#F5F0EE] pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#4E342E] via-[#4E342E] to-[#4E342E]/95 pb-8 rounded-b-[2rem]">
        <div className="sticky top-0 z-40 pt-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-white/70 tracking-wide">Paso {step} de 3</span>
                <h1 className="text-lg font-bold text-white">
                  Mi Primer Millón
                </h1>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/30'}`} 
                />
              ))}
            </div>

            {/* Icon and description inside header */}
            <div className="text-center pb-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CategoryIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {currentStep?.name}
              </h2>
              <p className="text-white/70 text-sm mt-1 max-w-sm mx-auto">
                {currentStep?.description}
              </p>
              
              {/* Show current invested total */}
              {step === 1 && currentInvested > 0 && (
                <div className="mt-4 bg-white/10 rounded-2xl p-3">
                  <span className="text-white/60 text-xs">Total invertido:</span>
                  <p className="text-white font-bold text-lg">
                    ${formatNumberWithCommas(currentInvested.toString())}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {currentStep?.questions.map((q) => {
              const QuestionIcon = q.icon || currentStep.icon;
              const hasValue = answers[q.id] && parseFloat(answers[q.id]) > 0;
              
              return (
                <Card 
                  key={q.id} 
                  className={cn(
                    "bg-white rounded-3xl shadow-lg transition-all border-0",
                    hasValue && "ring-2 ring-[#A1887F]/30"
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center",
                        hasValue 
                          ? "bg-[#4E342E]/10 text-[#4E342E]" 
                          : "bg-[#A1887F]/10 text-[#A1887F]"
                      )}>
                        {hasValue ? <Check size={18} strokeWidth={3} /> : <QuestionIcon size={18} />}
                      </div>
                      <div className="flex-1">
                        <span className={cn(
                          "font-semibold text-sm",
                          hasValue ? "text-[#3E2723]" : "text-[#8D6E63]"
                        )}>
                          {q.question}
                        </span>
                        {q.required && (
                          <span className="ml-1 text-xs text-red-500">*</span>
                        )}
                      </div>
                    </div>
                    
                    {q.hint && (
                      <p className="text-xs text-[#A1887F] mb-2 pl-13">
                        {q.hint}
                      </p>
                    )}
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4E342E] text-sm font-bold">$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={q.placeholder}
                        value={formatNumberWithCommas(answers[q.id] || "")}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleAnswer(q.id, value);
                        }}
                        className="h-11 text-sm pl-8 bg-[#F5F0EE] border-0 focus:ring-2 focus:ring-[#4E342E]/20 rounded-xl font-semibold text-[#4E342E]"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#FAF7F5] via-[#FAF7F5] to-transparent z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl border-[#A1887F]/30 text-[#4E342E] font-bold hover:bg-[#A1887F]/10"
            >
              Anterior
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-14 rounded-2xl bg-[#4E342E] hover:bg-[#3E2723] text-white font-bold shadow-lg"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isComplete || isSaving}
              className={cn(
                "flex-1 h-14 rounded-2xl font-bold shadow-lg transition-all",
                isComplete 
                  ? "bg-[#4E342E] hover:bg-[#3E2723] text-white" 
                  : "bg-[#A1887F]/50 text-white/70 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Generando plan...
                </span>
              ) : (
                "Generar Mi Plan"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
