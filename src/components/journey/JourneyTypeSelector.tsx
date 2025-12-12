import { motion } from "framer-motion";
import { Rocket, TrendingUp, Home, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type JourneyType = 'financial_life' | 'first_million' | 'first_property';

interface JourneyTypeSelectorProps {
  onSelect: (type: JourneyType) => void;
}

const journeyOptions = [
  {
    type: 'financial_life' as JourneyType,
    title: 'Financial Journey',
    subtitle: 'Para toda la vida',
    description: 'Define tus aspiraciones financieras completas: casa, auto, inversiones y ahorro.',
    icon: Rocket,
    gradient: 'from-[#5D4037] to-[#8D6E63]',
    iconBg: 'bg-white/20',
  },
  {
    type: 'first_million' as JourneyType,
    title: 'Mi Primer Millón',
    subtitle: 'Invertido',
    description: 'Crea un plan realista para alcanzar tu primer millón en inversiones.',
    icon: TrendingUp,
    gradient: 'from-[#4E342E] to-[#6D4C41]',
    iconBg: 'bg-white/20',
  },
  {
    type: 'first_property' as JourneyType,
    title: 'Mi Primera Propiedad',
    subtitle: 'Tu nuevo hogar',
    description: 'Genera un plan de ahorro para alcanzar la casa de tus sueños.',
    icon: Home,
    gradient: 'from-[#3E2723] to-[#5D4037]',
    iconBg: 'bg-white/20',
  },
];

export default function JourneyTypeSelector({ onSelect }: JourneyTypeSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F5] to-[#F5F0EE] px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-[#3E2723] mb-2">
            ¿Cuál es tu objetivo?
          </h1>
          <p className="text-[#8D6E63] text-sm max-w-xs mx-auto">
            Selecciona el camino financiero que quieres recorrer
          </p>
        </motion.div>
      </div>

      {/* Cards */}
      <div className="max-w-lg mx-auto space-y-4">
        {journeyOptions.map((option, index) => {
          const Icon = option.icon;
          
          return (
            <motion.button
              key={option.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
              onClick={() => onSelect(option.type)}
              className={cn(
                "w-full p-5 rounded-3xl text-left transition-all duration-300",
                "bg-gradient-to-br shadow-lg hover:shadow-xl hover:-translate-y-1",
                option.gradient
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                  option.iconBg
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {option.title}
                      </h3>
                      <span className="text-white/70 text-xs font-medium">
                        {option.subtitle}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/50" />
                  </div>
                  <p className="text-white/80 text-sm mt-2 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-[#A1887F] text-xs mt-8 px-8"
      >
        Puedes cambiar tu objetivo en cualquier momento desde tu perfil
      </motion.p>
    </div>
  );
}
