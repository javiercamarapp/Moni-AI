import { useState } from "react";
import { X, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: {
    id: string;
    title: string;
    target: number;
    current: number;
  };
}

export const AddFundsModal = ({ isOpen, onClose, onSuccess, goal }: AddFundsModalProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const remaining = goal.target - goal.current;
  const suggestedAmounts = [
    { label: "10%", value: remaining * 0.1 },
    { label: "25%", value: remaining * 0.25 },
    { label: "50%", value: remaining * 0.5 },
    { label: "Total", value: remaining }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error("Ingresa un monto válido");
        return;
      }

      const newCurrent = goal.current + amountNum;

      // Update goal
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          current: newCurrent,
          last_contribution_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', goal.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .from('goal_activities')
        .insert({
          goal_id: goal.id,
          user_id: user.id,
          activity_type: 'contribution',
          amount: amountNum,
          message: `Agregó ${formatCurrency(amountNum)} a la meta`
        });

      // Recalculate prediction
      const { data: goalData } = await supabase
        .from('goals')
        .select('deadline')
        .eq('id', goal.id)
        .single();

      if (goalData) {
        const { data: prediction } = await supabase.rpc('calculate_goal_prediction', {
          p_goal_id: goal.id,
          p_target_amount: goal.target,
          p_current_savings: newCurrent,
          p_deadline: goalData.deadline
        });

        if (prediction && typeof prediction === 'object') {
          const pred = prediction as any;
          await supabase
            .from('goals')
            .update({
              predicted_completion_date: pred.predicted_completion_date,
              required_daily_saving: pred.required_daily_saving,
              required_weekly_saving: pred.required_weekly_saving,
              ai_confidence: pred.ai_confidence
            })
            .eq('id', goal.id);
        }
      }

      toast.success("Fondos agregados exitosamente");
      onSuccess();
      onClose();
      setAmount("");
    } catch (error: any) {
      console.error('Error adding funds:', error);
      toast.error('Error al agregar fondos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-b from-amber-50/30 to-orange-50/20 p-6 rounded-t-2xl border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Agregar fondos</h2>
              <p className="text-sm text-gray-600 mt-1">{goal.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Progress Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ahorro actual</span>
              <span className="font-semibold text-gray-900">{formatCurrency(goal.current)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Meta</span>
              <span className="font-semibold text-gray-900">{formatCurrency(goal.target)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600">Restante</span>
              <span className="font-bold text-gray-900">{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-700" />
              Cantidad a agregar
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000.00"
              required
              step="0.01"
              min="0"
              className="h-14 rounded-xl text-lg bg-gray-50 border-gray-200 font-semibold text-gray-900"
            />
          </div>

          {/* Quick Amounts */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Montos rápidos</Label>
            <div className="grid grid-cols-4 gap-2">
              {suggestedAmounts.map((suggested) => (
                <button
                  key={suggested.label}
                  type="button"
                  onClick={() => setAmount(suggested.value.toFixed(2))}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900">{suggested.label}</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    ${suggested.value.toFixed(0)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-900 mb-1">Progreso actualizado</p>
                  <p className="text-[11px] text-gray-700">
                    Llegarás al <span className="font-semibold text-gray-900">
                      {((goal.current + parseFloat(amount)) / goal.target * 100).toFixed(1)}%
                    </span> de tu meta
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 bg-gray-50 hover:bg-gray-50 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all border-0 text-gray-600 font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/80 transition-all border-0 text-gray-900 font-semibold"
            >
              {loading ? "Procesando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
