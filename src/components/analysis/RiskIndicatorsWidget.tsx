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
        return "bg-white border-red-200 shadow-lg";
      case "warning":
        return "bg-white border-yellow-200 shadow-lg";
      case "good":
        return "bg-white border-green-200 shadow-lg";
      default:
        return "bg-white border-border shadow-lg";
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "good":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-medium text-foreground">⚡ Análisis de Riesgos IA</p>
      </div>
      
      {!hasIssues ? (
        <Card className="p-4 bg-white border-green-200 shadow-lg animate-fade-in rounded-[20px]">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                🎉 ¡Excelente salud financiera!
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
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
                  className={`p-3 transition-all duration-500 rounded-[20px] ${getIndicatorStyle(indicator.level)}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {getIcon(indicator.level)}
                    </div>
                    <p className="text-xs text-foreground leading-snug flex-1">
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
