import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import whatsappLogo from '@/assets/whatsapp-logo.png';
import Autoplay from "embla-carousel-autoplay";

export default function WhatsAppSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [api, setApi] = useState<CarouselApi>();
  
  // Número de WhatsApp de Moni AI (esto debería venir de configuración)
  const MONI_WHATSAPP = "+52 123 456 7890"; // Reemplazar con el número real

  // Ejemplos de mensajes
  const ejemplosMensajes = [
    { mensaje: "Gasté $350 en súper", categoria: "Comida", tipo: "gasto" },
    { mensaje: "$5000 freelance", categoria: "Trabajo", tipo: "ingreso" },
    { mensaje: "$120 gasolina", categoria: "Transporte", tipo: "gasto" },
    { mensaje: "$450 con amigos", categoria: "Ocio", tipo: "gasto" },
    { mensaje: "Me pagaron $8000", categoria: "Salario", tipo: "ingreso" },
    { mensaje: "$80 Netflix", categoria: "Suscripciones", tipo: "gasto" },
    { mensaje: "Cena $250", categoria: "Comida", tipo: "gasto" },
    { mensaje: "Ingreso $1500 venta", categoria: "Trabajo", tipo: "ingreso" },
    { mensaje: "$600 luz", categoria: "Servicios", tipo: "gasto" },
    { mensaje: "Uber $150", categoria: "Transporte", tipo: "gasto" },
    { mensaje: "$3000 bono", categoria: "Salario", tipo: "ingreso" },
    { mensaje: "Farmacia $280", categoria: "Salud", tipo: "gasto" },
  ];

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
    <div className="min-h-screen animated-wave-bg p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Chatea con Moni AI</h1>
            <p className="text-sm text-white/70">Por WhatsApp, 24/7</p>
          </div>
        </div>

        {/* Hero Card */}
        <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur border-green-500/30">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <img src={whatsappLogo} alt="WhatsApp" className="w-8 h-8 object-contain" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-lg font-bold text-white leading-tight">
                  ¡Habla con Moni por WhatsApp! 💬
                </h2>
              </div>
            </div>
            
            <p className="text-xs text-white/70">
              Registra tus gastos e ingresos de forma natural
            </p>

            {/* Número de WhatsApp */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-2.5 border border-white/20">
              <p className="text-[10px] text-white/70 mb-1">Envía un mensaje a:</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-bold text-white font-mono">
                  {MONI_WHATSAPP}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyPhoneNumber}
                  className="text-white hover:bg-white/10 h-7 w-7"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* CTA Principal */}
            <Button
              onClick={openWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white h-9 text-sm font-semibold"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Abrir Chat con Moni
            </Button>
          </div>
        </Card>

        {/* ¿Cómo funciona? */}
        <Card className="p-4 bg-card/80 backdrop-blur border-border/50">
          <h3 className="font-bold text-base text-white mb-3 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            ¿Cómo funciona?
          </h3>
          <Carousel
            className="w-full"
            opts={{
              align: "start",
              loop: false,
            }}
          >
            <CarouselContent className="-ml-2">
              <CarouselItem className="basis-1/2 pl-2">
                <div className="flex gap-2 hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Agrega el número</p>
                    <p className="text-xs text-white/70">Guarda como "Moni AI"</p>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-1/2 pl-2">
                <div className="flex gap-2 hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Envía transacciones</p>
                    <p className="text-xs text-white/70">Escribe natural, como hablas</p>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-1/2 pl-2">
                <div className="flex gap-2 hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Recibe confirmación</p>
                    <p className="text-xs text-white/70">Moni categoriza automáticamente</p>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-1/2 pl-2">
                <div className="flex gap-2 hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold text-xs">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Consulta tu balance</p>
                    <p className="text-xs text-white/70">Pregunta: "¿Cuánto he gastado?"</p>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-1/2 pl-2">
                <div className="flex gap-2 hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold text-xs">
                    5
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Recibe análisis</p>
                    <p className="text-xs text-white/70">Reportes y consejos personalizados</p>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-1/2 pl-2">
                <div className="flex gap-2 hover:scale-105 transition-transform duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold text-xs">
                    6
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Mejora tus finanzas</p>
                    <p className="text-xs text-white/70">Alcanza tus metas con Moni</p>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </Card>

        {/* Ejemplos de mensajes - Carrusel */}
        <Card className="p-4 bg-card/80 backdrop-blur border-border/50 overflow-hidden">
          <h3 className="font-bold text-base text-white mb-2">
            Ejemplos de mensajes
          </h3>
          <Carousel
            setApi={setApi}
            className="w-full"
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 2500,
              }),
            ]}
          >
            <CarouselContent>
              {ejemplosMensajes.map((ejemplo, index) => (
                <CarouselItem key={index} className="basis-1/2">
                  <div className={`${ejemplo.tipo === 'ingreso' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-lg p-2 hover:scale-105 transition-transform duration-200`}>
                    <p className="text-white font-medium text-xs">"{ejemplo.mensaje}"</p>
                    <p className="text-[10px] text-white/60 mt-0.5">→ {ejemplo.categoria}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </Card>

        {/* Beneficios */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur border-primary/20">
          <h3 className="font-bold text-base text-white mb-2 animate-fade-in">
            ¿Por qué usar WhatsApp? 💡
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '0ms' }}>
              <div className="text-lg">⚡</div>
              <div>
                <p className="font-semibold text-white text-xs">Instantáneo</p>
                <p className="text-[10px] text-white/70">Registra en segundos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '150ms' }}>
              <div className="text-lg">🤖</div>
              <div>
                <p className="font-semibold text-white text-xs">Inteligente</p>
                <p className="text-[10px] text-white/70">IA que entiende</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '300ms' }}>
              <div className="text-lg">🎯</div>
              <div>
                <p className="font-semibold text-white text-xs">Preciso</p>
                <p className="text-[10px] text-white/70">Auto-categoriza</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '450ms' }}>
              <div className="text-lg">🔔</div>
              <div>
                <p className="font-semibold text-white text-xs">Recordatorios</p>
                <p className="text-[10px] text-white/70">Alertas útiles</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
