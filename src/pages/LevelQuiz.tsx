import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Home, Car, PiggyBank, TrendingUp, Plane, GraduationCap, Building2, MapPin, Wallet, Shield, LineChart, Bitcoin, Landmark, Briefcase } from "lucide-react";
import moniOwl from "@/assets/moni-owl-circle.png";
import { useHasNetWorthData } from "@/hooks/useNetWorth";
import moniAspirational from "@/assets/moni-aspirational.png";
import moniHouseAspiration from "@/assets/moni-house-aspiration.png";
import moniCarAspiration from "@/assets/moni-car-aspiration.png";
import moniSavings from "@/assets/moni-savings.png";
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
  const [isCheckingAspirations, setIsCheckingAspirations] = useState(true);
  const { data: hasNetWorthData, isLoading: checkingNetWorth } = useHasNetWorthData();

  // Verificar si el usuario ya tiene aspiraciones guardadas
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

        // Si ya tiene aspiraciones guardadas, redirigir al análisis
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

  // Verificar estado de net worth antes de mostrar el quiz
  if (checkingNetWorth || isCheckingAspirations) {
    return null;
  }

  // Cuestionario aspiracional
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

  const handleAspAnswer = (questionId: number, value: string) => {
    // Remover comas para guardar el valor numérico
    const numericValue = value.replace(/,/g, '');
    setAspirationalAnswers({ ...aspirationalAnswers, [questionId]: numericValue });
  };

  const formatNumberWithCommas = (value: string) => {
    if (!value) return '';
    // Formatear con comas cada 3 dígitos
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleCompleteAsp = async () => {
    setIsSavingAsp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      console.log("Aspirational answers:", aspirationalAnswers);

      // Validar que haya al menos 4 respuestas de las preguntas obligatorias
      const mandatoryQuestions = [1, 2, 3, 4]; // Casa, Coche, Ahorros, Inversiones
      const answeredMandatory = mandatoryQuestions.filter(q => 
        aspirationalAnswers[q] && parseFloat(aspirationalAnswers[q]) > 0
      );

      if (answeredMandatory.length < 4) {
        toast.error("Por favor completa las 4 preguntas principales (Casa, Coche, Ahorros e Inversiones)");
        setIsSavingAsp(false);
        return;
      }

      // Guardar aspiraciones en la base de datos
      const aspirationsToSave = Object.entries(aspirationalAnswers)
        .filter(([_, value]) => value && parseFloat(value) > 0) // Solo guardar valores válidos
        .map(([questionId, value]) => ({
          user_id: user.id,
          question_id: parseInt(questionId),
          value: parseFloat(value)
        }));

      console.log("Saving aspirations:", aspirationsToSave);

      // Usar upsert para insertar o actualizar
      const { data: insertedData, error: aspirationsError } = await supabase
        .from("user_aspirations")
        .upsert(aspirationsToSave, { 
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false 
        })
        .select();

      console.log("Insert result:", { data: insertedData, error: aspirationsError });

      if (aspirationsError) {
        console.error("Error inserting aspirations:", aspirationsError);
        throw aspirationsError;
      }

      // Marcar quiz como completado
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ level_quiz_completed: true })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }

      // Si ya tiene net worth, redirigir al análisis de aspiraciones
      if (hasNetWorthData) {
        toast.success("¡Aspiraciones guardadas! Ahora veamos tu análisis");
        navigate("/aspirations-analysis");
      } else {
        // Si no tiene net worth, redirigir al cuestionario inicial de patrimonio
        toast.success("¡Aspiraciones guardadas! Ahora completa tu información financiera");
        navigate("/initial-net-worth");
      }
    } catch (error: any) {
      console.error("Error saving aspirations:", error);
      toast.error("Error al guardar tus aspiraciones: " + (error.message || "Error desconocido"));
    } finally {
      setIsSavingAsp(false);
    }
  };

  // Solo las preguntas obligatorias (1, 2, 3, 4) son requeridas
  const requiredQuestionsIds = [1, 2, 3, 4];
  const answeredRequiredQuestions = requiredQuestionsIds.filter(id => 
    aspirationalAnswers[id] && parseFloat(aspirationalAnswers[id]) > 0
  ).length;
  
  const isAspComplete = answeredRequiredQuestions === requiredQuestionsIds.length;
  
  // La barra de progreso solo considera las preguntas obligatorias
  const aspirationalProgress = (answeredRequiredQuestions / requiredQuestionsIds.length) * 100;

  // Si está en la intro, mostrar página de bienvenida
  if (showIntro) {
    return (
      <div className="page-standard min-h-screen flex flex-col pb-20">
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
    <div className="page-standard min-h-screen flex flex-col">
      {/* Header fijado */}
      <div className="sticky top-0 z-20">
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
            // Filtrar preguntas que se mostrarán dentro de sus respectivos cards
            if (q.id === 4 || q.id === 5 || q.id === 6 || q.id === 7 || q.id === 8 || q.id === 9 || q.id === 10 || q.id === 11 || q.id === 12 || q.id === 13 || q.id === 14 || q.id === 15) return null;
            
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
                      Bienes raíces
                    </p>
                  </div>
                )}
                {q.id === 2 && (
                  <div className="flex flex-row-reverse items-center gap-3 mb-4">
                    <img 
                      src={moniCarAspiration} 
                      alt="El coche de mis sueños" 
                      className="w-16 h-16 object-contain flex-shrink-0"
                    />
                    <p className="text-base font-bold text-foreground text-right">
                      Vehículos
                    </p>
                  </div>
                )}
                {q.id === 3 && (
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={moniSavings} 
                      alt="Mi caja de ahorros" 
                      className="w-16 h-16 object-contain flex-shrink-0"
                    />
                    <p className="text-base font-bold text-foreground">
                      Inversiones y dinero líquido
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
                  {/* Input con signo de pesos para valores monetarios */}
                  {q.id !== 5 ? (
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={q.placeholder}
                        value={formatNumberWithCommas(aspirationalAnswers[q.id] || "")}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleAspAnswer(q.id, value);
                        }}
                        className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={q.placeholder}
                      value={aspirationalAnswers[q.id] || ""}
                      onChange={(e) => handleAspAnswer(q.id, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground"
                    />
                  )}
                  
                  {/* Preguntas adicionales para inversiones dentro del mismo card */}
                  {q.id === 3 && (() => {
                    const stocksQuestion = aspirationalQuestions.find(sq => sq.id === 4);
                    const emergencyFundQuestion = aspirationalQuestions.find(sq => sq.id === 11);
                    const cryptoQuestion = aspirationalQuestions.find(sq => sq.id === 12);
                    const retirementQuestion = aspirationalQuestions.find(sq => sq.id === 13);
                    const startupQuestion = aspirationalQuestions.find(sq => sq.id === 14);
                    
                    return (
                      <>
                        {stocksQuestion && (() => {
                          const StocksIcon = stocksQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <StocksIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {stocksQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={stocksQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[4] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(4, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                        
                        {emergencyFundQuestion && (() => {
                          const EmergencyIcon = emergencyFundQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <EmergencyIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {emergencyFundQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={emergencyFundQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[11] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(11, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                        
                        {cryptoQuestion && (() => {
                          const CryptoIcon = cryptoQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <CryptoIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {cryptoQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={cryptoQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[12] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(12, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                        
                        {retirementQuestion && (() => {
                          const RetirementIcon = retirementQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <RetirementIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {retirementQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={retirementQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[13] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(13, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                        
                        {startupQuestion && (() => {
                          const StartupIcon = startupQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <StartupIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {startupQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={startupQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[14] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(14, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}
                  
                  {/* Pregunta adicional para segunda propiedad dentro del mismo card */}
                  {q.id === 1 && (() => {
                    const secondHomeQuestion = aspirationalQuestions.find(sq => sq.id === 8);
                    const investmentPropertyQuestion = aspirationalQuestions.find(sq => sq.id === 9);
                    const landPropertyQuestion = aspirationalQuestions.find(sq => sq.id === 10);
                    
                    return (
                      <>
                        {secondHomeQuestion && (() => {
                          const SecondHomeIcon = secondHomeQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <SecondHomeIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {secondHomeQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={secondHomeQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[8] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(8, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                        
                        {investmentPropertyQuestion && (() => {
                          const InvestmentIcon = investmentPropertyQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <InvestmentIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {investmentPropertyQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={investmentPropertyQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[9] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(9, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                        
                        {landPropertyQuestion && (() => {
                          const LandIcon = landPropertyQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <LandIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {landPropertyQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={landPropertyQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[10] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(10, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}
                  
                  {/* Pregunta adicional para el cónyuge dentro del mismo card */}
                  {q.id === 2 && (() => {
                    const spouseCarQuestion = aspirationalQuestions.find(sq => sq.id === 7);
                    const extraVehiclesQuestion = aspirationalQuestions.find(sq => sq.id === 15);
                    
                    return (
                      <>
                        {spouseCarQuestion && (() => {
                          const SpouseIcon = spouseCarQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <SpouseIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {spouseCarQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={spouseCarQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[7] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(7, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                        
                        {extraVehiclesQuestion && (() => {
                          const ExtraVehiclesIcon = extraVehiclesQuestion.icon;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <ExtraVehiclesIcon className="h-3 w-3 text-primary flex-shrink-0" />
                                <h3 className="text-xs font-bold text-foreground">
                                  {extraVehiclesQuestion.question}
                                </h3>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={extraVehiclesQuestion.placeholder}
                                  value={formatNumberWithCommas(aspirationalAnswers[15] || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleAspAnswer(15, value);
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 text-xs rounded-[15px] border border-blue-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white text-foreground placeholder:text-muted-foreground/60"
                                />
                              </div>
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón continuar fijo abajo */}
      {isAspComplete && (
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 z-20 bg-gradient-to-t from-white/95 via-white/80 to-transparent">
          <Button
            onClick={handleCompleteAsp}
            disabled={isSavingAsp}
            className="w-full h-12 bg-white/95 hover:bg-white text-foreground font-bold text-base rounded-[20px] shadow-xl hover:scale-[1.02] transition-all border border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingAsp ? "Guardando..." : "Enviar cuestionario"}
          </Button>
        </div>
      )}
    </div>
  );
}