import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Home, Wallet, PiggyBank, CreditCard, Building2, MapPin, Check } from "lucide-react";
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

// Questions for First Property
const quizSteps = [
  {
    name: "Tu Propiedad Ideal",
    icon: Home,
    description: "¿Cómo es la casa que quieres comprar?",
    questions: [
      { id: 'property_value', question: "Valor de la propiedad", placeholder: "Ej: 3,000,000", hint: "El precio de la casa o departamento", icon: Home, required: true },
      { id: 'location', question: "Ubicación deseada", placeholder: "Ej: Zona metropolitana", hint: "Ciudad o zona donde quieres comprar", type: 'text', icon: MapPin },
      { id: 'down_payment_target', question: "Enganche objetivo (%)", placeholder: "Ej: 20", hint: "Generalmente 10-30% del valor", type: 'percent', icon: Building2 },
    ]
  },
  {
    name: "Tu Situación Actual",
    icon: Wallet,
    description: "¿Cuánto tienes ahorrado para este objetivo?",
    questions: [
      { id: 'current_savings', question: "Ahorro actual para la casa", placeholder: "Ej: 200,000", hint: "Lo que ya tienes guardado para esto", icon: PiggyBank },
      { id: 'other_savings', question: "Otros ahorros disponibles", placeholder: "Ej: 100,000", hint: "Que podrías usar para el enganche", icon: Wallet },
      { id: 'monthly_savings', question: "¿Cuánto puedes ahorrar al mes?", placeholder: "Ej: 15,000", hint: "Capacidad mensual de ahorro", icon: PiggyBank, required: true },
    ]
  },
  {
    name: "Tus Deudas Actuales",
    icon: CreditCard,
    description: "¿Tienes deudas que pagar?",
    questions: [
      { id: 'credit_cards', question: "Deudas de tarjetas de crédito", placeholder: "Ej: 30,000", hint: "Saldo total adeudado", icon: CreditCard },
      { id: 'car_loan', question: "Crédito automotriz", placeholder: "Ej: 150,000", hint: "Saldo pendiente del auto", icon: CreditCard },
      { id: 'other_loans', question: "Otros préstamos", placeholder: "Ej: 50,000", hint: "Personales, educativos, etc.", icon: Wallet },
      { id: 'monthly_income', question: "Ingreso mensual neto", placeholder: "Ej: 45,000", hint: "Tu sueldo después de impuestos", icon: Wallet, required: true },
    ]
  }
];

interface FirstPropertyQuizProps {
  onComplete: (data: {
    propertyValue: number;
    downPaymentPercent: number;
    currentSavings: number;
    monthlySavingsCapacity: number;
    monthlyIncome: number;
    totalDebts: number;
    location?: string;
    breakdown: Record<string, number | string>;
  }) => void;
  isSaving: boolean;
}

export default function FirstPropertyQuiz({ onComplete, isSaving }: FirstPropertyQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleComplete = () => {
    const getNum = (key: string) => parseFloat(parseFormattedNumber(answers[key] || '0')) || 0;
    
    const propertyValue = getNum('property_value');
    const downPaymentPercent = getNum('down_payment_target') || 20;
    const currentSavings = getNum('current_savings') + getNum('other_savings');
    const monthlySavingsCapacity = getNum('monthly_savings');
    const monthlyIncome = getNum('monthly_income');
    const totalDebts = getNum('credit_cards') + getNum('car_loan') + getNum('other_loans');

    const breakdown: Record<string, number | string> = {};
    Object.entries(answers).forEach(([key, value]) => {
      if (value) {
        const numValue = parseFloat(parseFormattedNumber(value));
        breakdown[key] = isNaN(numValue) ? value : numValue;
      }
    });

    onComplete({
      propertyValue,
      downPaymentPercent,
      currentSavings,
      monthlySavingsCapacity,
      monthlyIncome,
      totalDebts,
      location: answers['location'],
      breakdown
    });
  };

  const currentStep = quizSteps[step - 1];
  const CategoryIcon = currentStep?.icon || Home;

  // Check required fields
  const getNum = (key: string) => parseFloat(parseFormattedNumber(answers[key] || '0')) || 0;
  const isComplete = 
    getNum('property_value') > 0 && 
    getNum('monthly_savings') > 0 && 
    getNum('monthly_income') > 0;

  const nextStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Calculate down payment needed
  const propertyValue = getNum('property_value');
  const downPaymentPercent = getNum('down_payment_target') || 20;
  const downPaymentNeeded = propertyValue * (downPaymentPercent / 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F5] to-[#F5F0EE] pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#3E2723] via-[#3E2723] to-[#3E2723]/95 pb-8 rounded-b-[2rem]">
        <div className="sticky top-0 z-40 pt-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-white/70 tracking-wide">Paso {step} de 3</span>
                <h1 className="text-lg font-bold text-white">
                  Mi Primera Propiedad
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
              
              {/* Show down payment calculation */}
              {step === 1 && propertyValue > 0 && (
                <div className="mt-4 bg-white/10 rounded-2xl p-3">
                  <span className="text-white/60 text-xs">Enganche necesario ({downPaymentPercent}%):</span>
                  <p className="text-white font-bold text-lg">
                    ${formatNumberWithCommas(downPaymentNeeded.toString())}
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
              const value = answers[q.id] || '';
              const hasValue = q.type === 'text' ? value.length > 0 : parseFloat(parseFormattedNumber(value)) > 0;
              
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
                          ? "bg-[#3E2723]/10 text-[#3E2723]" 
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
                      {q.type !== 'text' && q.type !== 'percent' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3E2723] text-sm font-bold">$</span>
                      )}
                      {q.type === 'percent' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3E2723] text-sm font-bold">%</span>
                      )}
                      <Input
                        type="text"
                        inputMode={q.type === 'text' ? 'text' : 'numeric'}
                        pattern={q.type === 'text' ? undefined : '[0-9]*'}
                        placeholder={q.placeholder}
                        value={q.type === 'text' || q.type === 'percent' ? value : formatNumberWithCommas(value)}
                        onChange={(e) => {
                          if (q.type === 'text') {
                            handleAnswer(q.id, e.target.value);
                          } else {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            handleAnswer(q.id, val);
                          }
                        }}
                        className={cn(
                          "h-11 text-sm bg-[#F5F0EE] border-0 focus:ring-2 focus:ring-[#3E2723]/20 rounded-xl font-semibold text-[#3E2723]",
                          q.type !== 'text' && q.type !== 'percent' && "pl-8",
                          q.type === 'percent' && "pr-8"
                        )}
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
              className="flex-1 h-14 rounded-2xl border-[#A1887F]/30 text-[#3E2723] font-bold hover:bg-[#A1887F]/10"
            >
              Anterior
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-14 rounded-2xl bg-[#3E2723] hover:bg-[#2C1A17] text-white font-bold shadow-lg"
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
                  ? "bg-[#3E2723] hover:bg-[#2C1A17] text-white" 
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
