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
  const { message, predictedDate, status, recommendedPerWeek } = useMemo(() => {
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

    const predictedWeeks = remaining / (memberCount * avg);
    const predictedDate = new Date(
      Date.now() + predictedWeeks * 7 * 24 * 60 * 60 * 1000
    );

    let message = "";
    if (status === "adelantado")
      message = "🚀 Van por excelente camino. Terminarán antes del plazo.";
    if (status === "al_dia")
      message = `🟢 Van al día. Si cada miembro ahorra $${recommendedPerWeek.toLocaleString()}/semana, cumplirán a tiempo.`;
    if (status === "atrasado")
      message = `🔴 Van un poco retrasados. Si suben su aporte a $${recommendedPerWeek.toLocaleString()}/semana, aún pueden lograrlo.`;

    return { message, predictedDate, status, recommendedPerWeek };
  }, [target, deadline, memberCount, saved, history]);

  return (
    <div className="animate-fade-in animate-slide-up bg-card border border-border rounded-2xl p-4 shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl animate-pulse">🦉</div>
        <h3 className="font-semibold text-lg">Moni AI recomienda:</h3>
      </div>

      {/* Texto dinámico */}
      <p className="text-muted-foreground mb-3">{message}</p>

      <div className="border-t border-border my-3" />

      <p className="text-sm text-muted-foreground">
        Predicción: {predictedDate.toLocaleDateString()}
      </p>

      {status !== "al_dia" && (
        <button className="mt-3 border border-foreground rounded-full px-4 py-1.5 text-sm hover:bg-foreground hover:text-background transition-colors">
          Ajustar plan automáticamente
        </button>
      )}
    </div>
  );
}
