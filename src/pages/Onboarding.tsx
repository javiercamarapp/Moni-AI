import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import moniLogo from '/moni-logo.png';
import onboardingHero from '@/assets/onboarding-hero.png';
import aiImage from '@/assets/onboarding-ai.png';

const Onboarding = () => {
  const [showLogo, setShowLogo] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const slides = [
    {
      image: aiImage,
      title: 'Tu coach financiero personal en WhatsApp',
      description: 'La IA que te acompaña día a día y te ayuda a gastar mejor, ahorrar más y cumplir tus metas.'
    },
    {
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop',
      title: 'Gamificación Real',
      description: 'Gana XP, sube de nivel y desbloquea badges. Ahorrar nunca fue tan divertido.'
    },
    {
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      title: 'Metas Inteligentes',
      description: 'IA que analiza tus patrones de gasto y crea planes personalizados para ti.'
    },
    {
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
      title: 'Metas Grupales',
      description: 'Planea viajes o proyectos con amigos. Todos aportan y ven el progreso en tiempo real.'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/auth');
    }
  };

  if (showLogo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${onboardingHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
      {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20 relative z-10">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Hero Message Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/30 animate-scale-in hover-lift">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Tu dinero, más inteligente.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Con Moni AI, aprende a manejar tus finanzas como un experto, sin complicaciones.
            </p>
          </div>

          {/* Slide Content Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/20 hover-lift transition-all">
            <div className="w-full mb-4">
              <img 
                src={slides[currentSlide].image} 
                alt={slides[currentSlide].title}
                className="w-full max-w-xs mx-auto h-auto object-contain rounded-xl"
              />
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 pb-6 px-8 z-20">
        <div className="max-w-md mx-auto">
          <div className="flex items-end justify-between">
            {/* Left side: Dots and Skip button */}
            <div className="flex flex-col gap-6">
              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-8 h-2 bg-white shadow-lg' 
                        : 'w-2 h-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              {/* Skip button - text only */}
              <button
                onClick={() => navigate('/auth')}
                className="text-white text-sm font-medium hover:text-white/80 transition-colors text-left"
              >
                Saltar
              </button>
            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-xl"
            >
              <ArrowRight className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
