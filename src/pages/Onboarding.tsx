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
      {/* Background image - changes based on currentSlide */}
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          backgroundImage: `url(${
            currentSlide === 0 ? onboardingHero : 
            currentSlide === 1 ? onboardingControl : 
            currentSlide === 2 ? onboardingGoals :
            onboardingCoach
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content - changes based on currentSlide */}
      <div className={`flex ${currentSlide === 3 ? 'items-end pb-40' : 'items-start pt-20'} justify-center px-4 relative z-10 min-h-screen`}>
        <div className="w-full max-w-md space-y-6">
          {currentSlide === 0 ? (
            /* First slide - Typewriter effect */
            <div className="text-center space-y-4 px-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <Typewriter
                  text="Tu dinero, más inteligente."
                  speed={80}
                  loop={true}
                  deleteSpeed={50}
                  delay={3000}
                  className="text-gray-900"
                />
              </h1>
              <p className="text-lg md:text-xl text-gray-900 leading-relaxed font-medium">
                Con Moni AI, aprende a manejar tus finanzas como un experto, sin complicaciones.
              </p>
            </div>
          ) : currentSlide === 1 ? (
            /* Second slide - BlurredStagger effect with loop */
            <div className="text-center space-y-4 px-4">
              <div className="font-bold leading-tight text-white">
                <BlurredStagger
                  text={["Toma el control", "de tus finanzas."]}
                  loop={true}
                  loopDelay={3000}
                  className="text-3xl md:text-8xl font-bold text-center"
                />
              </div>
              <p className="text-lg md:text-xl text-white leading-relaxed font-medium pt-4">
                Moni analiza tus hábitos, clasifica tus gastos y te enseña a mejorar cada día.
              </p>
            </div>
          ) : currentSlide === 2 ? (
            /* Third slide - Goals with WhisperText effect */
            <div className="text-center space-y-4 px-4">
              <h1 className="text-3xl md:text-6xl font-bold leading-tight text-white">
                <WhisperText
                  text="Convierte tus metas en logros."
                  className="text-3xl md:text-6xl font-bold text-white"
                  delay={100}
                  duration={0.5}
                  x={-20}
                  y={0}
                />
              </h1>
              <p className="text-lg md:text-xl text-white leading-relaxed font-medium">
                Crea retos, ahorra con tus amigos y gana puntos cada vez que avanzas.
              </p>
            </div>
          ) : currentSlide === 3 ? (
            /* Fourth slide - Coach with AnimatedText */
            <div className="text-center space-y-4 px-4">
              <AnimatedText
                text="Tu coach financiero inteligente."
                textClassName="text-3xl md:text-5xl font-bold text-white"
                gradientColors="linear-gradient(90deg, #ffffff, #cccccc, #ffffff)"
                gradientAnimationDuration={1.5}
                loop={true}
                loopDelay={3000}
                className="py-0"
              />
              <p className="text-lg md:text-xl text-white leading-relaxed font-medium">
                Moni te guía, te motiva y celebra tus logros.
                <br />
                ¡Comienza hoy tu camino hacia la libertad financiera!
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 pb-6 md:pb-12 px-8 z-20">
        <div className="max-w-md mx-auto">
          <div className="flex items-end justify-between">
            {/* Left side: Dots and Skip button */}
            <div className="flex flex-col gap-6">
              {/* Dot indicators */}
              <div className="flex items-center gap-2 md:gap-3">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-8 md:w-12 h-2 md:h-3 bg-white shadow-lg' 
                        : 'w-2 md:w-3 h-2 md:h-3 bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              {/* Skip button - text only */}
              <button
                onClick={() => navigate('/auth')}
                className="text-white text-sm md:text-lg font-medium hover:text-white/80 transition-colors text-left"
              >
                Saltar
              </button>
            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-xl"
            >
              <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-gray-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
