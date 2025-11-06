import React, { useMemo } from "react";

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
  const recommendation = useMemo(() => {
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

    return {
      icon: "💡",
      title: "Consejo inteligente",
      message: status === "adelantado" 
        ? "Van excelente. Mantengan el ritmo actual para cumplir antes de tiempo."
        : `Ahorren $${recommendedPerWeek.toLocaleString()}/semana por miembro para cumplir a tiempo.`
    };
  }, [target, deadline, memberCount, saved, history]);

  return (
    <div className="animate-fade-in bg-gray-50 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="p-3 flex items-start gap-2">
        <div className="text-lg flex-shrink-0">{recommendation.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 mb-0.5">{recommendation.title}</p>
          <p className="text-xs text-gray-600 leading-relaxed">{recommendation.message}</p>
        </div>
      </div>
    </div>
  );
}
