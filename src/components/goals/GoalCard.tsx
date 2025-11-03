import { Target, Calendar, TrendingUp, Plus, Sparkles, Bell, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

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
}

export const GoalCard = ({ goal, onAddFunds, onViewDetails }: GoalCardProps) => {
  const [reminderEnabled, setReminderEnabled] = useState(true);
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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-4 flex items-center justify-between">
        <div>
          <div className="text-4xl mb-2">{getCategoryIcon()}</div>
          <h3 className="text-base font-semibold text-gray-900">{goal.title}</h3>
          <p className="text-xs text-gray-600">{goal.category}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{progress.toFixed(0)}%</div>
          <div className="text-xs text-gray-600">completado</div>
          {goal.ai_confidence && (
            <div className="bg-amber-100 rounded-lg px-2 py-1 mt-2 inline-block">
              <p className="text-[10px] font-semibold text-amber-700">
                {Math.round(goal.ai_confidence * 100)}% IA
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div>
          <Progress 
            value={progress} 
            className="h-3"
            indicatorClassName={getProgressColor()}
          />
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>{formatCurrency(goal.current)}</span>
            <span className="font-medium text-gray-900">{formatCurrency(goal.target)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3 w-3 text-purple-600" />
              <span className="text-[10px] font-medium text-gray-600">Restante</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatCurrency(remaining)}</p>
          </div>
          
          {daysRemaining !== null && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-cyan-600" />
                <span className="text-[10px] font-medium text-gray-600">Días restantes</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{daysRemaining} días</p>
            </div>
          )}
        </div>

        {/* AI Prediction */}
        {goal.predicted_completion_date && (
          <div className="bg-gradient-to-r from-cyan-50 to-purple-50 rounded-xl p-3 border border-purple-100">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 mb-1">Predicción IA</p>
                <p className="text-[11px] text-gray-700">
                  Podrías lograrlo el <strong>{new Date(goal.predicted_completion_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </p>
                {goal.required_weekly_saving && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    💰 Ahorra {formatCurrency(goal.required_weekly_saving)}/semana
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestion */}
        {progress < 70 && suggestedIncrease > 0 && (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-gray-900 mb-1">Sugerencia dinámica</p>
                <p className="text-[10px] text-gray-700">
                  Si aumentas tu ahorro semanal en {formatCurrency(suggestedIncrease)}, podrías cumplirla {Math.ceil(weeksRemaining * 0.1)} semanas antes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-600" />
            <p className="text-xs text-gray-700">Recordatorio semanal</p>
          </div>
          <Switch
            checked={reminderEnabled}
            onCheckedChange={setReminderEnabled}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onAddFunds}
            className="flex-1 h-10 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl font-medium"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar fondos
          </Button>
          <Button
            onClick={onViewDetails}
            variant="outline"
            className="h-10 px-4 rounded-xl border-gray-200"
          >
            Ver más
          </Button>
        </div>
      </div>
    </div>
  );
};
