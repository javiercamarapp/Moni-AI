import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import moniLogo from '/moni-logo.png';

const OnboardingSlide = ({ image, title, description }: { image: string, title: string, description: string }) => (
  <div className="flex flex-col items-center justify-between h-full px-6 py-8">
    <div className="flex-1 flex items-center justify-center w-full">
      <img 
        src={image} 
        alt={title}
        className="w-full max-w-md h-auto object-contain"
      />
    </div>
    <div className="text-center space-y-4 mt-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
        {title}
      </h2>
      <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-md mx-auto">
        {description}
      </p>
    </div>
  </div>
);

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
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
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
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
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
    <div className="min-h-screen animated-wave-bg flex flex-col relative">
      {/* Skip button */}
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={() => navigate('/auth')}
          className="text-gray-300 text-base font-normal hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md h-full">
          <OnboardingSlide 
            image={slides[currentSlide].image}
            title={slides[currentSlide].title}
            description={slides[currentSlide].description}
          />
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="pb-12 px-8">
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <div className="flex items-center justify-between w-full">
            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all ${
                    index === currentSlide 
                      ? 'w-8 h-2 bg-white' 
                      : 'w-2 h-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowRight className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Skip button below dots */}
          <button
            onClick={() => navigate('/auth')}
            className="text-gray-300 text-sm font-normal hover:text-white transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
