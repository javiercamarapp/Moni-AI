import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

interface LevelProgressCardProps {
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  levelTitle: string;
}

export function LevelProgressCard({ 
  currentLevel, 
  totalXP, 
  xpToNextLevel,
  levelTitle 
}: LevelProgressCardProps) {
  const currentLevelXP = totalXP % xpToNextLevel;
  const progressPercent = (currentLevelXP / xpToNextLevel) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 rounded-2xl border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Nivel {currentLevel}</h3>
          <p className="text-sm text-muted-foreground">{levelTitle}</p>
        </div>
        <div className="bg-primary/20 p-3 rounded-full">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {currentLevelXP} / {xpToNextLevel} XP
          </span>
          <span className="text-primary font-semibold">
            {Math.floor(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-3" />
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Total acumulado: <span className="font-semibold text-foreground">{totalXP.toLocaleString()} XP</span>
      </p>
    </motion.div>
  );
}