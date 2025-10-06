import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import whatsappLogo from '@/assets/whatsapp-logo.png';

export default function WhatsAppSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  // Número de WhatsApp de Moni AI (esto debería venir de configuración)
  const MONI_WHATSAPP = "+52 123 456 7890"; // Reemplazar con el número real

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
  };

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText(MONI_WHATSAPP);
    toast({
      title: "¡Copiado!",
      description: "Número copiado al portapapeles",
    });
  };

  const openWhatsApp = () => {
    const cleanNumber = MONI_WHATSAPP.replace(/\D/g, '');
    const message = encodeURIComponent("¡Hola Moni! Quiero empezar a registrar mis transacciones 💰");
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen animated-wave-bg p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Chatea con Moni AI</h1>
            <p className="text-white/70">Por WhatsApp, 24/7</p>
          </div>
        </div>

        {/* Hero Card */}
        <Card className="p-8 bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur border-green-500/30">
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
              <img src={whatsappLogo} alt="WhatsApp" className="w-16 h-16" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ¡Habla con Moni por WhatsApp! 💬
              </h2>
              <p className="text-white/70">
                Registra tus gastos e ingresos de forma natural, como si hablaras con un amigo
              </p>
            </div>

            {/* Número de WhatsApp */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <p className="text-sm text-white/70 mb-2">Envía un mensaje a:</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-white font-mono">
                  {MONI_WHATSAPP}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyPhoneNumber}
                  className="text-white hover:bg-white/10"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* CTA Principal */}
            <Button
              onClick={openWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white h-14 text-lg font-semibold"
            >
              <MessageCircle className="mr-2 h-6 w-6" />
              Abrir Chat con Moni
            </Button>
          </div>
        </Card>

        {/* ¿Cómo funciona? */}
        <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
          <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            ¿Cómo funciona?
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-white">Agrega el número a tus contactos</p>
                <p className="text-sm text-white/70">Guarda {MONI_WHATSAPP} como "Moni AI"</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-white">Envía tus transacciones</p>
                <p className="text-sm text-white/70">Escribe de forma natural, como hablas</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-white">Recibe confirmación</p>
                <p className="text-sm text-white/70">Moni AI te confirma y categoriza automáticamente</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Ejemplos de mensajes */}
        <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
          <h3 className="font-bold text-xl text-white mb-4">
            Ejemplos de mensajes
          </h3>
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-white font-medium">"Gasté $350 en el supermercado"</p>
              <p className="text-xs text-white/60 mt-1">→ Gasto registrado en categoría Comida</p>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-white font-medium">"Me pagaron $5000 por freelance"</p>
              <p className="text-xs text-white/60 mt-1">→ Ingreso registrado en categoría Trabajo</p>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-white font-medium">"$120 gasolina"</p>
              <p className="text-xs text-white/60 mt-1">→ Gasto registrado en categoría Transporte</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-white font-medium">"Comida con amigos $450"</p>
              <p className="text-xs text-white/60 mt-1">→ Gasto registrado en categoría Ocio</p>
            </div>
          </div>
        </Card>

        {/* Beneficios */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur border-primary/20">
          <h3 className="font-bold text-xl text-white mb-4">
            ¿Por qué usar WhatsApp? 💡
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚡</div>
              <div>
                <p className="font-semibold text-white">Instantáneo</p>
                <p className="text-sm text-white/70">Registra en segundos, desde donde estés</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <p className="font-semibold text-white">Inteligente</p>
                <p className="text-sm text-white/70">IA que entiende lenguaje natural</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <p className="font-semibold text-white">Preciso</p>
                <p className="text-sm text-white/70">Categorización automática inteligente</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔔</div>
              <div>
                <p className="font-semibold text-white">Recordatorios</p>
                <p className="text-sm text-white/70">Moni te recuerda registrar tus gastos</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
