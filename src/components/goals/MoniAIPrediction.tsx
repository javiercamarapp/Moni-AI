import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface MoniAIPredictionProps {
  goalId: string;
}

export default function MoniAIPrediction({ goalId }: MoniAIPredictionProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-goal-insights', {
          body: { goalId }
        });

        if (error) throw error;

        if (data?.insights && Array.isArray(data.insights)) {
          setInsights(data.insights);
        }
      } catch (error) {
        console.error('Error fetching insights:', error);
        // Fallback insights if API fails
        setInsights([
          "💰 Revisa tus gastos diarios para identificar áreas de ahorro",
          "📊 Mantén un seguimiento constante de tu progreso financiero",
          "🎯 Establece recordatorios para hacer aportes regulares a tu meta",
          "⏰ La constancia es clave para alcanzar tus objetivos financieros",
          "🚀 Pequeños ahorros diarios suman grandes resultados a largo plazo"
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [goalId]);

  useEffect(() => {
    if (insights.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [insights.length]);

  if (loading) {
    return (
      <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
        <div className="p-3 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <p className="text-xs text-gray-600">Generando insights...</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  const currentInsight = insights[currentIndex];

  return (
    <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="p-3 flex items-start gap-2">
        <div className="text-lg flex-shrink-0">
          {currentInsight.split(' ')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 mb-0.5">Insight {currentIndex + 1} de {insights.length}</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {currentInsight.split(' ').slice(1).join(' ')}
          </p>
        </div>
      </div>
      {/* Progress dots */}
      <div className="flex justify-center gap-1 pb-2">
        {insights.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-4 bg-gray-900' : 'w-1 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
