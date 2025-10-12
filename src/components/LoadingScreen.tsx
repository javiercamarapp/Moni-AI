import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center overflow-hidden relative">
      {/* Pulsating background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5"
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
        className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-accent/10 to-accent/5"
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

      {/* Logo with pulse animation */}
      <motion.img
        src={moniLogo}
        alt="MONI AI - Coach financiero"
        className="w-64 max-w-[80vw] h-auto relative z-10"
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
  );
}