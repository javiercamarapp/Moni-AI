import { motion } from "motion/react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import moniLogo from "@/assets/moni-ai-loading.png";

export function LoadingScreen() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <motion.img
          src={moniLogo}
          alt="MONI AI - Coach financiero"
          className="w-64 h-auto"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </AuroraBackground>
  );
}