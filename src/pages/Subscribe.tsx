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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={moniLogo} alt="Moni AI" className="h-20 w-20 object-contain" />
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Desbloquea Moni AI Premium
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Accede a todas las funcionalidades y lleva tu salud financiera al siguiente nivel
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pb-8">
            {/* Price */}
            <div className="text-center space-y-2">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">$99</span>
                <span className="text-xl text-muted-foreground">MXN / mes</span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-primary" />
                Cancela cuando quieras
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              size="lg"
              className="w-full text-lg h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Activar Suscripción Premium
                </>
              )}
            </Button>

            {/* Footer */}
            <p className="text-xs text-center text-muted-foreground">
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
            className="text-muted-foreground hover:text-foreground"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
