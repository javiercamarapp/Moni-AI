import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import moniLogo from "@/assets/moni-ai-logo.png";
import { supabase } from "@/integrations/supabase/client";

export default function Subscribe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkTrialStatus();
      }
    });
  }, []);

  const checkTrialStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data) {
        setHasUsedTrial(data.has_used_trial || false);
      }
    } catch (error) {
      console.error("Error checking trial status:", error);
    }
  };

  const financialFacts = [
    "💡 Solo el 32% de mexicanos tiene educación financiera básica",
    "📊 68% de mexicanos no lleva un control de sus gastos mensuales",
    "💸 48% de los adultos en México no tiene ningún tipo de ahorro",
    "📉 7 de cada 10 mexicanos no tiene un presupuesto definido",
    "🏦 Solo 1 de cada 4 mexicanos planifica su retiro financiero"
  ];

  // Carrusel automático cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % financialFacts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Por favor inicia sesión para suscribirte");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Análisis financiero con IA avanzada",
    "Metas personales y grupales ilimitadas",
    "Predicciones de ahorro personalizadas",
    "Chat con Moni AI sin límites",
    "Score Moni en tiempo real",
    "Challenges diarios y recompensas XP",
    "Reportes detallados y gráficos",
    "Conexión bancaria segura",
  ];

  return (
    <div className="min-h-screen p-3 pb-20">
      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* Header con logo e insight carrusel */}
        <div className="p-2 flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden w-16 h-10 flex-shrink-0">
            <img src={moniLogo} alt="Moni AI" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 h-10 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentFactIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-[10px] text-black font-medium leading-tight italic"
              >
                {financialFacts[currentFactIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-lg bg-white rounded-3xl">
          <CardHeader className="pb-4 pt-6 px-6">
            {/* Título e icono en la misma línea */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-black text-left">
                Desbloquea Moni AI Premium
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-600 mt-3">
              Accede a todas las funcionalidades y lleva tu salud financiera al siguiente nivel
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pb-5 px-5">
            {/* Price */}
            <div className="text-center space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold text-black">$69</span>
                <span className="text-sm text-gray-600">MXN / mes</span>
              </div>
              <p className="text-xs font-semibold text-primary mb-1">
                🎁 7 días gratis de prueba
              </p>
              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Cancela cuando quieras
              </p>
            </div>

            {/* Features */}
            <div className="space-y-1.5">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent"
                >
                  <div className="flex-shrink-0 w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-[11px] font-medium text-black">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-11 rounded-2xl bg-white hover:bg-white/90 text-black border border-gray-200 shadow-md hover:shadow-lg transition-all font-semibold text-sm"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  {hasUsedTrial ? "Activar Suscripción Premium" : "Activar 7 Días Gratis de Prueba"}
                </>
              )}
            </Button>

            {/* Footer */}
            <p className="text-[9px] text-center text-gray-500">
              Al suscribirte aceptas nuestros{" "}
              <button className="underline hover:text-primary transition-colors">
                términos y condiciones
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            className="text-gray-600 text-xs transition-all hover:-translate-y-1 hover:bg-transparent hover:text-gray-600"
          >
            Continuar sin Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
