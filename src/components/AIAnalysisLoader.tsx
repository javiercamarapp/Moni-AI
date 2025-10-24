import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";

interface AIAnalysisLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function AIAnalysisLoader({ message = "Analizando...", fullScreen = false }: AIAnalysisLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center overflow-hidden z-50"
    : "w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center overflow-hidden relative rounded-[20px] py-12";

  return (
    <div className={containerClass}>
      {/* Animated background circles */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* Logo with pulse animation */}
      <div className="relative z-10 flex flex-col items-center gap-4">
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
        <p className="text-sm text-foreground/60 animate-pulse">{message}</p>
      </div>
    </div>
  );
}
