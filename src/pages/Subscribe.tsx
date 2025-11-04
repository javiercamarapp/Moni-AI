import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import moniLogo from "@/assets/moni-ai-logo.png";

export default function Subscribe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Aquí se integrará Stripe
      toast.info("La integración de pagos se configurará próximamente");
      // Simular proceso de pago por ahora
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
      toast.error("Error al procesar el pago");
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
    <div className="min-h-screen bg-background p-3 pb-20">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Header con logo - igual que el dashboard */}
        <div className="p-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden w-16 h-10">
            <img src={moniLogo} alt="Moni AI" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-lg bg-white rounded-3xl">
          <CardHeader className="text-center space-y-3 pb-4 pt-6">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-black">
              Desbloquea Moni AI Premium
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Accede a todas las funcionalidades y lleva tu salud financiera al siguiente nivel
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pb-6 px-6">
            {/* Price */}
            <div className="text-center space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-black">$99</span>
                <span className="text-base text-gray-600">MXN / mes</span>
              </div>
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Cancela cuando quieras
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent"
                >
                  <div className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-black">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-white hover:bg-white/90 text-black border border-gray-200 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Activar Suscripción Premium
                </>
              )}
            </Button>

            {/* Footer */}
            <p className="text-[10px] text-center text-gray-500">
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
            onClick={() => navigate("/auth")}
            className="text-gray-600 hover:text-black text-sm"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
