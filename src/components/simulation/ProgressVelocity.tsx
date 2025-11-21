import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Gauge } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressVelocityProps {
  dailySavings: number;
  projectedYearly: number;
}

export const ProgressVelocity = ({ dailySavings, projectedYearly }: ProgressVelocityProps) => {
  const weeklySavings = dailySavings * 7;
  const monthlySavings = dailySavings * 30;
  const progressPercentage = Math.min((dailySavings / 500) * 100, 100); // Asumiendo meta de $500/día

  return (
    <Card className="p-5 bg-card border-border/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Gauge className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-foreground">Velocidad de progreso</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Por día</span>
            <span className="font-semibold text-foreground">{formatCurrency(dailySavings)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Por semana</span>
            <span className="font-semibold text-foreground">{formatCurrency(weeklySavings)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Por mes</span>
            <span className="font-semibold text-foreground">{formatCurrency(monthlySavings)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-2">Tu versión futura en 1 año tendrá:</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(projectedYearly)}</p>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progreso hacia meta</span>
            <span className="font-medium text-foreground">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
