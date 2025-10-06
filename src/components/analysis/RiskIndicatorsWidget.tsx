import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

interface RiskIndicator {
  level: "critical" | "warning" | "good";
  message: string;
}

interface RiskIndicatorsProps {
  liquidityMonths: number;
  financialBurden: number;
  variableExpensesChange: number;
}

export default function RiskIndicatorsWidget({ 
  liquidityMonths, 
  financialBurden, 
  variableExpensesChange 
}: RiskIndicatorsProps) {
  const indicators: RiskIndicator[] = [];

  // Liquidity risk
  if (liquidityMonths < 1.5) {
    indicators.push({
      level: "critical",
      message: `🔴 Liquidez crítica: ${liquidityMonths.toFixed(1)} meses de gasto cubierto.`
    });
  } else if (liquidityMonths < 3) {
    indicators.push({
      level: "warning",
      message: `🟡 Liquidez baja: ${liquidityMonths.toFixed(1)} meses cubiertos (meta: 3m).`
    });
  } else {
    indicators.push({
      level: "good",
      message: `🟢 Liquidez saludable: ${liquidityMonths.toFixed(1)} meses protegidos.`
    });
  }

  // Financial burden risk
  if (financialBurden > 30) {
    indicators.push({
      level: "critical",
      message: `🔴 Carga financiera al límite (${financialBurden.toFixed(0)}%).`
    });
  } else if (financialBurden > 20) {
    indicators.push({
      level: "warning",
      message: `🟡 Carga de deuda moderada (${financialBurden.toFixed(0)}%).`
    });
  } else if (financialBurden > 0) {
    indicators.push({
      level: "good",
      message: `🟢 Carga de deuda controlada (${financialBurden.toFixed(0)}%).`
    });
  }

  // Variable expenses risk
  if (variableExpensesChange > 10) {
    indicators.push({
      level: "warning",
      message: `🟡 Gasto variable aumentó +${variableExpensesChange.toFixed(0)}% vs promedio.`
    });
  } else if (variableExpensesChange < -5) {
    indicators.push({
      level: "good",
      message: `🟢 Buen control: gasto variable ${Math.abs(variableExpensesChange).toFixed(0)}% bajo promedio.`
    });
  }

  const getIndicatorStyle = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-gradient-to-br from-red-600/90 to-red-800/90 border-red-500/30";
      case "warning":
        return "bg-gradient-to-br from-yellow-600/90 to-yellow-800/90 border-yellow-500/30";
      case "good":
        return "bg-gradient-to-br from-emerald-600/90 to-emerald-800/90 border-emerald-500/30";
      default:
        return "bg-gradient-card border-white/20";
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-200" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-200" />;
      case "good":
        return <CheckCircle className="h-4 w-4 text-emerald-200" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/80">⚡ Indicadores de Riesgo</p>
      <div className="space-y-2">
        {indicators.map((indicator, index) => (
          <Card 
            key={index}
            className={`p-3 card-glow hover:scale-105 transition-transform duration-200 ${getIndicatorStyle(indicator.level)}`}
          >
            <div className="flex items-center gap-2">
              {getIcon(indicator.level)}
              <p className="text-xs text-white leading-snug flex-1">
                {indicator.message}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
