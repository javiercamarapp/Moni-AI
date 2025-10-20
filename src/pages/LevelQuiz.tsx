import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Home, Car, PiggyBank, TrendingUp, Plane, GraduationCap } from "lucide-react";
import moniOwl from "@/assets/moni-owl-circle.png";
import { useHasNetWorthData } from "@/hooks/useNetWorth";
import moniAspirational from "@/assets/moni-aspirational.png";
import moniHouseAspiration from "@/assets/moni-house-aspiration.png";
import { cn } from "@/lib/utils";
import FinancialQuotesCarousel from "@/components/FinancialQuotesCarousel";

const questions = [
  {
    id: 1,
    question: "¿Cuál es tu objetivo financiero principal?",
    options: [
      "Ahorrar para el futuro",
      "Reducir deudas",
      "Invertir mi dinero",
      "Controlar gastos diarios"
    ]
  },
  {
    id: 2,
    question: "¿Con qué frecuencia revisas tus finanzas?",
    options: [
      "Diariamente",
      "Semanalmente",
      "Mensualmente",
      "Casi nunca"
    ]
  },
  {
    id: 3,
    question: "¿Cuánto de tu ingreso mensual ahorras?",
    options: [
      "Más del 20%",
      "Entre 10% y 20%",
      "Menos del 10%",
      "No ahorro actualmente"
    ]
  },
  {
    id: 4,
    question: "¿Qué tan importante es para ti alcanzar metas financieras?",
    options: [
      "Muy importante",
      "Importante",
      "Algo importante",
      "Poco importante"
    ]
  }
];

export default function LevelQuiz() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [aspirationalAnswers, setAspirationalAnswers] = useState<Record<number, string>>({});
  const [isSavingAsp, setIsSavingAsp] = useState(false);
  const { data: hasNetWorthData, isLoading: checkingNetWorth } = useHasNetWorthData();

  // Verificar estado de net worth antes de mostrar el quiz
  if (checkingNetWorth) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
  }

  // Cuestionario aspiracional
  const aspirationalQuestions = [
    {
      id: 1,
      question: "¿Cuánto quieres tener en propiedades? (en pesos)",
      icon: Home,
      placeholder: "Ejemplo: 1000000"
    },
    {
      id: 2,
      question: "¿Cuánto quieres tener en vehículos? (en pesos)",
      icon: Car,
      placeholder: "Ejemplo: 500000"
    },
    {
      id: 3,
      question: "¿Cuánto quieres tener en ahorros? (en pesos)",
      icon: PiggyBank,
      placeholder: "Ejemplo: 300000"
    },
    {
      id: 4,
      question: "¿Cuánto quieres tener en inversiones? (en pesos)",
      icon: TrendingUp,
      placeholder: "Ejemplo: 800000"
    },
    {
      id: 5,
      question: "¿Cuántos viajes quieres hacer al año?",
      icon: Plane,
      placeholder: "Ejemplo: 3"
    },
    {
      id: 6,
      question: "¿Cuánto quieres invertir en educación familiar anualmente? (en pesos)",
      icon: GraduationCap,
      placeholder: "Ejemplo: 100000"
    }
  ];

  const handleAspAnswer = (questionId: number, value: string) => {
    setAspirationalAnswers({ ...aspirationalAnswers, [questionId]: value });
  };

  const handleCompleteAsp = async () => {
    setIsSavingAsp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      // Si ya tiene net worth, marcar quiz como completado y redirigir a level-details
      if (hasNetWorthData) {
        const { error } = await supabase
          .from("profiles")
          .update({ level_quiz_completed: true })
          .eq("id", user.id);

        if (error) throw error;

        toast.success("¡Aspiraciones guardadas! Ahora puedes ver tu progreso de nivel");
        navigate("/level-details");
      } else {
        // Si no tiene net worth, redirigir al quiz de net worth
        toast.success("¡Aspiraciones guardadas! Ahora completa tu información financiera");
        navigate("/net-worth");
      }
    } catch (error: any) {
      console.error("Error saving aspirations:", error);
      toast.error("Error al guardar tus aspiraciones");
    } finally {
      setIsSavingAsp(false);
    }
  };

  const isAspComplete = Object.keys(aspirationalAnswers).length === aspirationalQuestions.length;
  const aspirationalProgress = (Object.keys(aspirationalAnswers).length / aspirationalQuestions.length) * 100;

  // Si está en la intro, mostrar página de bienvenida
  if (showIntro) {
    return (
      <div className="min-h-screen animated-wave-bg flex flex-col pb-20">
        {/* Header con flecha de regreso */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/20 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Contenido centrado */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          {/* Speech bubble */}
          <div className="relative mb-8">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 px-8 py-6 rounded-3xl">
              <p className="text-center text-xl font-bold text-foreground">
                ¡Hola! Soy Moni,<br />tu coach financiero
              </p>
            </Card>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-white/95"></div>
          </div>

          {/* Moni owl character */}
          <div className="relative">
            <div className="w-64 h-64 rounded-full flex items-center justify-center">
              <img 
                src={moniOwl} 
                alt="Moni" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 z-20">
          <Button
            onClick={() => setShowIntro(false)}
            className="w-full h-14 bg-white/95 hover:bg-white text-foreground font-bold text-lg rounded-[20px] shadow-xl hover:scale-[1.02] transition-all border border-blue-100"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  // Mostrar cuestionario aspiracional
  return (
    <div className="min-h-screen animated-wave-bg flex flex-col">
      {/* Header fijado */}
      <div className="sticky top-0 z-20 animated-wave-bg">
        {/* Botón de regreso y barra de progreso */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowIntro(true)}
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/20 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Barra de progreso */}
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${aspirationalProgress}%`,
                  background: 'linear-gradient(90deg, #8B7355 0%, #A0826D 50%, #8B7355 100%)',
                  boxShadow: '0 0 10px rgba(139, 115, 85, 0.5)'
                }}
              />
            </div>
          </div>

          {/* Moni y mensaje */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 flex-shrink-0">
              <img 
                src={moniAspirational} 
                alt="Moni" 
                className="w-full h-full object-contain"
              />
            </div>
            <Card className="flex-1 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 px-4 py-3 rounded-[20px]">
              <p className="text-xs font-bold text-foreground">
                Cuéntame las aspiraciones financieras que tienes para tu vida...
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Carrusel de frases financieras */}
          <FinancialQuotesCarousel />

          {/* Lista de preguntas */}
          {aspirationalQuestions.map((q) => {
            const Icon = q.icon;
            return (
              <div key={q.id}>
                {q.id === 1 && (
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={moniHouseAspiration} 
                      alt="Mi futura casa" 
                      className="w-16 h-16 object-contain flex-shrink-0"
                    />
                    <p className="text-base font-bold text-foreground">
                      Mi futura casa...
                    </p>
                  </div>
                )}
                <Card className="p-3 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 rounded-[20px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-3 w-3 text-primary flex-shrink-0" />
                    <h3 className="text-xs font-bold text-foreground">
                      {q.question}
                    </h3>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={q.placeholder}
                    value={aspirationalAnswers[q.id] || ""}
                    onChange={(e) => handleAspAnswer(q.id, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground"
                  />
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón continuar fijo abajo */}
      {isAspComplete && (
        <div className="fixed bottom-0 left-0 right-0 p-4 animated-wave-bg z-20">
          <Button
            onClick={handleCompleteAsp}
            disabled={isSavingAsp}
            className="w-full h-14 text-white font-bold text-lg rounded-[20px] shadow-2xl hover:scale-[1.05] active:scale-[0.98] transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #8B7355 0%, #A0826D 50%, #8B7355 100%)',
              boxShadow: '0 8px 25px rgba(139, 115, 85, 0.4), 0 0 20px rgba(160, 130, 109, 0.3)',
            }}
          >
            {isSavingAsp ? "Guardando..." : "Enviar cuestionario"}
          </Button>
        </div>
      )}
    </div>
  );
}