import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";

interface AIAnalysisLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function AIAnalysisLoader({ message = "Analizando...", fullScreen = false }: AIAnalysisLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 flex items-center justify-center overflow-hidden z-50"
    : "w-full flex items-center justify-center overflow-hidden relative rounded-[20px] py-12";

  return (
    <div className={containerClass}>
      {/* Logo animation */}
      <div className="relative z-10 flex flex-col items-center justify-center">
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
      </div>
    </div>
  );
}
