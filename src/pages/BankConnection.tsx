import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, AlertCircle, ShieldCheck, Zap, Brain, Bell, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { headingPage, headingSection } from "@/styles/typography";

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
    <div className="min-h-screen bg-[#faf9f8] pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-[#5D4037]">Conexión Bancaria</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6 pt-6">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-[#F5F0EE] rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-sm border border-white">
              <Building2 className="w-10 h-10 text-[#8D6E63]" />
            </div>
            <h1 className={`${headingPage} text-2xl`}>
              Automatiza tus Finanzas
            </h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Conecta tu banco de forma segura para que Moni rastree tus ingresos y gastos automáticamente.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mb-3 text-emerald-600">
                <Zap size={16} />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Instantáneo</h3>
              <p className="text-xs text-gray-500 mt-1">Actualización en tiempo real</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mb-3 text-purple-600">
                <Brain size={16} />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Inteligente</h3>
              <p className="text-xs text-gray-500 mt-1">Auto-categorización con IA</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center mb-3 text-orange-600">
                <Bell size={16} />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Alertas</h3>
              <p className="text-xs text-gray-500 mt-1">Notificaciones de gastos</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-600">
                <BarChart3 size={16} />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Análisis</h3>
              <p className="text-xs text-gray-500 mt-1">Reportes detallados</p>
            </div>
          </div>

          {/* Connected Accounts */}
          {connections.length > 0 && (
            <div className="space-y-3">
              <h3 className={headingSection}>Cuentas Conectadas</h3>
              {connections.map((conn) => (
                <div key={conn.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F0EE] rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#8D6E63]" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{conn.bank_name}</p>
                      <p className="text-[10px] text-gray-500">Sincronizado: {new Date(conn.last_sync).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              ))}
            </div>
          )}

          {/* CTA Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-lg">
            <div className="flex items-center justify-center gap-6 mb-6 border-b border-gray-50 pb-4">
               <div className="flex flex-col items-center gap-1">
                 <ShieldCheck className="w-5 h-5 text-[#8D6E63]" />
                 <span className="text-[10px] font-medium text-gray-500">Encriptado</span>
               </div>
               <div className="w-px h-8 bg-gray-100"></div>
               <div className="flex flex-col items-center gap-1">
                 <CheckCircle2 className="w-5 h-5 text-[#8D6E63]" />
                 <span className="text-[10px] font-medium text-gray-500">Seguro</span>
               </div>
               <div className="w-px h-8 bg-gray-100"></div>
               <div className="flex flex-col items-center gap-1">
                 <Building2 className="w-5 h-5 text-[#8D6E63]" />
                 <span className="text-[10px] font-medium text-gray-500">Regulado</span>
               </div>
            </div>

            <Button
              onClick={handleConnectBank}
              disabled={loading}
              className="w-full h-14 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {loading ? "Conectando..." : "Conectar mi Banco"}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="w-full h-12 mt-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl"
            >
              Lo haré más tarde
            </Button>
          </div>

          {/* WhatsApp Fallback */}
          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
                <span className="text-xl">💬</span>
              </div>
              <div>
                <h3 className="font-bold text-emerald-900">¿Prefieres WhatsApp?</h3>
                <p className="text-xs text-emerald-700/80">Registra gastos enviando un mensaje</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/whatsapp")}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm"
            >
              Conectar WhatsApp
            </Button>
          </div>

          {/* Supported Banks */}
          <div className="pt-4">
            <p className="text-center text-xs text-gray-400 font-medium mb-4 uppercase tracking-widest">Bancos Soportados</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["BBVA", "Santander", "Banorte", "Citibanamex", "HSBC", "Scotiabank"].map(bank => (
                <span key={bank} className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-medium text-gray-500">
                  {bank}
                </span>
              ))}
              <span className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-400">+20 más</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
