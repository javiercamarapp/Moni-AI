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
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-foreground hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Conexión Bancaria</h1>
            <p className="text-muted-foreground">Detecta transacciones automáticamente</p>
          </div>
        </div>

        {/* Info sobre la funcionalidad */}
        <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Detección Automática de Transacciones
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Al conectar tu banco, Moni detectará automáticamente tus transacciones en tiempo real:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                <li>Notificación instantánea cuando gastes o recibas dinero</li>
                <li>Categorización automática con IA</li>
                <li>Alertas inteligentes si excedes tu presupuesto</li>
                <li>Análisis de patrones de gasto</li>
              </ul>
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

        {/* Botón para conectar */}
        <Card className="p-8 bg-card/80 backdrop-blur border-border/50">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Conecta tu Banco
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Usa Open Banking para conectar tu cuenta de forma segura. Tus credenciales nunca se comparten con Moni.
            </p>
            <Button
              onClick={handleConnectBank}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              {loading ? "Conectando..." : "Conectar Banco"}
            </Button>
            <p className="text-xs text-muted-foreground">
              🔒 Conexión segura encriptada
            </p>
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
