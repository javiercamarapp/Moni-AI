import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Check, Home, Car, Wallet, Shield, LineChart, Bitcoin, Landmark, Briefcase, Building2, MapPin, Sparkles, Target } from "lucide-react";
import { useHasNetWorthData } from "@/hooks/useNetWorth";
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

// Aspirational questions grouped by category
const aspirationalCategories = [
  {
    name: "Bienes Raíces",
    icon: Home,
    questions: [
      { id: 1, question: "¿Cuánto vale la casa en la que quisieras vivir?", placeholder: "Ejemplo: 1,000,000", required: true },
      { id: 8, question: "¿Quieres tener una segunda propiedad? ¿Cuánto costaría?", placeholder: "Ejemplo: 800,000" },
      { id: 9, question: "¿Propiedades de inversión (terrenos, departamentos o casas en renta)?", placeholder: "Ejemplo: 1,500,000", icon: Building2 },
      { id: 10, question: "¿Terrenos u otros bienes raíces?", placeholder: "Ejemplo: 600,000", icon: MapPin },
    ]
  },
  {
    name: "Vehículos",
    icon: Car,
    questions: [
      { id: 2, question: "¿Cuánto cuesta el coche de tus sueños?", placeholder: "Ejemplo: 500,000", required: true },
      { id: 7, question: "¿Cuánto cuesta el coche que quieres darle a tu cónyuge?", placeholder: "Ejemplo: 400,000" },
      { id: 15, question: "¿Vehículos extras? Valor total", placeholder: "Ejemplo: 300,000" },
    ]
  },
  {
    name: "Inversiones y Dinero Líquido",
    icon: Wallet,
    questions: [
      { id: 3, question: "¿Cuánto quieres tener en ahorros disponibles (cuentas bancarias)?", placeholder: "Ejemplo: 300,000", required: true },
      { id: 11, question: "¿Cuánto en tu fondo de emergencia?", placeholder: "Ejemplo: 150,000", icon: Shield },
      { id: 4, question: "¿Cuánto en inversiones en bolsa o fondos (indexados, ETFs)?", placeholder: "Ejemplo: 800,000", required: true, icon: LineChart },
      { id: 12, question: "¿Cuánto en criptomonedas?", placeholder: "Ejemplo: 200,000", icon: Bitcoin },
      { id: 13, question: "¿Cuánto en aportaciones a retiro (AFORE, IRA)?", placeholder: "Ejemplo: 500,000", icon: Landmark },
      { id: 14, question: "¿Cuánto en participaciones en empresas o startups?", placeholder: "Ejemplo: 400,000", icon: Briefcase },
    ]
  }
];

export default function LevelQuiz() {
  const navigate = useNavigate();
  const [aspirationalAnswers, setAspirationalAnswers] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAspirations, setIsCheckingAspirations] = useState(true);
  const { data: hasNetWorthData, isLoading: checkingNetWorth } = useHasNetWorthData();
  const [step, setStep] = useState(1);

  // Check if user already has aspirations saved
  useEffect(() => {
    const checkExistingAspirations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: aspirations } = await supabase
          .from("user_aspirations")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (aspirations && aspirations.length > 0) {
          navigate("/aspirations-analysis");
        }
      } catch (error) {
        console.error("Error checking aspirations:", error);
      } finally {
        setIsCheckingAspirations(false);
      }
    };

    checkExistingAspirations();
  }, [navigate]);

  if (checkingNetWorth || isCheckingAspirations) {
    return null;
  }

  const handleAnswer = (questionId: number, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setAspirationalAnswers({ ...aspirationalAnswers, [questionId]: numericValue });
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      // Validate mandatory questions (1, 2, 3, 4)
      const mandatoryQuestions = [1, 2, 3, 4];
      const answeredMandatory = mandatoryQuestions.filter(q => 
        aspirationalAnswers[q] && parseFloat(aspirationalAnswers[q]) > 0
      );

      if (answeredMandatory.length < 4) {
        toast.error("Por favor completa las 4 preguntas principales");
        setIsSaving(false);
        return;
      }

      // Save aspirations
      const aspirationsToSave = Object.entries(aspirationalAnswers)
        .filter(([_, value]) => value && parseFloat(value) > 0)
        .map(([questionId, value]) => ({
          user_id: user.id,
          question_id: parseInt(questionId),
          value: parseFloat(value)
        }));

      const { error: aspirationsError } = await supabase
        .from("user_aspirations")
        .upsert(aspirationsToSave, { 
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false 
        })
        .select();

      if (aspirationsError) throw aspirationsError;

      // Mark quiz as completed
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ level_quiz_completed: true })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (hasNetWorthData) {
        toast.success("¡Aspiraciones guardadas!");
        navigate("/aspirations-analysis");
      } else {
        toast.success("¡Aspiraciones guardadas! Ahora completa tu patrimonio");
        navigate("/initial-net-worth");
      }
    } catch (error: any) {
      console.error("Error saving aspirations:", error);
      toast.error("Error al guardar: " + (error.message || "Error desconocido"));
    } finally {
      setIsSaving(false);
    }
  };

  // Progress calculation
  const requiredIds = [1, 2, 3, 4];
  const answeredRequired = requiredIds.filter(id => 
    aspirationalAnswers[id] && parseFloat(aspirationalAnswers[id]) > 0
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
      {/* Header - Brown gradient like NetWorthSetupForm */}
      <div className="bg-gradient-to-b from-[#5D4037] via-[#5D4037] to-[#5D4037]/95 pb-8 rounded-b-[2rem]">
        <div className="sticky top-0 z-40 pt-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => step === 1 ? navigate("/dashboard") : prevStep()} 
                className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md text-[#5D4037]"
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-white/70 tracking-wide">Paso {step} de 3</span>
                <h1 className="text-lg font-bold text-white">
                  Tus Aspiraciones
                </h1>
              </div>
              <div className="w-10" />
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
                {step === 1 && "Define tus metas en bienes raíces."}
                {step === 2 && "Define tus metas en vehículos."}
                {step === 3 && "Define tus metas en inversiones y ahorros."}
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
            {/* Questions for current category */}
            {currentCategory?.questions.map((q) => {
              const QuestionIcon = q.icon || currentCategory.icon;
              const hasValue = aspirationalAnswers[q.id] && parseFloat(aspirationalAnswers[q.id]) > 0;
              
              return (
                <Card 
                  key={q.id} 
                  className={cn(
                    "bg-white rounded-3xl shadow-lg transition-all border-0",
                    hasValue && "ring-2 ring-[#A1887F]/30"
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
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
                    
                    <div className="relative ml-13 pl-10">
                      <span className="absolute left-13 top-1/2 -translate-y-1/2 text-[#5D4037] text-sm font-bold">$</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder={q.placeholder}
                        value={formatNumberWithCommas(aspirationalAnswers[q.id] || "")}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleAnswer(q.id, value);
                        }}
                        className="h-11 text-sm pl-7 bg-[#F5F0EE] border-0 focus:ring-2 focus:ring-[#5D4037]/20 rounded-xl font-semibold text-[#5D4037]"
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
                <span className="flex items-center gap-2">
                  <Sparkles size={18} />
                  Guardar Aspiraciones
                </span>
              )}
            </Button>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-3 text-center text-xs text-[#8D6E63]">
          {answeredRequired} de {requiredIds.length} preguntas obligatorias
        </div>
      </div>
    </div>
  );
}
