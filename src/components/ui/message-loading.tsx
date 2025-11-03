import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";

function MessageLoading() {
  return (
    <motion.img
      src={moniLogo}
      alt="MONI AI"
      className="w-16 h-auto"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0.7, 1, 0.7],
        scale: [0.95, 1, 0.95],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export { MessageLoading };
