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
  const [isReady, setIsReady] = useState(false);

  // Wait for carousel to be ready before starting auto-scroll
  useEffect(() => {
    if (!api) return;
    
    // Mark as ready immediately to prevent initial animation
    setIsReady(true);
    
    // Start auto-scroll after a delay
    const scrollInterval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    
    return () => clearInterval(scrollInterval);
  }, [api]);

  // Generate dynamic insights based on financial data
  const generateInsights = () => {
    const insights: Array<{ emoji: string; message: string; isPositive: boolean }> = [];
    
    // Balance status
    if (balance > 0) {
      insights.push({
        emoji: "✅",
        message: `Balance positivo de $${balance.toLocaleString('es-MX', { maximumFractionDigits: 0 })} este mes.`,
        isPositive: true
      });
    } else {
      insights.push({
        emoji: "⚠️",
        message: `Déficit de $${Math.abs(balance).toLocaleString('es-MX', { maximumFractionDigits: 0 })} este mes. Revisa gastos.`,
        isPositive: false
      });
    }
    
    // Fixed expenses ratio
    const fixedRatio = monthlyIncome > 0 ? (fixedExpenses / monthlyIncome) * 100 : 0;
    if (fixedRatio > 50) {
      insights.push({
        emoji: "🔴",
        message: `Gastos fijos ${fixedRatio.toFixed(0)}% del ingreso. Busca reducir obligaciones.`,
        isPositive: false
      });
    } else if (fixedRatio > 30) {
      insights.push({
        emoji: "🟡",
        message: `Gastos fijos ${fixedRatio.toFixed(0)}% del ingreso. Nivel moderado.`,
        isPositive: false
      });
    } else {
      insights.push({
        emoji: "💚",
        message: `Gastos fijos solo ${fixedRatio.toFixed(0)}% del ingreso. ¡Excelente control!`,
        isPositive: true
      });
    }
    
    // Savings ratio
    const savingsRatio = monthlyIncome > 0 ? (savingsGoals / monthlyIncome) * 100 : 0;
    if (savingsRatio >= 20) {
      insights.push({
        emoji: "🚀",
        message: `Ahorro ${savingsRatio.toFixed(0)}% mensual. ¡Vas por buen camino!`,
        isPositive: true
      });
    } else if (savingsRatio >= 10) {
      insights.push({
        emoji: "📊",
        message: `Ahorro ${savingsRatio.toFixed(0)}% mensual. Intenta llegar al 20%.`,
        isPositive: true
      });
    } else {
      insights.push({
        emoji: "💡",
        message: `Ahorro ${savingsRatio.toFixed(0)}% mensual. Aumenta poco a poco.`,
        isPositive: false
      });
    }
    
    // Variable spending
    const variableSpending = monthlyExpenses - fixedExpenses;
    const variableRatio = monthlyIncome > 0 ? (variableSpending / monthlyIncome) * 100 : 0;
    if (variableRatio > 40) {
      insights.push({
        emoji: "🔥",
        message: `Gastos variables ${variableRatio.toFixed(0)}%. Recorta delivery y antojos.`,
        isPositive: false
      });
    } else {
      insights.push({
        emoji: "✨",
        message: `Gastos variables ${variableRatio.toFixed(0)}%. Buen control.`,
        isPositive: true
      });
    }
    
    // Goals progress
    if (savingsGoals > 0) {
      insights.push({
        emoji: "🎯",
        message: `Metas de ahorro: $${savingsGoals.toLocaleString('es-MX', { maximumFractionDigits: 0 })}/mes. ¡Sigue así!`,
        isPositive: true
      });
    }
    
    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="w-full overflow-hidden">
      <Carousel 
        className="w-full" 
        setApi={setApi} 
        opts={{ 
          loop: true, 
          align: "center",
          duration: 0,
          startIndex: 0,
          skipSnaps: false,
          dragFree: false
        }}
      >
        <CarouselContent className="-ml-1 md:-ml-2">
          {insights.map((insight, index) => (
            <CarouselItem key={index} className="pl-1 md:pl-2 basis-full">
              <div className="px-1">
                <Card 
                  className={`p-4 rounded-[20px] border-0 transition-all ${
                    insight.isPositive 
                      ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500' 
                      : 'bg-gradient-to-r from-red-600 via-red-500 to-red-600'
                  }`}
                >
                  <p className="text-xs text-white leading-snug">
                    {insight.emoji} <span className="font-medium">{insight.message}</span>
                  </p>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
