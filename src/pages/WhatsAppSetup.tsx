import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function WhatsAppSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);

    const { data } = await supabase
      .from("whatsapp_users")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (data) {
      setIsConnected(true);
      setPhoneNumber(data.phone_number);
    }
  };

  const handleConnect = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Ingresa tu número de WhatsApp",
        variant: "destructive",
      });
      return;
    }

    // Validar formato de teléfono
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({
        title: "Error",
        description: "Número de teléfono inválido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      
      const { error } = await supabase
        .from("whatsapp_users")
        .insert({
          user_id: user.id,
          phone_number: formattedPhone,
          is_active: true
        });

      if (error) throw error;

      setIsConnected(true);
      toast({
        title: "¡Conectado! 🎉",
        description: "Ahora puedes enviar tus transacciones por WhatsApp",
      });
    } catch (error: any) {
      console.error("Error connecting WhatsApp:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo conectar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("whatsapp_users")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (error) throw error;

      setIsConnected(false);
      setPhoneNumber("");
      toast({
        title: "Desconectado",
        description: "WhatsApp ha sido desconectado",
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
            <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
            <p className="text-muted-foreground">Conecta tu número para registrar transacciones</p>
          </div>
        </div>

        <Card className="p-8 bg-card/80 backdrop-blur border-border/50">
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Conecta WhatsApp</h2>
                <p className="text-muted-foreground">Envía tus transacciones fácilmente</p>
              </div>
            </div>

            {!isConnected ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Número de WhatsApp
                  </label>
                  <Input
                    type="tel"
                    placeholder="+52 123 456 7890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Incluye el código de país (ej: +52 para México)
                  </p>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? "Conectando..." : "Conectar WhatsApp"}
                </Button>

                <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    ¿Cómo funciona?
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Conecta tu número de WhatsApp</li>
                    <li>Envía mensajes como: "Gasté $500 en comida" o "Me pagaron $2000"</li>
                    <li>Moni AI interpretará y registrará automáticamente tu transacción</li>
                    <li>Recibirás confirmación y análisis en tiempo real</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    ¡Conectado!
                  </h3>
                  <p className="text-muted-foreground mb-1">
                    Número conectado:
                  </p>
                  <p className="font-mono text-foreground font-semibold">
                    {phoneNumber}
                  </p>
                </div>

                <div className="bg-card rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Ejemplos de mensajes:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="bg-primary/5 rounded p-3">
                      <p className="text-foreground">"Gasté $350 en el supermercado"</p>
                    </div>
                    <div className="bg-primary/5 rounded p-3">
                      <p className="text-foreground">"Ingreso de $5000 por freelance"</p>
                    </div>
                    <div className="bg-primary/5 rounded p-3">
                      <p className="text-foreground">"$120 en gasolina"</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleDisconnect}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? "Desconectando..." : "Desconectar WhatsApp"}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
