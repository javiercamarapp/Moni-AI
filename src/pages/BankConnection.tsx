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
    <div className="page-standard min-h-screen pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header con mismo estilo que patrimonio */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm">
          <div className="page-container py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Conexión Bancaria</h1>
                <p className="text-xs text-gray-500">Automatiza tus finanzas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">

        {/* Hero Card con beneficios - Estilo Apple */}
        <Card className="p-6 bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 rounded-3xl animate-fade-in hover:shadow-xl transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  Moni se encarga de todo 🤖
                </h2>
                <p className="text-sm text-gray-600 font-medium mt-1">
                  Conecta tu banco y automatiza todo
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl animate-fade-in hover:scale-105 transition-all duration-200 hover:shadow-md" style={{ animationDelay: '0ms' }}>
                <div className="text-2xl">⚡</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Instantáneo</p>
                  <p className="text-xs text-gray-600">Detección al momento</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl animate-fade-in hover:scale-105 transition-all duration-200 hover:shadow-md" style={{ animationDelay: '100ms' }}>
                <div className="text-2xl">🧠</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Con IA</p>
                  <p className="text-xs text-gray-600">Auto-categoriza</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl animate-fade-in hover:scale-105 transition-all duration-200 hover:shadow-md" style={{ animationDelay: '200ms' }}>
                <div className="text-2xl">🚨</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Alertas</p>
                  <p className="text-xs text-gray-600">Límites presupuesto</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl animate-fade-in hover:scale-105 transition-all duration-200 hover:shadow-md" style={{ animationDelay: '300ms' }}>
                <div className="text-2xl">📊</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Análisis</p>
                  <p className="text-xs text-gray-600">Insights personalizados</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cuentas conectadas */}
        {connections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 px-2">Cuentas Conectadas</h3>
            {connections.map((conn) => (
              <Card key={conn.id} className="p-5 bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 rounded-3xl animate-fade-in hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{conn.bank_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(conn.last_sync).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Principal */}
        <Card className="p-6 bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 rounded-3xl animate-fade-in hover:shadow-xl transition-all duration-300">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Conecta tu Banco Ahora
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto mt-2 font-medium">
                100% seguro con Open Banking. Tus credenciales nunca se comparten.
              </p>
            </div>
            <Button
              onClick={handleConnectBank}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {loading ? "Conectando..." : "🚀 Conectar Mi Banco"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 h-11 text-base font-medium rounded-2xl hover:shadow-md transition-all duration-300"
            >
              Lo haré después
            </Button>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600 font-medium pt-2">
              <span className="flex items-center gap-1">🔒 Encriptado</span>
              <span className="flex items-center gap-1">✓ Seguro</span>
              <span className="flex items-center gap-1">🏦 Open Banking</span>
            </div>
          </div>
        </Card>

        {/* Bancos soportados */}
        <Card className="p-6 bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 rounded-3xl animate-fade-in hover:shadow-xl transition-all duration-300">
          <h3 className="font-bold text-lg text-gray-900 mb-4 animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Bancos Soportados
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              "BBVA", "Santander", "Banorte", 
              "Citibanamex", "HSBC", "Scotiabank",
              "Inbursa", "BanBajío", "Más..."
            ].map((bank, index) => (
              <div 
                key={bank} 
                className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:scale-105 hover:shadow-md transition-all duration-200 animate-fade-in border border-gray-200"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <p className="text-sm font-medium text-gray-700">{bank}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Mientras tanto, usa WhatsApp */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl animate-fade-in hover:shadow-xl transition-all duration-300">
          <div className="text-center space-y-4">
            <h3 className="font-bold text-xl bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Mientras tanto, usa WhatsApp 💬
            </h3>
            <p className="text-sm text-gray-700 font-medium">
              Registra tus transacciones por WhatsApp mientras implementamos la integración bancaria
            </p>
            <Button
              onClick={() => navigate("/whatsapp")}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              Conectar WhatsApp
            </Button>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
