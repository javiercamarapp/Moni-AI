import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";

interface MoniLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  message?: string;
}

const sizeMap = {
  sm: "w-24",
  md: "w-32", 
  lg: "w-48",
  xl: "w-64"
};

export function MoniLoader({ size = "md", fullScreen = false, message }: MoniLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 flex items-center justify-center overflow-hidden z-50 bg-background"
    : "w-full flex items-center justify-center overflow-hidden relative py-8";

  return (
    <div className={containerClass}>
      <div className="relative z-10 flex flex-col items-center justify-center gap-4">
        <motion.img
          src={moniLogo}
          alt="MONI AI"
          className={`${sizeMap[size]} h-auto`}
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
        
        {/* Barra de progreso animada con el mismo estilo que las metas */}
        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full relative"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "100%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
        
        {message && (
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );
}
