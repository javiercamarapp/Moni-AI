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

  // Generate dynamic insights
  const insights = [];

  // Balance insight
  if (balance > 0) {
    insights.push({
      emoji: "✅",
      message: `¡Excelente! Te sobran $${balance.toLocaleString('es-MX')} este mes`,
      gradient: "bg-gradient-card"
    });
  } else if (balance < 0) {
    insights.push({
      emoji: "⚠️",
      message: `Atención: gastaste $${Math.abs(balance).toLocaleString('es-MX')} más de lo que ganaste`,
      gradient: "bg-gradient-card"
    });
  }

  // Fixed expenses ratio
  const fixedRatio = monthlyIncome > 0 ? fixedExpenses / monthlyIncome * 100 : 0;
  if (fixedRatio < 50) {
    insights.push({
      emoji: "💪",
      message: `Tus gastos fijos son solo el ${fixedRatio.toFixed(0)}% de tu ingreso. ¡Muy bien!`,
      gradient: "bg-gradient-card"
    });
  } else if (fixedRatio > 70) {
    insights.push({
      emoji: "🎯",
      message: `Tus gastos fijos son ${fixedRatio.toFixed(0)}% del ingreso. Intenta reducirlos`,
      gradient: "bg-gradient-card"
    });
  }

  // Savings insight
  const savingsRatio = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome * 100 : 0;
  if (savingsRatio > 20) {
    insights.push({
      emoji: "🚀",
      message: `¡Increíble! Estás ahorrando el ${savingsRatio.toFixed(0)}% de tus ingresos`,
      gradient: "bg-gradient-card"
    });
  } else if (savingsRatio > 0 && savingsRatio < 10) {
    insights.push({
      emoji: "💡",
      message: `Ahorras ${savingsRatio.toFixed(0)}% de tus ingresos. Intenta llegar al 20%`,
      gradient: "bg-gradient-card"
    });
  }

  // Variable spending
  const variableSpending = monthlyExpenses - fixedExpenses;
  if (variableSpending > fixedExpenses * 1.5) {
    insights.push({
      emoji: "🔍",
      message: `Tus gastos variables ($${variableSpending.toLocaleString('es-MX')}) son altos. Revisa delivery y entretenimiento`,
      gradient: "bg-gradient-card"
    });
  }

  // Goals progress
  if (savingsGoals > 0) {
    insights.push({
      emoji: "🎯",
      message: `Necesitas ahorrar $${savingsGoals.toLocaleString('es-MX')} al mes para tus metas`,
      gradient: "bg-gradient-card"
    });
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push({
      emoji: "👋",
      message: "Comienza a registrar tus gastos para obtener insights personalizados",
      gradient: "bg-gradient-card"
    });
  }
  return <Carousel className="w-full" setApi={setApi} opts={{
    loop: true,
    align: "center"
  }}>
      <CarouselContent>
        {insights.map((insight, index) => <CarouselItem key={index}>
            
          </CarouselItem>)}
      </CarouselContent>
    </Carousel>;
}