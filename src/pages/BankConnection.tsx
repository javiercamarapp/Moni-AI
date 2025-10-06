import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function BankConnection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    loadConnections(user.id);
  };

  const loadConnections = async (userId: string) => {
    const { data } = await supabase
      .from("bank_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    setConnections(data || []);
  };

  const handleConnectBank = async () => {
    setLoading(true);
    try {
      // En producción, aquí se integraría Plaid Link
      toast({
        title: "Próximamente",
        description: "La conexión bancaria estará disponible pronto. Por ahora puedes usar WhatsApp para registrar transacciones.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-wave-bg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header con opción de saltar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-foreground hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">¡Haz tu vida más fácil!</h1>
              <p className="text-muted-foreground">Conecta tu banco y automatiza todo</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            Saltar por ahora
          </Button>
        </div>

        {/* Hero Card con beneficios */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center space-y-6">
            <div className="text-6xl">🤖</div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Moni se encarga de todo por ti
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Conecta tu banco una vez y olvídate de registrar transacciones manualmente. Moni hace todo el trabajo por ti.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex gap-3 items-start">
                <div className="text-2xl">⚡</div>
                <div>
                  <h4 className="font-semibold text-foreground">Detección Instantánea</h4>
                  <p className="text-sm text-muted-foreground">
                    Te notificamos al momento de cada transacción
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <div className="text-2xl">🧠</div>
                <div>
                  <h4 className="font-semibold text-foreground">Categorización con IA</h4>
                  <p className="text-sm text-muted-foreground">
                    Organiza tus gastos automáticamente
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <div className="text-2xl">🚨</div>
                <div>
                  <h4 className="font-semibold text-foreground">Alertas Inteligentes</h4>
                  <p className="text-sm text-muted-foreground">
                    Te avisamos si te pasas del presupuesto
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <div className="text-2xl">📊</div>
                <div>
                  <h4 className="font-semibold text-foreground">Análisis Automático</h4>
                  <p className="text-sm text-muted-foreground">
                    Insights personalizados de tus finanzas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cuentas conectadas */}
        {connections.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Cuentas Conectadas</h3>
            {connections.map((conn) => (
              <Card key={conn.id} className="p-4 bg-card/80 backdrop-blur border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{conn.bank_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Última sincronización: {new Date(conn.last_sync).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Principal */}
        <Card className="p-8 bg-card/80 backdrop-blur border-border/50">
          <div className="text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Conecta tu Banco Ahora
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Conexión 100% segura con Open Banking. Tus credenciales nunca se comparten con Moni, todo está encriptado.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleConnectBank}
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                {loading ? "Conectando..." : "🚀 Conectar Mi Banco"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                size="lg"
              >
                Lo haré después
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                🔒 Encriptación bancaria
              </span>
              <span className="flex items-center gap-1">
                ✓ Conexión segura
              </span>
              <span className="flex items-center gap-1">
                🏦 Open Banking
              </span>
            </div>
          </div>
        </Card>

        {/* Bancos soportados */}
        <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
          <h3 className="font-semibold text-foreground mb-4">
            Bancos Soportados (Próximamente)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              "BBVA", "Santander", "Banorte", 
              "Citibanamex", "HSBC", "Scotiabank",
              "Inbursa", "BanBajío", "Más..."
            ].map((bank) => (
              <div key={bank} className="text-center p-3 bg-background/50 rounded-lg">
                <p className="text-sm text-foreground">{bank}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Mientras tanto, usa WhatsApp */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-foreground">
              Mientras tanto, usa WhatsApp
            </h3>
            <p className="text-sm text-muted-foreground">
              Puedes registrar tus transacciones enviando mensajes por WhatsApp mientras implementamos la integración bancaria.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/whatsapp")}
            >
              Conectar WhatsApp
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
