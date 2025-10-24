import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";
import { Sparkles, BarChart3 } from "lucide-react";

interface AIAnalysisLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function AIAnalysisLoader({ message = "Analizando...", fullScreen = false }: AIAnalysisLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 animated-wave-bg flex items-center justify-center overflow-hidden z-50"
    : "w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center overflow-hidden relative rounded-[20px] py-12";

  return (
    <div className={containerClass}>
      {/* Logo and animation */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <motion.img
          src={moniLogo}
          alt="MONI AI"
          className="w-64 h-auto"
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
        
        {/* Animated icons - 5x bigger than original */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Sparkles className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.div
            animate={{
              y: [0, -25, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <BarChart3 className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
