import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Home, Car, Wallet, Shield, LineChart, Bitcoin, Landmark, Briefcase, Building2, MapPin, Target } from "lucide-react";
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

// Simplified aspirational questions - more digestible
const aspirationalCategories = [
  {
    name: "Tu Hogar Ideal",
    icon: Home,
    description: "¿Cómo es la casa donde quieres vivir?",
    questions: [
      { id: 1, question: "Valor de tu casa ideal", placeholder: "Ej: 3,000,000", required: true, hint: "La propiedad principal donde vivirás" },
      { id: 8, question: "Casa vacacional o segunda propiedad", placeholder: "Ej: 1,500,000", hint: "Opcional: casa de playa, campo, etc." },
    ]
  },
  {
    name: "Tu Transporte",
    icon: Car,
    description: "¿Cómo te moverás?",
    questions: [
      { id: 2, question: "Tu auto ideal", placeholder: "Ej: 600,000", required: true, hint: "El coche que siempre has querido" },
      { id: 7, question: "Auto para pareja/familia", placeholder: "Ej: 400,000", hint: "Opcional: segundo vehículo familiar" },
    ]
  },
  {
    name: "Tu Seguridad Financiera",
    icon: Wallet,
    description: "¿Cuánto respaldo necesitas?",
    questions: [
      { id: 3, question: "Ahorros disponibles", placeholder: "Ej: 500,000", required: true, hint: "Dinero líquido en cuentas bancarias", icon: Wallet },
      { id: 11, question: "Fondo de emergencia", placeholder: "Ej: 200,000", hint: "6-12 meses de gastos cubiertos", icon: Shield },
      { id: 4, question: "Inversiones en bolsa/fondos", placeholder: "Ej: 1,000,000", required: true, hint: "ETFs, acciones, fondos indexados", icon: LineChart },
      { id: 13, question: "Fondo para retiro", placeholder: "Ej: 800,000", hint: "AFORE voluntario, PPR, etc.", icon: Landmark },
    ]
  }
];

interface FinancialLifeQuizProps {
  onComplete: (answers: Record<number, number>) => void;
  isSaving: boolean;
}

export default function FinancialLifeQuiz({ onComplete, isSaving }: FinancialLifeQuizProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [step, setStep] = useState(1);

  const handleAnswer = (questionId: number, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setAnswers({ ...answers, [questionId]: numericValue });
  };

  const handleComplete = () => {
    const numericAnswers: Record<number, number> = {};
    Object.entries(answers).forEach(([key, value]) => {
      const numValue = parseFloat(value);
      if (numValue > 0) {
        numericAnswers[parseInt(key)] = numValue;
      }
    });
    onComplete(numericAnswers);
  };

  // Progress calculation
  const requiredIds = [1, 2, 3, 4];
  const answeredRequired = requiredIds.filter(id => 
    answers[id] && parseFloat(answers[id]) > 0
  ).length;
  const isComplete = answeredRequired === requiredIds.length;

  const currentCategory = aspirationalCategories[step - 1];
  const CategoryIcon = currentCategory?.icon || Target;

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
      {/* Header */}
      <div className="bg-gradient-to-b from-[#5D4037] via-[#5D4037] to-[#5D4037]/95 pb-8 rounded-b-[2rem]">
        <div className="sticky top-0 z-40 pt-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-center mb-4">
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-white/70 tracking-wide">Paso {step} de 3</span>
                <h1 className="text-lg font-bold text-white">
                  Financial Journey
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
                {currentCategory?.name}
              </h2>
              <p className="text-white/70 text-sm mt-1 max-w-sm mx-auto">
                {currentCategory?.description}
              </p>
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
            {currentCategory?.questions.map((q) => {
              const QuestionIcon = q.icon || currentCategory.icon;
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
                          ? "bg-[#5D4037]/10 text-[#5D4037]" 
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
                          <span className="ml-1 text-xs text-[#A1887F]">*</span>
                        )}
                      </div>
                    </div>
                    
                    {q.hint && (
                      <p className="text-xs text-[#A1887F] ml-13 mb-2 pl-13">
                        {q.hint}
                      </p>
                    )}
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5D4037] text-sm font-bold">$</span>
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
                        className="h-11 text-sm pl-8 bg-[#F5F0EE] border-0 focus:ring-2 focus:ring-[#5D4037]/20 rounded-xl font-semibold text-[#5D4037]"
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
              className="flex-1 h-14 rounded-2xl border-[#A1887F]/30 text-[#5D4037] font-bold hover:bg-[#A1887F]/10"
            >
              Anterior
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-14 rounded-2xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-bold shadow-lg"
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
                  ? "bg-[#5D4037] hover:bg-[#4E342E] text-white" 
                  : "bg-[#A1887F]/50 text-white/70 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Guardando...
                </span>
              ) : (
                "Continuar"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
