import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface RiskIndicator {
  level: "critical" | "warning" | "good";
  message: string;
}

interface RiskIndicatorsProps {
  indicators: RiskIndicator[];
  hasIssues: boolean;
}

export default function RiskIndicatorsWidget({ indicators, hasIssues }: RiskIndicatorsProps) {
  const getIndicatorStyle = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-gradient-to-r from-red-600 via-red-500 to-red-600";
      case "warning":
        return "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500";
      case "good":
        return "bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500";
      default:
        return "bg-white border-border";
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-white" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-white" />;
      case "good":
        return <CheckCircle className="h-4 w-4 text-white" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <p className="text-xs font-medium text-foreground">⚡ Análisis de Riesgos IA</p>
      </div>
      
      {!hasIssues ? (
        <Card className="p-4 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-fade-in rounded-[20px] border-0">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">
                🎉 ¡Excelente salud financiera!
              </p>
              <p className="text-xs text-white/90 leading-snug">
                Tu Moni AI no detectó puntos críticos. Tus métricas están en niveles saludables. 
                Sigue con el buen trabajo y mantén estos hábitos financieros.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3500,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {indicators.map((indicator, index) => (
              <CarouselItem key={index} className="basis-full">
                <Card 
                  className={`p-3 transition-all duration-500 rounded-[20px] border-0 ${getIndicatorStyle(indicator.level)}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {getIcon(indicator.level)}
                    </div>
                    <p className="text-xs text-white leading-snug flex-1 font-medium">
                      {indicator.message}
                    </p>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  );
}
