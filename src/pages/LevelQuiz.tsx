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
      <div className="min-h-screen bg-[#1f2937] flex flex-col">
        {/* Header con flecha de regreso */}
        <div className="p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white hover:bg-transparent"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>

        {/* Contenido centrado */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
          {/* Speech bubble */}
          <div className="relative mb-8">
            <div className="bg-[#374151] text-white px-8 py-4 rounded-2xl text-center text-xl font-medium">
              ¡Hola! Soy Moni,<br />tu coach financiero
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#374151]"></div>
          </div>

          {/* Moni owl character */}
          <div className="relative">
            <div className="w-48 h-48 rounded-full bg-[#374151] flex items-center justify-center">
              <img 
                src={moniOwl} 
                alt="Moni" 
                className="w-40 h-40 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-8">
          <Button
            onClick={() => setShowIntro(false)}
            className="w-full h-14 bg-[#58cc02] hover:bg-[#4caf00] text-[#1f2937] font-bold text-lg rounded-2xl uppercase tracking-wide shadow-lg"
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
        {/* Botón de regreso */}
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
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Título y descripción */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quiz de Nivel</h1>
          <p className="text-muted-foreground">
            Responde estas preguntas para personalizar tu experiencia
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-6 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-foreground">Progreso del Quiz</span>
            <span className="text-sm font-bold text-primary">
              {currentQuestion + 1} de {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </Card>

        {/* Question Card */}
        <Card className="p-8 mb-6 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100">
          <div className="mb-6">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              Pregunta {currentQuestion + 1}
            </span>
            <h2 className="text-2xl font-bold text-foreground mt-2">
              {questions[currentQuestion].question}
            </h2>
          </div>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <Button
                key={index}
                variant={answers[questions[currentQuestion].id] === option ? "default" : "outline"}
                className={`w-full justify-start text-left h-auto py-4 px-6 transition-all hover:scale-[1.02] ${
                  answers[questions[currentQuestion].id] === option 
                    ? "shadow-lg" 
                    : "hover:bg-primary/5"
                }`}
                onClick={() => handleAnswer(option)}
              >
                <span className="flex-1 font-medium">{option}</span>
                {answers[questions[currentQuestion].id] === option && (
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                )}
              </Button>
            ))}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mb-6">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="flex-1 h-12 font-semibold hover:scale-105 transition-all shadow-md"
            >
              ← Anterior
            </Button>
          )}
          {isQuizComplete && (
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1 h-12 font-semibold hover:scale-105 transition-all shadow-lg"
            >
              {isCompleting ? "Guardando..." : "Completar Quiz ✓"}
            </Button>
          )}
        </div>

        {/* Answers Summary */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            📋 Resumen de Respuestas
          </h3>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{q.question}</p>
                  <p className={`text-sm font-semibold ${answers[q.id] ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {answers[q.id] || "Sin responder"}
                  </p>
                </div>
                {answers[q.id] && (
                  <CheckCircle2 className="flex-shrink-0 h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}