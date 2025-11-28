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
    <div className="page-standard min-h-screen bg-[hsl(48,25%,92%)] p-3 pb-20">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Header con logo e insight */}
        <div className="p-2 flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden w-16 h-10 flex-shrink-0">
            <img src={moniLogo} alt="Moni AI" className="w-full h-full object-cover" />
          </div>
          <p className="text-[10px] text-black font-medium leading-tight italic flex-1">
            📊 68% de mexicanos no lleva un control de sus gastos mensuales
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-lg bg-white rounded-3xl">
          <CardHeader className="pb-4 pt-6 px-6">
            {/* Título e icono en la misma línea */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <CardTitle className="text-xl font-bold text-black text-left">
                Tu suscripción ha expirado
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-600 mt-3">
              Renueva tu plan para continuar usando todas las funcionalidades de Moni AI
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pb-6 px-6">
            {/* Benefits reminder */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-2xl p-3 space-y-2">
              <p className="text-xs font-medium flex items-center gap-2 text-black">
                <Crown className="w-3 h-3 text-primary" />
                Con tu suscripción activa tendrás:
              </p>
              <ul className="text-[11px] text-gray-600 space-y-1 ml-5 list-disc">
                <li>Análisis financiero ilimitado con IA</li>
                <li>Metas y seguimiento personalizado</li>
                <li>Acceso completo a tu Score Moni</li>
                <li>Challenges y recompensas diarias</li>
              </ul>
            </div>

            {/* Price */}
            <div className="text-center space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold text-black">$99</span>
                <span className="text-base text-gray-600">MXN / mes</span>
              </div>
            </div>

            {/* Renew Button */}
            <Button
              onClick={handleRenew}
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-white hover:bg-white/90 text-black border border-gray-200 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renovar Suscripción
                </>
              )}
            </Button>

            {/* Check Status */}
            <Button
              onClick={handleCheckStatus}
              variant="outline"
              className="w-full h-11 rounded-2xl border-gray-200 text-black hover:bg-gray-50"
            >
              Ya renové, verificar estado
            </Button>

            <p className="text-[10px] text-center text-gray-500">
              Si acabas de realizar el pago, espera 1-2 minutos y verifica tu estado
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
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
