import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MessageCircle, Trophy, Target, Users, Shield, Heart, Sparkles } from 'lucide-react';
import moniLogo from '/moni-logo.png';

const OnboardingSlide = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex flex-col items-center justify-center text-center space-y-6 p-8">
    <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center glow-primary backdrop-blur-sm">
      <Icon className="w-10 h-10 text-white" />
    </div>
    <h2 className="text-3xl md:text-4xl font-bold text-white max-w-md">
      {title}
    </h2>
    <p className="text-lg md:text-xl text-gray-300 max-w-md leading-relaxed">
      {description}
    </p>
  </div>
);

const Onboarding = () => {
  const [showLogo, setShowLogo] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const slides = [
    {
      icon: MessageCircle,
      title: 'Coach en WhatsApp',
      description: 'Recibe tips personalizados y motivación directamente en WhatsApp'
    },
    {
      icon: Trophy,
      title: 'Gamificación Real',
      description: 'Gana XP, sube de nivel y desbloquea badges. Ahorrar nunca fue tan divertido'
    },
    {
      icon: Target,
      title: 'Metas Inteligentes',
      description: 'IA que analiza tus patrones de gasto y crea planes personalizados'
    },
    {
      icon: Users,
      title: 'Metas Grupales',
      description: 'Planea viajes o proyectos con amigos. Todos aportan y ven el progreso'
    },
    {
      icon: Shield,
      title: 'Seguro y Privado',
      description: 'Tecnología bancaria de nivel mundial. Tus datos están seguros'
    },
    {
      icon: Heart,
      title: 'Impacto Social',
      description: 'Tu suscripción dona acceso gratuito a estudiantes'
    }
  ];

  if (showLogo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-fade-in">
          <img 
            src={moniLogo} 
            alt="Moni Logo" 
            className="w-80 max-w-[90vw] animate-pulse"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
      {/* Skip button */}
      <Button
        variant="ghost"
        className="absolute top-8 right-8 text-white hover:bg-white/10"
        onClick={() => navigate('/auth')}
      >
        Saltar
      </Button>

      {/* Logo pequeño arriba */}
      <div className="absolute top-8 left-8 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center glow-primary backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">Moni</span>
      </div>

      {/* Carousel */}
      <div className="w-full max-w-4xl">
        <Carousel className="w-full">
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <Card className="border-0 bg-transparent">
                  <OnboardingSlide 
                    icon={slide.icon}
                    title={slide.title}
                    description={slide.description}
                  />
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-4 mt-8">
            <CarouselPrevious className="relative static translate-y-0 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            <CarouselNext className="relative static translate-y-0 bg-white/10 border-white/20 text-white hover:bg-white/20" />
          </div>
        </Carousel>
      </div>

      {/* CTA Button */}
      <div className="mt-12 space-y-4 text-center">
        <Button
          size="lg"
          className="bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all glow-primary px-8 py-4 text-lg font-semibold"
          onClick={() => navigate('/auth')}
        >
          Comenzar Gratis
        </Button>
        <p className="text-sm text-gray-400">
          Primer mes gratis • Sin compromiso • Cancela cuando quieras
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
