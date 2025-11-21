import { Card } from "@/components/ui/card";
import { RiskLevel } from "@/hooks/useSavingsSimulation";
import { motion } from "framer-motion";

interface RiskSelectorProps {
  selected: RiskLevel;
  onChange: (risk: RiskLevel) => void;
}

const riskOptions = [
  { value: 'conservative' as RiskLevel, label: 'Conservadora', range: '4-6%' },
  { value: 'moderate' as RiskLevel, label: 'Moderada', range: '7-10%' },
  { value: 'aggressive' as RiskLevel, label: 'Arriesgada', range: '12-18%' },
];

export const RiskSelector = ({ selected, onChange }: RiskSelectorProps) => {
  return (
    <Card className="p-4 bg-card border-border/40">
      <h3 className="text-sm font-medium text-foreground mb-3">Tipo de inversión</h3>
      <div className="flex gap-2">
        {riskOptions.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.value)}
            className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              selected === option.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[10px] opacity-80">{option.range}</div>
          </motion.button>
        ))}
      </div>
    </Card>
  );
};
