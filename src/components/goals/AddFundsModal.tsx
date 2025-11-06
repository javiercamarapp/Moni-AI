import { useState, useEffect } from "react";
import { X, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [userAccounts, setUserAccounts] = useState<Array<{id: string, name: string, value: number}>>([]);
  const [enableNotifications, setEnableNotifications] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserAccounts();
    }
  }, [isOpen]);

  const fetchUserAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accounts, error } = await supabase
        .from('assets')
        .select('id, name, value, category')
        .eq('user_id', user.id)
        .eq('category', 'Activos líquidos')
        .order('value', { ascending: false });

      if (error) throw error;
      setUserAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

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

      // Only deduct from account if one is selected
      if (selectedAccount) {
        // Get selected account details
        const account = userAccounts.find(acc => acc.id === selectedAccount);
        if (!account) {
          toast.error("Cuenta no encontrada");
          return;
        }

        if (account.value < amountNum) {
          toast.error("Saldo insuficiente en la cuenta seleccionada");
          return;
        }

        // Deduct from account
        const { error: accountError } = await supabase
          .from('assets')
          .update({ value: account.value - amountNum })
          .eq('id', selectedAccount);

        if (accountError) throw accountError;
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
          message: selectedAccount 
            ? `Agregó ${formatCurrency(amountNum)} desde ${userAccounts.find(acc => acc.id === selectedAccount)?.name}`
            : `Agregó ${formatCurrency(amountNum)}`
        });

      // Schedule reminder if enabled
      if (enableNotifications) {
        await supabase
          .from('notification_history')
          .insert({
            user_id: user.id,
            notification_type: 'goal_reminder',
            message: `Recordatorio: Realizar aporte a la meta "${goal.title}"`,
            metadata: {
              goal_id: goal.id,
              reminder_type: 'biweekly',
              next_reminder: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
            }
          });
      }

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

      toast.success(selectedAccount 
        ? `Fondos agregados desde ${userAccounts.find(acc => acc.id === selectedAccount)?.name}`
        : "Fondos agregados exitosamente"
      );
      onSuccess();
      onClose();
      setAmount("");
      setSelectedAccount("");
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
        <div className="bg-gradient-to-b from-amber-50/30 to-orange-50/20 p-4 rounded-t-2xl border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Contribuir a la meta</h2>
              <p className="text-xs text-gray-600 mt-0.5">{goal.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Progress Info */}
          <div className="bg-gray-50 rounded-xl p-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Ahorro actual</span>
              <span className="font-semibold text-gray-900">{formatCurrency(goal.current)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Meta</span>
              <span className="font-semibold text-gray-900">{formatCurrency(goal.target)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
              <span className="text-gray-600">Restante</span>
              <span className="font-bold text-gray-900">{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="flex items-center gap-2 text-xs">
              <DollarSign className="h-3.5 w-3.5 text-gray-700" />
              Cantidad a agregar
            </Label>
            <Input
              id="amount"
              type="text"
              value={isFocused ? amount : (amount ? parseFloat(amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setAmount(value);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="1,000.00"
              required
              className="h-12 rounded-xl text-base bg-gray-50 border-gray-200 font-semibold text-gray-900"
            />
          </div>

          {/* Quick Amounts */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Montos rápidos</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {suggestedAmounts.map((suggested) => (
                <button
                  key={suggested.label}
                  type="button"
                  onClick={() => setAmount(suggested.value.toFixed(2))}
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900">{suggested.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    ${suggested.value.toFixed(0)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Account Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="account-select" className="flex items-center gap-2 text-xs text-gray-700">
              💳 Cuenta de origen (opcional)
            </Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm">
                <SelectValue placeholder="Sin cuenta - no descontar del patrimonio" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {userAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm">{account.name}</span>
                      <span className="text-xs text-muted-foreground ml-4">
                        {formatCurrency(account.value)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userAccounts.length === 0 && (
              <p className="text-xs text-gray-500">
                ℹ️ No tienes cuentas líquidas registradas.
              </p>
            )}
          </div>

          {/* Notification Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifications"
              checked={enableNotifications}
              onCheckedChange={(checked) => setEnableNotifications(!!checked)}
            />
            <label htmlFor="notifications" className="text-xs text-gray-700">
              Notificar cada 15 días para realizar aportaciones
            </label>
          </div>

          {/* AI Insight */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-900 mb-0.5">Progreso actualizado</p>
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
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-10 bg-gray-50 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-0 text-gray-600 font-medium text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-white/80 transition-all border-0 text-gray-900 font-semibold text-sm"
            >
              {loading ? "Procesando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
