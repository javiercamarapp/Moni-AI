import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Home, Car, Wallet, Shield, LineChart, Bitcoin, Landmark, Briefcase, Building2, MapPin, Save, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import moniHouseAspiration from "@/assets/moni-house-aspiration.png";
import moniCarAspiration from "@/assets/moni-car-aspiration.png";
import moniSavings from "@/assets/moni-savings.png";

const aspirationalQuestions = [
  {
    id: 1,
    question: "¿Cuánto vale la casa en la quisieras vivir?",
    icon: Home,
    placeholder: "Ejemplo: 1000000",
    group: "realestate"
  },
  {
    id: 8,
    question: "¿Quieres tener una segunda propiedad? ¿Cuánto costaría?",
    icon: Home,
    placeholder: "Ejemplo: 800000 (opcional)",
    group: "realestate"
  },
  {
    id: 9,
    question: "¿Quieres tener propiedades de inversión (terrenos, departamentos o casas en renta)?",
    icon: Building2,
    placeholder: "Ejemplo: 1500000 (opcional)",
    group: "realestate"
  },
  {
    id: 10,
    question: "¿Quieres tener terrenos u otros bienes raíces?",
    icon: MapPin,
    placeholder: "Ejemplo: 600000 (opcional)",
    group: "realestate"
  },
  {
    id: 2,
    question: "¿Cuánto cuesta el coche de tus sueños?",
    icon: Car,
    placeholder: "Ejemplo: 500000",
    group: "vehicles"
  },
  {
    id: 7,
    question: "¿Cuánto cuesta el coche que quieres darle a tu cónyuge?",
    icon: Car,
    placeholder: "Ejemplo: 400000  (opcional)",
    group: "vehicles"
  },
  {
    id: 15,
    question: "¿Cuántos vehículos extras quisieras tener? Valor total",
    icon: Car,
    placeholder: "Ejemplo: 300000 (opcional)",
    group: "vehicles"
  },
  {
    id: 3,
    question: "¿Cuánto quieres tener en ahorros disponibles (cuentas bancarias)?",
    icon: Wallet,
    placeholder: "Ejemplo: 300000",
    group: "investments"
  },
  {
    id: 11,
    question: "¿Cuánto quieres tener en tu fondo de emergencia?",
    icon: Shield,
    placeholder: "Ejemplo: 150000 (opcional)",
    group: "investments"
  },
  {
    id: 4,
    question: "¿Cuánto quieres tener en inversiones en bolsa o fondos (indexados, ETFs, etc)?",
    icon: LineChart,
    placeholder: "Ejemplo: 800000",
    group: "investments"
  },
  {
    id: 12,
    question: "¿Cuánto quieres tener en criptomonedas?",
    icon: Bitcoin,
    placeholder: "Ejemplo: 200000 (opcional)",
    group: "investments"
  },
  {
    id: 13,
    question: "¿Cuánto quieres tener en aportaciones a retiro (AFORE, IRA, etc)?",
    icon: Landmark,
    placeholder: "Ejemplo: 500000 (opcional)",
    group: "investments"
  },
  {
    id: 14,
    question: "¿Cuánto quieres tener en participaciones en empresas o startups?",
    icon: Briefcase,
    placeholder: "Ejemplo: 400000 (opcional)",
    group: "investments"
  }
];

interface CustomAspiration {
  id?: string;
  name: string;
  description: string;
  amount: string;
}

export default function EditAspirations() {
  const navigate = useNavigate();
  const [aspirationalAnswers, setAspirationalAnswers] = useState<Record<number, string>>({});
  const [customAspirations, setCustomAspirations] = useState<CustomAspiration[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch standard aspirations
      const { data: aspirations } = await supabase
        .from("user_aspirations")
        .select("*")
        .eq("user_id", user.id);

      if (aspirations) {
        const answers: Record<number, string> = {};
        aspirations.forEach(asp => {
          answers[asp.question_id] = asp.value.toString();
        });
        setAspirationalAnswers(answers);
      }

      // Fetch custom aspirations
      const { data: custom } = await supabase
        .from("custom_aspirations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (custom) {
        setCustomAspirations(custom.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          amount: c.amount.toString()
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const addCustomAspiration = () => {
    setCustomAspirations([...customAspirations, { name: "", description: "", amount: "" }]);
  };

  const updateCustomAspiration = (index: number, field: keyof CustomAspiration, value: string) => {
    const updated = [...customAspirations];
    updated[index] = { ...updated[index], [field]: value };
    setCustomAspirations(updated);
  };

  const removeCustomAspiration = (index: number) => {
    const updated = customAspirations.filter((_, i) => i !== index);
    setCustomAspirations(updated);
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

      // Save standard aspirations
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

      // Delete all existing custom aspirations
      await supabase
        .from("custom_aspirations")
        .delete()
        .eq("user_id", user.id);

      // Save new custom aspirations
      const validCustom = customAspirations.filter(c => 
        c.name.trim() && c.amount && parseFloat(c.amount) > 0
      );

      if (validCustom.length > 0) {
        const customToSave = validCustom.map(c => ({
          user_id: user.id,
          name: c.name.trim(),
          description: c.description.trim(),
          amount: parseFloat(c.amount)
        }));

        const { error: customError } = await supabase
          .from("custom_aspirations")
          .insert(customToSave);

        if (customError) {
          throw customError;
        }
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

  const realestateQuestions = aspirationalQuestions.filter(q => q.group === "realestate");
  const vehiclesQuestions = aspirationalQuestions.filter(q => q.group === "vehicles");
  const investmentsQuestions = aspirationalQuestions.filter(q => q.group === "investments");

  return (
    <div className="min-h-screen animated-wave-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm mb-6">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <h1 className="text-2xl font-bold text-foreground">
              Editar aspiraciones
            </h1>
          </div>
          <p className="text-sm text-foreground/70">
            Modifica tus metas financieras cuando lo necesites
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">

        <div className="space-y-6">
          {/* Bienes Raíces */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={moniHouseAspiration} 
                alt="Bienes raíces" 
                className="w-16 h-16 object-contain flex-shrink-0"
              />
              <p className="text-base font-bold text-foreground">
                Bienes raíces
              </p>
            </div>
            <Card className="p-6 bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl border border-gray-200/50 rounded-3xl space-y-5 transition-all duration-300">
              {realestateQuestions.map((q, idx) => {
                const Icon = q.icon;
                const isRequired = requiredQuestionsIds.includes(q.id);
                
                return (
                  <div key={q.id} className={idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <Label className="text-sm font-semibold text-foreground">
                        {q.question} {isRequired && <span className="text-red-500">*</span>}
                      </Label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 text-sm">
                        $
                      </span>
                      <Input
                        type="text"
                        placeholder={q.placeholder}
                        value={formatNumberWithCommas(aspirationalAnswers[q.id] || '')}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value.replace(/,/g, ''))}
                        className="pl-7 text-sm rounded-2xl border border-gray-200/50 bg-gray-50/50 focus:bg-white transition-colors duration-200"
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Vehículos */}
          <div>
            <div className="flex flex-row-reverse items-center gap-3 mb-4">
              <img 
                src={moniCarAspiration} 
                alt="Vehículos" 
                className="w-16 h-16 object-contain flex-shrink-0"
              />
              <p className="text-base font-bold text-foreground text-right">
                Vehículos
              </p>
            </div>
            <Card className="p-6 bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl border border-gray-200/50 rounded-3xl space-y-5 transition-all duration-300">
              {vehiclesQuestions.map((q, idx) => {
                const Icon = q.icon;
                const isRequired = requiredQuestionsIds.includes(q.id);
                
                return (
                  <div key={q.id} className={idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <Label className="text-sm font-semibold text-foreground">
                        {q.question} {isRequired && <span className="text-red-500">*</span>}
                      </Label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 text-sm">
                        $
                      </span>
                      <Input
                        type="text"
                        placeholder={q.placeholder}
                        value={formatNumberWithCommas(aspirationalAnswers[q.id] || '')}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value.replace(/,/g, ''))}
                        className="pl-7 text-sm rounded-2xl border border-gray-200/50 bg-gray-50/50 focus:bg-white transition-colors duration-200"
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Inversiones */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={moniSavings} 
                alt="Inversiones" 
                className="w-16 h-16 object-contain flex-shrink-0"
              />
              <p className="text-base font-bold text-foreground">
                Inversiones y dinero líquido
              </p>
            </div>
            <Card className="p-6 bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl border border-gray-200/50 rounded-3xl space-y-5 transition-all duration-300">
              {investmentsQuestions.map((q, idx) => {
                const Icon = q.icon;
                const isRequired = requiredQuestionsIds.includes(q.id);
                
                return (
                  <div key={q.id} className={idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <Label className="text-sm font-semibold text-foreground">
                        {q.question} {isRequired && <span className="text-red-500">*</span>}
                      </Label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 text-sm">
                        $
                      </span>
                      <Input
                        type="text"
                        placeholder={q.placeholder}
                        value={formatNumberWithCommas(aspirationalAnswers[q.id] || '')}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value.replace(/,/g, ''))}
                        className="pl-7 text-sm rounded-2xl border border-gray-200/50 bg-gray-50/50 focus:bg-white transition-colors duration-200"
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Otras Aspiraciones */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Otras aspiraciones
              </h2>
              <Button
                onClick={addCustomAspiration}
                size="sm"
                variant="outline"
                className="rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 transition-all duration-300 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar
              </Button>
            </div>

            <div className="space-y-3">
              {customAspirations.map((custom, index) => (
                <Card key={index} className="p-6 bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl border border-gray-200/50 rounded-3xl transition-all duration-300">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-foreground/70 mb-1 block">
                        Nombre
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ej: Casa de playa"
                        value={custom.name}
                        onChange={(e) => updateCustomAspiration(index, "name", e.target.value)}
                        className="text-sm rounded-2xl border border-gray-200/50 bg-gray-50/50 focus:bg-white transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-foreground/70 mb-1 block">
                        ¿Qué es?
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ej: Propiedad para rentar en zona turística"
                        value={custom.description}
                        onChange={(e) => updateCustomAspiration(index, "description", e.target.value)}
                        className="text-sm rounded-2xl border border-gray-200/50 bg-gray-50/50 focus:bg-white transition-colors duration-200"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-foreground/70 mb-1 block">
                          Monto
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 text-sm">
                            $
                          </span>
                          <Input
                            type="text"
                            placeholder="50000"
                            value={formatNumberWithCommas(custom.amount)}
                            onChange={(e) => updateCustomAspiration(index, "amount", e.target.value.replace(/,/g, ''))}
                            className="pl-7 text-sm rounded-2xl border border-gray-200/50 bg-gray-50/50 focus:bg-white transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => removeCustomAspiration(index)}
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {customAspirations.length === 0 && (
                <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 rounded-[20px] text-center">
                  <p className="text-sm text-foreground/60">
                    No hay aspiraciones personalizadas aún.
                    <br />
                    Presiona "Agregar" para crear una.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-20">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSave}
              disabled={!isComplete || isSaving}
              className="w-full h-12 bg-white rounded-[20px] shadow-xl border border-blue-100 text-foreground hover:bg-gray-50 text-base font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              size="lg"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}