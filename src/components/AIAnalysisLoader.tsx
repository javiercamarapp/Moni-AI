import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";
import { Sparkles, TrendingUp, BarChart3, Calculator } from "lucide-react";

export function AIAnalysisLoader() {
  return (
    <div className="w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center overflow-hidden relative rounded-[20px] py-12">
      {/* Animated background circles */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl"
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
    </div>
  );
}
