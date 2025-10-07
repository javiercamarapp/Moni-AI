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
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <p className="text-xs font-medium text-white/80">⚡ Análisis de Riesgos IA</p>
      </div>
      
      {!hasIssues ? (
        <Card className="p-4 bg-gradient-to-br from-emerald-600/90 to-emerald-800/90 card-glow border-emerald-500/30 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-200 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">
                🎉 ¡Excelente salud financiera!
              </p>
              <p className="text-xs text-emerald-200 leading-snug">
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
                  className={`p-3 card-glow transition-all duration-500 ${getIndicatorStyle(indicator.level)}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {getIcon(indicator.level)}
                    </div>
                    <p className="text-xs text-white/90 leading-snug flex-1">
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
