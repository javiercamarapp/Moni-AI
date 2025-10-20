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
import { cn } from "@/lib/utils";

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
      question: "¿Cuánto quieres tener en propiedades?",
      icon: Home,
      options: [
        { value: "0-500k", label: "Hasta $500,000" },
        { value: "500k-1m", label: "$500,000 - $1 millón" },
        { value: "1m-3m", label: "$1 - $3 millones" },
        { value: "3m+", label: "Más de $3 millones" }
      ]
    },
    {
      id: 2,
      question: "¿Cuánto quieres tener en vehículos?",
      icon: Car,
      options: [
        { value: "0-200k", label: "Hasta $200,000" },
        { value: "200k-500k", label: "$200,000 - $500,000" },
        { value: "500k-1m", label: "$500,000 - $1 millón" },
        { value: "1m+", label: "Más de $1 millón" }
      ]
    },
    {
      id: 3,
      question: "¿Cuánto quieres tener en ahorros?",
      icon: PiggyBank,
      options: [
        { value: "0-100k", label: "Hasta $100,000" },
        { value: "100k-500k", label: "$100,000 - $500,000" },
        { value: "500k-1m", label: "$500,000 - $1 millón" },
        { value: "1m+", label: "Más de $1 millón" }
      ]
    },
    {
      id: 4,
      question: "¿Cuánto quieres tener en inversiones?",
      icon: TrendingUp,
      options: [
        { value: "0-200k", label: "Hasta $200,000" },
        { value: "200k-500k", label: "$200,000 - $500,000" },
        { value: "500k-2m", label: "$500,000 - $2 millones" },
        { value: "2m+", label: "Más de $2 millones" }
      ]
    },
    {
      id: 5,
      question: "¿Cuántos viajes quieres hacer al año?",
      icon: Plane,
      options: [
        { value: "1-2", label: "1-2 viajes al año" },
        { value: "3-5", label: "3-5 viajes al año" },
        { value: "6-10", label: "6-10 viajes al año" },
        { value: "10+", label: "Más de 10 viajes al año" }
      ]
    },
    {
      id: 6,
      question: "¿Qué nivel de educación quieres para tu familia?",
      icon: GraduationCap,
      options: [
        { value: "basica", label: "Educación básica completa" },
        { value: "universidad", label: "Universidad completa" },
        { value: "posgrado", label: "Posgrados y especializaciones" },
        { value: "elite", label: "Instituciones de élite" }
      ]
    }
  ];

  const [aspirationalAnswers, setAspirationalAnswers] = useState<Record<number, string>>({});
  const [isSavingAsp, setIsSavingAsp] = useState(false);

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
              <p className="text-sm font-bold text-foreground">
                Te voy a ayudar a visualizar tus metas financieras!!
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Lista de preguntas */}
          {aspirationalQuestions.map((q) => {
            const Icon = q.icon;
            return (
              <Card key={q.id} className="p-5 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 rounded-[20px]">
                <h3 className="text-base font-bold text-foreground mb-4">
                  {q.question}
                </h3>
                <div className="space-y-2">
                  {q.options.map((option) => (
                    <Button
                      key={option.value}
                      variant={aspirationalAnswers[q.id] === option.value ? "default" : "outline"}
                      onClick={() => handleAspAnswer(q.id, option.value)}
                      className={cn(
                        "w-full justify-start text-left h-auto py-3 px-4 rounded-[15px] transition-all",
                        aspirationalAnswers[q.id] === option.value
                          ? "shadow-lg bg-primary text-primary-foreground"
                          : "hover:bg-primary/5 bg-white border-blue-100"
                      )}
                    >
                      <span className="flex-1 text-sm font-medium">{option.label}</span>
                      {aspirationalAnswers[q.id] === option.value && (
                        <CheckCircle2 className="h-4 w-4 ml-2 flex-shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              </Card>
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
            className="w-full h-14 text-white font-bold text-lg rounded-[20px] shadow-2xl hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 animate-pulse hover:animate-none"
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