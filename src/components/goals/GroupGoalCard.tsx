import { Users, Target, TrendingUp, Calendar, MessageCircle, Sparkles } from "lucide-react";
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
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#c8a57b]/20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#f5efea] to-white p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="bg-white border border-[#c8a57b]/20 rounded-lg px-3 py-1">
            <p className="text-xs font-medium text-gray-700">👥 {goal.circle_name}</p>
            <p className="text-[10px] text-gray-500">{goal.member_count} miembros</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{progress.toFixed(0)}%</div>
          </div>
        </div>
        
        <h3 className="text-base font-bold text-gray-900 mb-1">{goal.title}</h3>
        {goal.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{goal.description}</p>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Group Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Progreso grupal</span>
            <span className="font-medium text-gray-900">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
          </div>
          <Progress 
            value={progress} 
            className="h-3"
            indicatorClassName="bg-gradient-to-r from-purple-500 to-cyan-500"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f5efea] rounded-xl p-3 border border-[#c8a57b]/10">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3 w-3 text-[#c8a57b]" />
              <span className="text-[10px] font-medium text-gray-600">Por persona</span>
            </div>
            <p className="text-xs font-semibold text-gray-900">{formatCurrency(perPersonCurrent)}</p>
            <p className="text-[10px] text-gray-600">de {formatCurrency(perPersonTarget)}</p>
          </div>
          
          {daysRemaining !== null && (
            <div className="bg-[#f5efea] rounded-xl p-3 border border-[#c8a57b]/10">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-[#c8a57b]" />
                <span className="text-[10px] font-medium text-gray-600">Tiempo restante</span>
              </div>
              <p className="text-xs font-semibold text-gray-900">{daysRemaining} días</p>
            </div>
          )}
        </div>

        {/* Members Progress */}
        {members.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Contribuciones del equipo</p>
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((member, idx) => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-cyan-400 text-white text-xs">
                    {idx + 1}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">+{members.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Prediction */}
        {(goal.predicted_completion_date || goal.required_weekly_saving) && (
          <div className="bg-gradient-to-r from-[#f5efea] to-white rounded-xl p-3 border border-[#c8a57b]/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#c8a57b] mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 mb-1">🤖 Predicción Moni AI</p>
                {goal.predicted_completion_date && (
                  <p className="text-[11px] text-gray-700 mb-1">
                    Cumplirán el <strong>{new Date(goal.predicted_completion_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </p>
                )}
                {goal.required_weekly_saving && (
                  <p className="text-[10px] text-gray-600">
                    💰 Cada miembro: {formatCurrency(goal.required_weekly_saving / goal.member_count)}/semana
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onAddContribution}
            className="flex-1 h-10 bg-white border-2 border-[#c8a57b] text-gray-900 hover:bg-[#e3c890] hover:border-[#e3c890] rounded-xl font-medium transition-all duration-300"
          >
            <Target className="h-4 w-4 mr-1" />
            Contribuir
          </Button>
          <Button
            onClick={onViewDetails}
            variant="outline"
            className="h-10 px-4 rounded-xl border-[#c8a57b]/30 hover:bg-[#c8a57b]/5"
          >
            💬
          </Button>
        </div>
      </div>
    </div>
  );
};
