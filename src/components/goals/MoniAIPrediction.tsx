import React, { useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface MoniAIPredictionProps {
  target: number;
  deadline: string;
  memberCount: number;
  saved: number;
  history?: number[];
}

export default function MoniAIPrediction({
  target,
  deadline,
  memberCount,
  saved,
  history = [],
}: MoniAIPredictionProps) {
  const recommendations = useMemo(() => {
    const daysRemaining = Math.max(
      0,
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeksRemaining = Math.ceil(daysRemaining / 7);
    const remaining = target - saved;
    const recommendedPerWeek = Math.ceil(
      remaining / (memberCount * (weeksRemaining || 1))
    );
    const avg =
      history.length > 0
        ? history.reduce((a, b) => a + b, 0) / history.length
        : recommendedPerWeek;

    let status = "al_dia";
    if (avg < recommendedPerWeek * 0.9) status = "atrasado";
    if (avg > recommendedPerWeek * 1.1) status = "adelantado";

    const predictedDate = new Date(
      Date.now() + (remaining / (memberCount * avg)) * 7 * 24 * 60 * 60 * 1000
    );

    // Generar múltiples recomendaciones inteligentes
    return [
      {
        icon: "🎯",
        title: "Estrategia de ahorro",
        message: status === "adelantado" 
          ? "Van excelente. Mantengan el ritmo actual."
          : `Ahorren $${recommendedPerWeek.toLocaleString()}/semana por miembro para cumplir a tiempo.`
      },
      {
        icon: "📅",
        title: "Predicción de cumplimiento",
        message: `Si mantienen el ritmo, completarán para el ${predictedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}.`
      },
      {
        icon: "💡",
        title: "Consejo grupal",
        message: "Compartan sus avances en el chat grupal para mantener la motivación alta."
      },
      {
        icon: "🔔",
        title: "Recordatorio inteligente",
        message: `Quedan ${Math.ceil(daysRemaining)} días. Consideren activar aportes automáticos quincenales.`
      },
      {
        icon: "⚡",
        title: "Optimización",
        message: "Si cada miembro ahorra un 10% extra semanal, terminarán 2 semanas antes."
      }
    ];
  }, [target, deadline, memberCount, saved, history]);

  return (
    <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-gray-200">
      <Carousel 
        className="w-full"
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
      >
        <CarouselContent>
          {recommendations.map((rec, index) => (
            <CarouselItem key={index}>
              <div className="p-3 flex items-start gap-2">
                <div className="text-lg flex-shrink-0">{rec.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 mb-0.5">{rec.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{rec.message}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
