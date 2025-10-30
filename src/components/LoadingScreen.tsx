import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden relative">
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