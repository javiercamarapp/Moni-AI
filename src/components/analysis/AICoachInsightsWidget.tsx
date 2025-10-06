import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { useEffect, useState } from "react";
interface AICoachInsightsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  fixedExpenses: number;
  savingsGoals: number;
  balance: number;
}
export default function AICoachInsightsWidget({
  monthlyIncome,
  monthlyExpenses,
  fixedExpenses,
  savingsGoals,
  balance
}: AICoachInsightsProps) {
  const [api, setApi] = useState<CarouselApi>();

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  // Generate dynamic insights with colors
  const insights = [];

  // Balance insight
  if (balance > 0) {
    insights.push({
      emoji: "✅",
      message: `¡Excelente! Te sobran $${balance.toLocaleString('es-MX')} este mes`,
      isPositive: true
    });
  } else if (balance < 0) {
    insights.push({
      emoji: "⚠️",
      message: `Atención: gastaste $${Math.abs(balance).toLocaleString('es-MX')} más de lo que ganaste`,
      isPositive: false
    });
  }

  // Fixed expenses ratio
  const fixedRatio = monthlyIncome > 0 ? fixedExpenses / monthlyIncome * 100 : 0;
  if (fixedRatio < 50) {
    insights.push({
      emoji: "💪",
      message: `Tus gastos fijos son solo el ${fixedRatio.toFixed(0)}% de tu ingreso. ¡Muy bien!`,
      isPositive: true
    });
  } else if (fixedRatio > 70) {
    insights.push({
      emoji: "🎯",
      message: `Tus gastos fijos son ${fixedRatio.toFixed(0)}% del ingreso. Intenta reducirlos`,
      isPositive: false
    });
  }

  // Savings insight
  const savingsRatio = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome * 100 : 0;
  if (savingsRatio > 20) {
    insights.push({
      emoji: "🚀",
      message: `¡Increíble! Estás ahorrando el ${savingsRatio.toFixed(0)}% de tus ingresos`,
      isPositive: true
    });
  } else if (savingsRatio > 0 && savingsRatio < 10) {
    insights.push({
      emoji: "💡",
      message: `Ahorras ${savingsRatio.toFixed(0)}% de tus ingresos. Intenta llegar al 20%`,
      isPositive: false
    });
  } else if (savingsRatio <= 0) {
    insights.push({
      emoji: "❌",
      message: `No estás ahorrando este mes. Revisa tus gastos variables`,
      isPositive: false
    });
  }

  // Variable spending
  const variableSpending = monthlyExpenses - fixedExpenses;
  if (variableSpending > fixedExpenses * 1.5) {
    insights.push({
      emoji: "🔍",
      message: `Tus gastos variables ($${variableSpending.toLocaleString('es-MX')}) son altos. Revisa delivery y entretenimiento`,
      isPositive: false
    });
  }

  // Goals progress
  if (savingsGoals > 0) {
    insights.push({
      emoji: "🎯",
      message: `Necesitas ahorrar $${savingsGoals.toLocaleString('es-MX')} al mes para tus metas`,
      isPositive: savingsGoals < monthlyIncome * 0.3
    });
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push({
      emoji: "👋",
      message: "Comienza a registrar tus gastos para obtener insights personalizados",
      isPositive: true
    });
  }
  return (
    <Carousel className="w-full" setApi={setApi} opts={{
      loop: true,
      align: "center"
    }}>
      <CarouselContent>
        {insights.map((insight, index) => (
          <CarouselItem key={index}>
            <Card className={`p-4 border-white/20 transition-all ${
              insight.isPositive 
                ? 'bg-gradient-to-br from-emerald-500/90 to-emerald-600/90' 
                : 'bg-gradient-to-br from-red-500/90 to-red-600/90'
            }`}>
              <div className="flex items-start gap-3">
                <div className="text-3xl">{insight.emoji}</div>
                <p className="text-sm text-white font-medium leading-relaxed pt-1">
                  {insight.message}
                </p>
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}