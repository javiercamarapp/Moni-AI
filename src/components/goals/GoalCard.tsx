import { Plus, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useGoalCelebrations } from "@/hooks/useGoalCelebrations";
import { getGoalIcon } from "@/lib/goalIcons";

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

  // Use shared icon utility based on goal title
  const Icon = getGoalIcon(goal.title);

  const getProgressColor = () => {
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-cyan-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-purple-500";
  };

  return (
    <div 
      className="bg-white rounded-[1.75rem] shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-white/50 overflow-hidden"
      onClick={onViewDetails}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#F5F0EE] flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#8D6E63]" />
              </div>
              <h3 className="font-bold text-[#5D4037] text-base tracking-tight">
                {goal.title}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium ml-10">{goal.category}</p>
          </div>
          <div className="text-right ml-4">
            <p className="text-2xl font-black text-[#5D4037] tracking-tight">
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

        {/* Stats Grid */}
        <div className="flex items-center justify-between text-xs mb-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Actual</p>
            <p className="font-bold text-[#5D4037]">{formatCurrency(goal.current)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Falta</p>
            <p className="font-bold text-[#5D4037]">{formatCurrency(remaining)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Meta</p>
            <p className="font-bold text-[#5D4037]">{formatCurrency(goal.target)}</p>
          </div>
        </div>

        {/* AI Prediction */}
        {goal.predicted_completion_date && (
          <div className="bg-[#F5F0EE] rounded-xl p-3 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#8D6E63] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[#5D4037] font-medium mb-0.5">
                  Podrías lograrlo el {new Date(goal.predicted_completion_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </p>
                {goal.required_weekly_saving && (
                  <p className="text-[10px] text-[#8D6E63]">
                    💰 {formatCurrency(goal.required_weekly_saving)}/semana
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {progress >= 100 ? (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await createCelebration(
                  goal.id,
                  'goal_completed',
                  `¡Completé mi meta de ${goal.title}!`
                );
                onComplete();
              }}
              className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              Completar
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddFunds();
              }}
              className="flex-1 h-10 bg-[#8D6E63] hover:bg-[#795548] rounded-xl shadow-sm text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="h-10 px-4 bg-[#F5F0EE] hover:bg-[#EBE5E2] rounded-xl text-[#5D4037] font-bold text-xs transition-all active:scale-95"
          >
            Detalles
          </button>
        </div>
      </div>
    </div>
  );
};
