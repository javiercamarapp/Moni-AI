import { Target, Calendar, TrendingUp, Plus, Sparkles, Bell, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useGoalCelebrations } from "@/hooks/useGoalCelebrations";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    target: number;
    current: number;
    deadline?: string;
    category: string;
    icon?: string;
    predicted_completion_date?: string;
    required_weekly_saving?: number;
    ai_confidence?: number;
  };
  onAddFunds: () => void;
  onViewDetails: () => void;
  onComplete: () => void;
}

export const GoalCard = ({ goal, onAddFunds, onViewDetails, onComplete }: GoalCardProps) => {
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const { createCelebration } = useGoalCelebrations();
  const progress = (goal.current / goal.target) * 100;
  const remaining = goal.target - goal.current;
  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  const weeksRemaining = daysRemaining ? Math.ceil(daysRemaining / 7) : 0;
  const suggestedIncrease = goal.required_weekly_saving ? Math.round(goal.required_weekly_saving * 0.1) : 0;

  const getCategoryIcon = () => {
    switch (goal.category) {
      case "Travel": return "✈️";
      case "Tech": return "💻";
      case "Education": return "🎓";
      case "Emergency Fund": return "🛡️";
      default: return goal.icon || "🎯";
    }
  };

  const getProgressColor = () => {
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-cyan-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-purple-500";
  };

  return (
    <div 
      className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200/50 overflow-hidden"
      onClick={onViewDetails}
    >
      {/* Header - Minimalista */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getCategoryIcon()}</span>
              <h3 className="font-semibold text-gray-900 text-sm tracking-tight">
                {goal.title}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{goal.category}</p>
          </div>
          <div className="text-right ml-4">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {progress.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Progress Bar - Apple Style */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
              progress >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
              progress >= 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
              progress >= 25 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
              'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Stats Grid - Minimalista */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Ahorro Actual</p>
            <p className="font-semibold text-gray-900">{formatCurrency(goal.current)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Falta</p>
            <p className="font-semibold text-gray-900">{formatCurrency(remaining)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Meta</p>
            <p className="font-semibold text-gray-900">{formatCurrency(goal.target)}</p>
          </div>
        </div>

        {/* AI Prediction - Compacto */}
        {goal.predicted_completion_date && (
          <div className="bg-gray-50 rounded-lg p-2.5 mb-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-900 font-medium mb-0.5">
                  Podrías lograrlo el {new Date(goal.predicted_completion_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </p>
                {goal.required_weekly_saving && (
                  <p className="text-[9px] text-gray-600">
                    💰 {formatCurrency(goal.required_weekly_saving)}/semana
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions - Minimalista */}
        <div className="flex gap-2">
          {progress >= 100 ? (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // Crear celebración cuando se completa la meta
                await createCelebration(
                  goal.id,
                  'goal_completed',
                  `¡Completé mi meta de ${goal.title}!`
                );
                onComplete();
              }}
              className="flex-1 h-9 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 border-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Terminar Meta
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddFunds();
              }}
              className="flex-1 h-9 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/80 text-gray-900 font-medium text-xs transition-all flex items-center justify-center gap-1.5 border-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar fondos
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="h-9 px-4 bg-gray-50 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 text-gray-600 font-medium text-xs transition-all border-0"
          >
            Ver más
          </button>
        </div>
      </div>
    </div>
  );
};
