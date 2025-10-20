import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import moniOwl from "@/assets/moni-owl.png";

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      // Actualizar el perfil marcando el quiz como completado
      const { error } = await supabase
        .from("profiles")
        .update({ level_quiz_completed: true })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("¡Quiz completado! Ahora puedes ver tu progreso de nivel");
      navigate("/level-details");
    } catch (error: any) {
      console.error("Error completing quiz:", error);
      toast.error("Error al guardar tus respuestas");
    } finally {
      setIsCompleting(false);
    }
  };

  const isQuizComplete = Object.keys(answers).length === questions.length;

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
            <Card className="w-52 h-52 rounded-full bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 flex items-center justify-center p-4">
              <img 
                src={moniOwl} 
                alt="Moni" 
                className="w-44 h-44 object-contain"
              />
            </Card>
          </div>
        </div>

        {/* Continue button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm">
          <Button
            onClick={() => setShowIntro(false)}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-[20px] shadow-xl hover:scale-[1.02] transition-all"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header superior con botón de regreso */}
      <div className="p-2 flex justify-start items-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="bg-white rounded-[20px] shadow-xl hover:bg-white/20 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Contenido principal */}
      <div className="max-w-2xl mx-auto px-4 pt-2">
        {/* Título y descripción */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Quiz de Nivel</h1>
          <p className="text-sm text-muted-foreground">
            Responde estas preguntas para personalizar tu experiencia
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="p-4 mb-4 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 rounded-[20px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-foreground">Progreso del Quiz</span>
            <span className="text-xs font-bold text-primary">
              {currentQuestion + 1} de {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Question Card */}
        <Card className="p-6 mb-4 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 rounded-[20px]">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Pregunta {currentQuestion + 1}
            </span>
            <h2 className="text-xl font-bold text-foreground mt-2">
              {questions[currentQuestion].question}
            </h2>
          </div>
          <div className="space-y-2">
            {questions[currentQuestion].options.map((option, index) => (
              <Button
                key={index}
                variant={answers[questions[currentQuestion].id] === option ? "default" : "outline"}
                className={`w-full justify-start text-left h-auto py-3 px-5 rounded-[15px] transition-all hover:scale-[1.02] font-medium text-sm ${
                  answers[questions[currentQuestion].id] === option 
                    ? "shadow-lg bg-primary text-primary-foreground" 
                    : "hover:bg-primary/5 bg-white border-blue-100"
                }`}
                onClick={() => handleAnswer(option)}
              >
                <span className="flex-1">{option}</span>
                {answers[questions[currentQuestion].id] === option && (
                  <CheckCircle2 className="h-4 w-4 ml-2 flex-shrink-0" />
                )}
              </Button>
            ))}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mb-4">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="flex-1 h-12 font-bold rounded-[20px] hover:scale-[1.02] transition-all shadow-md border-blue-100 bg-white text-foreground"
            >
              ← Anterior
            </Button>
          )}
          {isQuizComplete && (
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1 h-12 font-bold rounded-[20px] hover:scale-[1.02] transition-all shadow-xl bg-primary text-primary-foreground"
            >
              {isCompleting ? "Guardando..." : "Completar Quiz ✓"}
            </Button>
          )}
        </div>

        {/* Answers Summary */}
        <Card className="p-5 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 rounded-[20px]">
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            📋 Resumen de Respuestas
          </h3>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-3 p-3 rounded-[15px] bg-secondary/10 border border-blue-50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">{q.question}</p>
                  <p className={`text-xs font-bold ${answers[q.id] ? "text-foreground" : "text-muted-foreground/40"}`}>
                    {answers[q.id] || "Sin responder"}
                  </p>
                </div>
                {answers[q.id] && (
                  <CheckCircle2 className="flex-shrink-0 h-4 w-4 text-primary mt-0.5" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}