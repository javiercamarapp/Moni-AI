import { Users, Target, TrendingUp, Calendar, MessageCircle, Sparkles, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";

interface Member {
  id: string;
  user_id: string;
  xp: number;
}

interface GroupGoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
    circle_name: string;
    member_count: number;
    category?: string;
    predicted_completion_date?: string;
    required_weekly_saving?: number;
  };
  members?: Member[];
  onViewDetails: () => void;
  onAddContribution: () => void;
}

export const GroupGoalCard = ({ goal, members = [], onViewDetails, onAddContribution }: GroupGoalCardProps) => {
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;
  const perPersonTarget = members.length > 0 ? goal.target_amount / members.length : goal.target_amount;
  const perPersonCurrent = members.length > 0 ? goal.current_amount / members.length : goal.current_amount;

  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

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
              <span className="text-2xl">👥</span>
              <h3 className="font-semibold text-gray-900 text-sm tracking-tight">
                {goal.title}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{goal.circle_name} • {goal.member_count} miembros</p>
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
            <p className="font-semibold text-gray-900">{formatCurrency(goal.current_amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Falta</p>
            <p className="font-semibold text-gray-900">{formatCurrency(remaining)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Meta</p>
            <p className="font-semibold text-gray-900">{formatCurrency(goal.target_amount)}</p>
          </div>
        </div>

        {/* AI Prediction - Compacto */}
        {goal.predicted_completion_date && (
          <div className="bg-gray-50 rounded-lg p-2.5 mb-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-900 font-medium mb-0.5">
                  Podrían lograrlo el {new Date(goal.predicted_completion_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </p>
                {goal.required_weekly_saving && (
                  <p className="text-[9px] text-gray-600">
                    💰 {formatCurrency(goal.required_weekly_saving / goal.member_count)}/semana por miembro
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions - Minimalista */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddContribution();
            }}
            className="flex-1 h-9 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/80 text-gray-900 font-medium text-xs transition-all flex items-center justify-center gap-1.5 border-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Contribuir
          </button>
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
