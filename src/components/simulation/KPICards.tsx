import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, PiggyBank, Wallet, Award } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardsProps {
  totalSaved: number;
  totalInvested: number;
  totalReturns: number;
  bestMonth: { month: string; growth: number };
}

export const KPICards = ({ totalSaved, totalInvested, totalReturns, bestMonth }: KPICardsProps) => {
  const kpis = [
    {
      icon: PiggyBank,
      label: "Total ahorrado",
      value: formatCurrency(totalSaved),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Wallet,
      label: "Total invertido",
      value: formatCurrency(totalInvested),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      label: "Rendimiento ganado",
      value: formatCurrency(totalReturns),
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Award,
      label: "Mejor mes",
      value: bestMonth.month,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4 bg-card border-border/40">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </p>
                <p className="text-sm font-semibold text-foreground mt-1 truncate">
                  {kpi.value}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
