import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface XPProgressCardProps {
  totalXP: number;
  scoreMoni: number;
  className?: string;
}

export default function XPProgressCard({ totalXP, scoreMoni, className = "" }: XPProgressCardProps) {
  const currentLevel = Math.floor(totalXP / 100) + 1;
  const xpInCurrentLevel = totalXP % 100;
  const progressPercentage = xpInCurrentLevel;

  return (
    <motion.div 
      className={`bg-card border border-border rounded-2xl p-5 shadow-sm ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header con Score y Nivel */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm text-muted-foreground">Nivel Actual</h3>
          <p className="text-3xl font-bold text-foreground flex items-center gap-2">
            {currentLevel}
            <span className="text-xl">✨</span>
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-sm text-muted-foreground">Score Moni</h3>
          <p className="text-3xl font-bold text-primary">
            {scoreMoni}<span className="text-lg text-muted-foreground">/100</span>
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progreso al Nivel {currentLevel + 1}</span>
          <span className="font-medium text-foreground">{xpInCurrentLevel}/100 XP</span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="h-3"
          indicatorClassName="bg-gradient-to-r from-primary to-primary/80"
        />
        
        <p className="text-xs text-muted-foreground text-right">
          {100 - xpInCurrentLevel} XP para siguiente nivel
        </p>
      </div>

      {/* XP Total */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">XP Total</span>
          <span className="text-lg font-semibold text-foreground">{totalXP} XP</span>
        </div>
      </div>
    </motion.div>
  );
}
