import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

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
      const updateResponse: any = await supabase
        .from("profiles")
        .update({ level_quiz_completed: true } as any)
        .eq("user_id", user.id);

      if (updateResponse.error) throw updateResponse.error;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quiz de Nivel</h1>
            <p className="text-sm text-muted-foreground">
              Responde estas preguntas para personalizar tu experiencia
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progreso</span>
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} de {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">
            {questions[currentQuestion].question}
          </h2>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <Button
                key={index}
                variant={answers[questions[currentQuestion].id] === option ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-4 px-6"
                onClick={() => handleAnswer(option)}
              >
                <span className="flex-1">{option}</span>
                {answers[questions[currentQuestion].id] === option && (
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                )}
              </Button>
            ))}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="flex-1"
            >
              Anterior
            </Button>
          )}
          {isQuizComplete && (
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1"
            >
              {isCompleting ? "Guardando..." : "Completar Quiz"}
            </Button>
          )}
        </div>

        {/* Answers Summary */}
        <div className="mt-8 p-4 bg-card rounded-lg border">
          <h3 className="text-sm font-medium mb-3">Tus respuestas:</h3>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="text-sm">
                <span className="text-muted-foreground">Pregunta {idx + 1}: </span>
                <span className={answers[q.id] ? "text-foreground" : "text-muted-foreground"}>
                  {answers[q.id] || "Sin responder"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}