import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Crown } from "lucide-react";
import { toast } from "sonner";
import moniLogo from "@/assets/moni-ai-logo.png";

export default function Expired() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    setLoading(true);
    try {
      // Aquí se integrará Stripe para renovación
      toast.info("La integración de pagos se configurará próximamente");
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Error al renovar suscripción:", error);
      toast.error("Error al procesar la renovación");
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    toast.info("Verificando estado de suscripción...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={moniLogo} alt="Moni AI" className="h-20 w-20 object-contain" />
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Tu suscripción ha expirado
            </CardTitle>
            <CardDescription className="text-base">
              Renueva tu plan para continuar usando todas las funcionalidades de Moni AI
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Benefits reminder */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                Con tu suscripción activa tendrás:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Análisis financiero ilimitado con IA</li>
                <li>Metas y seguimiento personalizado</li>
                <li>Acceso completo a tu Score Moni</li>
                <li>Challenges y recompensas diarias</li>
              </ul>
            </div>

            {/* Price */}
            <div className="text-center space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-lg text-muted-foreground">MXN / mes</span>
              </div>
            </div>

            {/* Renew Button */}
            <Button
              onClick={handleRenew}
              disabled={loading}
              size="lg"
              className="w-full text-lg h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Renovar Suscripción
                </>
              )}
            </Button>

            {/* Check Status */}
            <Button
              onClick={handleCheckStatus}
              variant="outline"
              size="lg"
              className="w-full rounded-2xl"
            >
              Ya renové, verificar estado
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Si acabas de realizar el pago, espera 1-2 minutos y verifica tu estado
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
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
