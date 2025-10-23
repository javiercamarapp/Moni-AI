import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Home, Car, Wallet, Shield, LineChart, Bitcoin, Landmark, Briefcase, Building2, MapPin, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const aspirationalQuestions = [
  {
    id: 1,
    question: "¿Cuánto vale la casa en la quisieras vivir?",
    icon: Home,
    placeholder: "Ejemplo: 1000000"
  },
  {
    id: 8,
    question: "¿Quieres tener una segunda propiedad? ¿Cuánto costaría?",
    icon: Home,
    placeholder: "Ejemplo: 800000 (opcional)"
  },
  {
    id: 9,
    question: "¿Quieres tener propiedades de inversión (terrenos, departamentos o casas en renta)?",
    icon: Building2,
    placeholder: "Ejemplo: 1500000 (opcional)"
  },
  {
    id: 10,
    question: "¿Quieres tener terrenos u otros bienes raíces?",
    icon: MapPin,
    placeholder: "Ejemplo: 600000 (opcional)"
  },
  {
    id: 2,
    question: "¿Cuánto cuesta el coche de tus sueños?",
    icon: Car,
    placeholder: "Ejemplo: 500000"
  },
  {
    id: 7,
    question: "¿Cuánto cuesta el coche que quieres darle a tu cónyuge?",
    icon: Car,
    placeholder: "Ejemplo: 400000  (opcional)"
  },
  {
    id: 3,
    question: "¿Cuánto quieres tener en ahorros disponibles (cuentas bancarias)?",
    icon: Wallet,
    placeholder: "Ejemplo: 300000"
  },
  {
    id: 11,
    question: "¿Cuánto quieres tener en tu fondo de emergencia?",
    icon: Shield,
    placeholder: "Ejemplo: 150000 (opcional)"
  },
  {
    id: 4,
    question: "¿Cuánto quieres tener en inversiones en bolsa o fondos (indexados, ETFs, etc)?",
    icon: LineChart,
    placeholder: "Ejemplo: 800000"
  },
  {
    id: 12,
    question: "¿Cuánto quieres tener en criptomonedas?",
    icon: Bitcoin,
    placeholder: "Ejemplo: 200000 (opcional)"
  },
  {
    id: 13,
    question: "¿Cuánto quieres tener en aportaciones a retiro (AFORE, IRA, etc)?",
    icon: Landmark,
    placeholder: "Ejemplo: 500000 (opcional)"
  },
  {
    id: 14,
    question: "¿Cuánto quieres tener en participaciones en empresas o startups?",
    icon: Briefcase,
    placeholder: "Ejemplo: 400000 (opcional)"
  },
  {
    id: 15,
    question: "¿Cuántos vehículos extras quisieras tener? Valor total",
    icon: Car,
    placeholder: "Ejemplo: 300000 (opcional)"
  }
];

export default function EditAspirations() {
  const navigate = useNavigate();
  const [aspirationalAnswers, setAspirationalAnswers] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAspirations();
  }, []);

  const fetchAspirations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_aspirations")
        .select("*")
        .eq("user_id", user.id);

      if (data) {
        const answers: Record<number, string> = {};
        data.forEach(asp => {
          answers[asp.question_id] = asp.value.toString();
        });
        setAspirationalAnswers(answers);
      }
    } catch (error) {
      console.error("Error fetching aspirations:", error);
      toast.error("Error al cargar tus aspiraciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    const numericValue = value.replace(/,/g, '');
    setAspirationalAnswers({ ...aspirationalAnswers, [questionId]: numericValue });
  };

  const formatNumberWithCommas = (value: string) => {
    if (!value) return '';
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      // Validar que haya al menos 4 respuestas de las preguntas obligatorias
      const mandatoryQuestions = [1, 2, 3, 4];
      const answeredMandatory = mandatoryQuestions.filter(q => 
        aspirationalAnswers[q] && parseFloat(aspirationalAnswers[q]) > 0
      );

      if (answeredMandatory.length < 4) {
        toast.error("Por favor completa las 4 preguntas principales (Casa, Coche, Ahorros e Inversiones)");
        setIsSaving(false);
        return;
      }

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
        });

      if (aspirationsError) {
        throw aspirationsError;
      }

      toast.success("¡Aspiraciones actualizadas correctamente!");
      navigate(-1);
    } catch (error: any) {
      console.error("Error saving aspirations:", error);
      toast.error("Error al guardar tus aspiraciones");
    } finally {
      setIsSaving(false);
    }
  };

  const requiredQuestionsIds = [1, 2, 3, 4];
  const answeredRequiredQuestions = requiredQuestionsIds.filter(id => 
    aspirationalAnswers[id] && parseFloat(aspirationalAnswers[id]) > 0
  ).length;
  
  const isComplete = answeredRequiredQuestions === requiredQuestionsIds.length;

  if (isLoading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Editar tus aspiraciones
          </h1>
          <p className="text-foreground/70">
            Modifica tus metas financieras cuando lo necesites
          </p>
        </div>

        <div className="space-y-4">
          {aspirationalQuestions.map((q) => {
            const Icon = q.icon;
            const isRequired = requiredQuestionsIds.includes(q.id);
            
            return (
              <Card key={q.id} className="p-4 bg-white/95 backdrop-blur-sm shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      {q.question} {isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
                        $
                      </span>
                      <Input
                        type="text"
                        placeholder={q.placeholder}
                        value={formatNumberWithCommas(aspirationalAnswers[q.id] || '')}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value.replace(/,/g, ''))}
                        className="pl-7 text-right"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 sticky bottom-20 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
          <Button
            onClick={handleSave}
            disabled={!isComplete || isSaving}
            className="w-full"
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
