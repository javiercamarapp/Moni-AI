import { Card } from "@/components/ui/card";
import { Sparkles, Calendar, Target, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

interface AISuggestionCardProps {
  currentDailySavings: number;
  suggestedDailySavings: number;
  estimatedDate: string;
  successProbability: number;
}

export const AISuggestionCard = ({
  currentDailySavings,
  suggestedDailySavings,
  estimatedDate,
  successProbability,
}: AISuggestionCardProps) => {
  const difference = suggestedDailySavings - currentDailySavings;
  const monthsEarlier = 2; // Simulado

  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-foreground">Meta inteligente sugerida por IA</h3>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 bg-card/50 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-foreground">Ritmo actual</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Estás ahorrando {formatCurrency(currentDailySavings)} por día
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 bg-primary/10 rounded-lg border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-foreground">Recomendación</span>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Aumenta {formatCurrency(difference)} diarios
          </p>
          <p className="text-xs text-muted-foreground">
            Para lograrlo {monthsEarlier} meses antes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Fecha estimada</span>
          </div>
          <span className="text-xs font-medium text-foreground">{estimatedDate}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Probabilidad de éxito</span>
            <span className="font-medium text-foreground">{successProbability}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successProbability}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                successProbability >= 75
                  ? 'bg-green-500'
                  : successProbability >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
          </div>
        </motion.div>
      </div>
    </Card>
  );
};
