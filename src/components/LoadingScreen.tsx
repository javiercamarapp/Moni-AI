import { motion } from "motion/react";
import moniLogo from "@/assets/moni-ai-logo-black.png";

type LoadingScreenProps = {
  /** 
   * Whether to show the animated progress bar.
   * - true (default): Shows logo + animated progress bar (for real data loading)
   * - false: Shows only the logo splash (for onboarding visualization)
   */
  showProgress?: boolean;
};

/**
 * Unified loading screen component.
 * Uses the standard app background and the animated MONI logo.
 * Progress bar is shown by default; set showProgress={false} for onboarding splash only.
 */
export function LoadingScreen({ showProgress = true }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center">
      <div className="relative z-10 flex flex-col items-center justify-center gap-4">
        {/* Animated MONI logo */}
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

        {/* Animated progress bar - only when showProgress is true */}
        {showProgress && (
          <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#8D6E63] to-[#A1887F] rounded-full relative"
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
        )}
      </div>
    </div>
  );
}