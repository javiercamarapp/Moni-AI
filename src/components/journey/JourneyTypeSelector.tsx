import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Rocket, TrendingUp, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type JourneyType = 'financial_life' | 'first_million' | 'first_property';

interface JourneyTypeSelectorProps {
  onSelect: (type: JourneyType) => void;
}

const journeyOptions = [
  {
    type: 'first_million' as JourneyType,
    title: 'Mi Primer Millón',
    subtitle: 'Invertido',
    description: 'Crea un plan realista para alcanzar tu primer millón en inversiones.',
    icon: TrendingUp,
    gradient: 'from-[#4E342E] to-[#6D4C41]',
  },
  {
    type: 'first_property' as JourneyType,
    title: 'Mi Primera Propiedad',
    subtitle: 'Tu nuevo hogar',
    description: 'Genera un plan de ahorro para alcanzar la casa de tus sueños.',
    icon: Home,
    gradient: 'from-[#3E2723] to-[#5D4037]',
  },
  {
    type: 'financial_life' as JourneyType,
    title: 'Financial Journey',
    subtitle: 'Para toda la vida',
    description: 'Define tus aspiraciones financieras completas: casa, auto, inversiones y ahorro.',
    icon: Rocket,
    gradient: 'from-[#5D4037] to-[#8D6E63]',
  },
];

export default function JourneyTypeSelector({ onSelect }: JourneyTypeSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return journeyOptions.length - 1;
      if (next >= journeyOptions.length) return 0;
      return next;
    });
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      paginate(-1);
    } else if (info.offset.x < -threshold) {
      paginate(1);
    }
  };

  const currentOption = journeyOptions[currentIndex];
  const Icon = currentOption.icon;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F5] to-[#F5F0EE] px-4 py-8 flex flex-col">
      {/* Header */}
      <div className="text-center mb-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-[#3E2723] mb-2">
            ¿Cuál es tu objetivo?
          </h1>
          <p className="text-[#8D6E63] text-sm max-w-xs mx-auto">
            Desliza para explorar tus opciones
          </p>
        </motion.div>
      </div>

      {/* Stacked Cards Container */}
      <div className="flex-1 flex items-center justify-center relative perspective-1000">
        {/* Background stacked cards effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          {journeyOptions.map((option, index) => {
            const offset = index - currentIndex;
            const isVisible = Math.abs(offset) <= 1;
            
            if (!isVisible || index === currentIndex) return null;
            
            return (
              <motion.div
                key={option.type}
                className={cn(
                  "absolute w-[85%] max-w-sm h-80 rounded-3xl",
                  "bg-gradient-to-br shadow-lg backdrop-blur-md",
                  option.gradient,
                  "bg-opacity-70"
                )}
                style={{ background: `linear-gradient(to bottom right, rgba(93, 64, 55, 0.7), rgba(141, 110, 99, 0.7))` }}
                initial={false}
                animate={{
                  scale: 0.9,
                  y: offset * 20,
                  opacity: 0.4,
                  zIndex: -Math.abs(offset),
                }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </div>

        {/* Main swipeable card */}
        <div className="relative w-full max-w-md h-96 flex items-center justify-center px-12 md:px-16">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(currentOption.type)}
              className={cn(
                "absolute w-[85%] max-w-sm cursor-pointer",
                "p-8 rounded-3xl text-left",
                "shadow-2xl backdrop-blur-md",
                "hover:shadow-3xl transition-shadow duration-300"
              )}
              style={{ 
                touchAction: 'pan-y',
                background: currentIndex === 0 
                  ? 'linear-gradient(to bottom right, rgba(93, 64, 55, 0.85), rgba(141, 110, 99, 0.85))'
                  : currentIndex === 1
                  ? 'linear-gradient(to bottom right, rgba(78, 52, 46, 0.85), rgba(109, 76, 65, 0.85))'
                  : 'linear-gradient(to bottom right, rgba(62, 39, 35, 0.85), rgba(93, 64, 55, 0.85))'
              }}
            >
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex-1">
                  <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                    {currentOption.subtitle}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1 mb-4">
                    {currentOption.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {currentOption.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <span className="text-white/60 text-xs">
                    Toca para comenzar
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation arrows - hidden on mobile, positioned close to cards */}
        <button
          onClick={() => paginate(-1)}
          className="hidden md:flex absolute left-[calc(50%-220px)] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg items-center justify-center text-[#5D4037] hover:bg-white transition-colors z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => paginate(1)}
          className="hidden md:flex absolute right-[calc(50%-220px)] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg items-center justify-center text-[#5D4037] hover:bg-white transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6 mb-8">
        {journeyOptions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "w-6 bg-[#5D4037]" 
                : "bg-[#D7CCC8] hover:bg-[#A1887F]"
            )}
          />
        ))}
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-[#A1887F] text-xs px-8"
      >
        Puedes cambiar tu objetivo en cualquier momento
      </motion.p>
    </div>
  );
}
