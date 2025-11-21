import { Card } from "@/components/ui/card";
import { TimePeriod } from "@/hooks/useSavingsSimulation";
import { motion } from "framer-motion";

interface TimeRangeSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const timeOptions: TimePeriod[] = ['1M', '3M', '6M', '1A', '5A'];

export const TimeRangeSelector = ({ selected, onChange }: TimeRangeSelectorProps) => {
  return (
    <Card className="p-4 bg-card border-border/40">
      <h3 className="text-sm font-medium text-foreground mb-3">Período de tiempo</h3>
      <div className="flex gap-2">
        {timeOptions.map((option) => (
          <motion.button
            key={option}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(option)}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selected === option
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </Card>
  );
};
