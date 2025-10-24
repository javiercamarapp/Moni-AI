import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, BarChart3, Target } from "lucide-react";

interface AIAnalysisLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function AIAnalysisLoader({ message = "Analizando...", fullScreen = false }: AIAnalysisLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 animated-wave-bg flex items-center justify-center overflow-hidden z-50"
    : "w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center overflow-hidden relative rounded-[20px] py-12";

  const icons = [
    { Icon: TrendingUp, color: "text-green-500", delay: 0 },
    { Icon: DollarSign, color: "text-blue-500", delay: 0.2 },
    { Icon: BarChart3, color: "text-purple-500", delay: 0.4 },
    { Icon: PiggyBank, color: "text-pink-500", delay: 0.6 },
    { Icon: Target, color: "text-orange-500", delay: 0.8 },
    { Icon: TrendingDown, color: "text-red-500", delay: 1.0 },
  ];

  return (
    <div className={containerClass}>
      {/* Logo with pulse animation */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.img
          src={moniLogo}
          alt="MONI AI"
          className="w-48 h-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [0.95, 1, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <p className="text-base text-foreground font-medium">{message}</p>
        
        {/* Animated icons in a circle */}
        <div className="relative w-32 h-32">
          {icons.map(({ Icon, color, delay }, index) => {
            const angle = (index * 360) / icons.length;
            const radius = 50;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <motion.div
                key={index}
                className={`absolute ${color}`}
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: [0, x, 0],
                  y: [0, y, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay,
                }}
              >
                <Icon className="w-6 h-6" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
