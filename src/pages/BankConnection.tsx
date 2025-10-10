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
    <div className="min-h-screen animated-wave-bg p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Conexión Bancaria</h1>
            <p className="text-sm text-white/70">Automatiza tus finanzas</p>
          </div>
        </div>

        {/* Hero Card con beneficios */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur border-primary/20">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-lg font-bold text-white leading-tight">
                  Moni se encarga de todo 🤖
                </h2>
              </div>
            </div>
            
            <p className="text-xs text-white/70">
              Conecta tu banco y automatiza todo
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '0ms' }}>
                <div className="text-lg">⚡</div>
                <div>
                  <p className="font-semibold text-white text-xs">Instantáneo</p>
                  <p className="text-[10px] text-white/70">Detección al momento</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '150ms' }}>
                <div className="text-lg">🧠</div>
                <div>
                  <p className="font-semibold text-white text-xs">Con IA</p>
                  <p className="text-[10px] text-white/70">Auto-categoriza</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '300ms' }}>
                <div className="text-lg">🚨</div>
                <div>
                  <p className="font-semibold text-white text-xs">Alertas</p>
                  <p className="text-[10px] text-white/70">Límites presupuesto</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '450ms' }}>
                <div className="text-lg">📊</div>
                <div>
                  <p className="font-semibold text-white text-xs">Análisis</p>
                  <p className="text-[10px] text-white/70">Insights personalizados</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cuentas conectadas */}
        {connections.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white px-2">Cuentas Conectadas</h3>
            {connections.map((conn) => (
              <Card key={conn.id} className="p-4 bg-card/80 backdrop-blur border-border/50 animate-fade-in hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{conn.bank_name}</p>
                      <p className="text-xs text-white/70">
                        {new Date(conn.last_sync).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Principal */}
        <Card className="p-4 bg-card/80 backdrop-blur border-border/50">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Conecta tu Banco Ahora
              </h3>
              <p className="text-xs text-white/70 max-w-md mx-auto">
                100% seguro con Open Banking. Tus credenciales nunca se comparten.
              </p>
            </div>
            <Button
              onClick={handleConnectBank}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white h-9 text-sm font-semibold"
            >
              {loading ? "Conectando..." : "🚀 Conectar Mi Banco"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full border-white/20 text-white hover:bg-white/10 h-9 text-sm"
            >
              Lo haré después
            </Button>
            <div className="flex items-center justify-center gap-3 text-[10px] text-white/70">
              <span>🔒 Encriptado</span>
              <span>✓ Seguro</span>
              <span>🏦 Open Banking</span>
            </div>
          </div>
        </Card>

        {/* Bancos soportados */}
        <Card className="p-4 bg-card/80 backdrop-blur border-border/50">
          <h3 className="font-bold text-base text-white mb-2 animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-white" />
            Bancos Soportados
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              "BBVA", "Santander", "Banorte", 
              "Citibanamex", "HSBC", "Scotiabank",
              "Inbursa", "BanBajío", "Más..."
            ].map((bank, index) => (
              <div 
                key={bank} 
                className="text-center p-2 bg-white/5 rounded-lg hover:scale-105 transition-transform duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="text-xs text-white">{bank}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Mientras tanto, usa WhatsApp */}
        <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur border-green-500/30">
          <div className="text-center space-y-2">
            <h3 className="font-bold text-base text-white">
              Mientras tanto, usa WhatsApp 💬
            </h3>
            <p className="text-xs text-white/70">
              Registra tus transacciones por WhatsApp mientras implementamos la integración bancaria
            </p>
            <Button
              onClick={() => navigate("/whatsapp")}
              className="w-full bg-green-500 hover:bg-green-600 text-white h-9 text-sm font-semibold"
            >
              Conectar WhatsApp
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
