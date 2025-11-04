import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import moniLogo from '/moni-logo.png';
import onboardingHero from '@/assets/onboarding-hero.png';
import onboardingControl from '@/assets/onboarding-control.png';
import onboardingGoals from '@/assets/onboarding-goals.png';
import onboardingCoach from '@/assets/onboarding-coach.png';
import aiImage from '@/assets/onboarding-ai.png';
import { Typewriter } from '@/components/ui/typewriter-text';
import { BlurredStagger } from '@/components/ui/blurred-stagger-text';
import WhisperText from '@/components/ui/whisper-text';
import { AnimatedText } from '@/components/ui/animated-shiny-text';

const Onboarding = () => {
  const [showLogo, setShowLogo] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Preload ALL images and ensure they're ready before showing slides
  useEffect(() => {
    const allImages = [
      moniLogo,
      onboardingHero, 
      onboardingControl, 
      onboardingGoals, 
      onboardingCoach,
      aiImage
    ];

    let loadedCount = 0;
    const totalImages = allImages.length;

    const imagePromises = allImages.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          resolve(); // Resolve even on error to not block loading
        };
        img.src = src;
      });
    });

    Promise.all(imagePromises).then(() => {
      // Wait minimum 1.5 seconds for smooth transition
      setTimeout(() => {
        setShowLogo(false);
      }, 1500);
    });
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background image during loading */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${onboardingHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="animate-fade-in relative z-10">
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Background image - changes based on currentSlide - with fallback */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${
            currentSlide === 0 ? onboardingHero : 
            currentSlide === 1 ? onboardingControl : 
            currentSlide === 2 ? onboardingGoals :
            onboardingCoach
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content - changes based on currentSlide */}
      <div className={`flex ${currentSlide === 3 ? 'items-end pb-40 md:pb-56' : 'items-start pt-20 md:pt-32'} justify-center px-4 relative z-10 min-h-screen`}>
        <div className="w-full max-w-md md:max-w-4xl space-y-6 md:space-y-8">
          {currentSlide === 0 ? (
            /* First slide - Typewriter effect */
            <div className="text-center space-y-4 md:space-y-6 px-4">
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <Typewriter
                  text="Tu dinero, más inteligente."
                  speed={80}
                  loop={true}
                  deleteSpeed={50}
                  delay={3000}
                  className="text-gray-900"
                />
              </h1>
              <p className="text-lg md:text-3xl lg:text-4xl text-gray-900 leading-relaxed font-medium max-w-3xl mx-auto">
                Con Moni AI, aprende a manejar tus finanzas como un experto, sin complicaciones.
              </p>
            </div>
          ) : currentSlide === 1 ? (
            /* Second slide - BlurredStagger effect with loop */
            <div className="text-center space-y-4 md:space-y-6 px-4">
              <div className="font-bold leading-tight text-white">
                <BlurredStagger
                  text={["Toma el control", "de tus finanzas."]}
                  loop={true}
                  loopDelay={3000}
                  className="text-3xl md:text-8xl lg:text-9xl font-bold text-center"
                />
              </div>
              <p className="text-lg md:text-3xl lg:text-4xl text-white leading-relaxed font-medium pt-4 max-w-3xl mx-auto">
                Moni analiza tus hábitos, clasifica tus gastos y te enseña a mejorar cada día.
              </p>
            </div>
          ) : currentSlide === 2 ? (
            /* Third slide - Goals with WhisperText effect */
            <div className="text-center space-y-4 md:space-y-6 px-4">
              <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold leading-tight text-white">
                <WhisperText
                  text="Convierte tus metas en logros."
                  className="text-3xl md:text-7xl lg:text-8xl font-bold text-white"
                  delay={100}
                  duration={0.5}
                  x={-20}
                  y={0}
                />
              </h1>
              <p className="text-lg md:text-3xl lg:text-4xl text-white leading-relaxed font-medium max-w-3xl mx-auto">
                Crea retos, ahorra con tus amigos y gana puntos cada vez que avanzas.
              </p>
            </div>
          ) : currentSlide === 3 ? (
            /* Fourth slide - Coach with AnimatedText */
            <div className="text-center space-y-4 md:space-y-6 px-4">
              <AnimatedText
                text="Tu coach financiero inteligente."
                textClassName="text-3xl md:text-6xl lg:text-7xl font-bold text-white"
                gradientColors="linear-gradient(90deg, #ffffff, #cccccc, #ffffff)"
                gradientAnimationDuration={1.5}
                loop={true}
                loopDelay={3000}
                className="py-0"
              />
              <p className="text-lg md:text-3xl lg:text-4xl text-white leading-relaxed font-medium max-w-3xl mx-auto">
                Moni te guía, te motiva y celebra tus logros.
                <br />
                ¡Comienza hoy tu camino hacia la libertad financiera!
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 pb-6 md:pb-16 px-4 md:px-16 z-20">
        <div className="w-full max-w-full md:max-w-6xl mx-auto">
          <div className="flex items-end justify-between w-full">
            {/* Left side: Dots and Skip button */}
            <div className="flex flex-col gap-6 md:gap-8">
              {/* Dot indicators */}
              <div className="flex items-center gap-2 md:gap-4">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-8 md:w-16 h-2 md:h-4 bg-white shadow-lg' 
                        : 'w-2 md:w-4 h-2 md:h-4 bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              {/* Skip button - text only */}
              <button
                onClick={() => navigate('/auth')}
                className="text-white text-sm md:text-xl font-medium hover:text-white/80 transition-colors text-left"
              >
                Saltar
              </button>
            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-14 h-14 md:w-24 md:h-24 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-xl"
            >
              <ArrowRight className="w-6 h-6 md:w-10 md:h-10 text-gray-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
