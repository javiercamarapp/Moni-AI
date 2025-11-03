import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Target, Calendar, DollarSign, Users, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GOAL_CATEGORIES = [
  { value: "Travel", label: "Viajes", icon: "✈️" },
  { value: "Tech", label: "Tecnología", icon: "💻" },
  { value: "Education", label: "Educación", icon: "🎓" },
  { value: "Emergency Fund", label: "Fondo de emergencia", icon: "🛡️" },
  { value: "Investment", label: "Inversión", icon: "📈" },
  { value: "Lifestyle", label: "Estilo de vida", icon: "🌟" },
  { value: "Custom", label: "Personalizado", icon: "🎯" }
];

export const CreateGoalModal = ({ isOpen, onClose, onSuccess }: CreateGoalModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    category: "Custom",
    type: "personal" as "personal" | "group",
    isPublic: false,
    aiEnabled: true
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated");

      const targetAmount = parseFloat(formData.target);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        toast.error("Ingresa un monto válido");
        return;
      }

      const selectedCategory = GOAL_CATEGORIES.find(c => c.value === formData.category);

      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          target: targetAmount,
          current: 0,
          deadline: formData.deadline || null,
          category: formData.category,
          icon: selectedCategory?.icon,
          type: formData.type,
          is_public: formData.isPublic,
          start_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Calculate AI prediction
      if (formData.aiEnabled && goalData) {
        const { data: prediction } = await supabase.rpc('calculate_goal_prediction', {
          p_goal_id: goalData.id,
          p_target_amount: targetAmount,
          p_current_savings: 0,
          p_deadline: formData.deadline || null
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
            .eq('id', goalData.id);
        }
      }

      toast.success("Meta creada exitosamente");
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        target: "",
        deadline: "",
        category: "Custom",
        type: "personal",
        isPublic: false,
        aiEnabled: true
      });
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error('Error al crear la meta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Crear Nueva Meta</h2>
              <p className="text-sm text-white/80 mt-1">Define tu objetivo y deja que Moni AI te guíe</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              Nombre de la meta
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Viaje a Europa"
              required
              className="h-12 rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe tu meta..."
              className="rounded-xl min-h-[80px]"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Amount & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Monto objetivo
              </Label>
              <Input
                id="target"
                type="number"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                placeholder="$50,000"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-600" />
                Fecha límite (opcional)
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Goal Type */}
          <div className="space-y-2">
            <Label>Tipo de meta</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "personal" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === "personal"
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="font-medium text-sm">Individual</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "group" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === "group"
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="font-medium text-sm">Grupal</p>
              </button>
            </div>
          </div>

          {/* Privacy & AI */}
          <div className="space-y-4 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.isPublic ? (
                  <Globe className="h-4 w-4 text-cyan-600" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-600" />
                )}
                <div>
                  <Label htmlFor="isPublic" className="text-sm font-medium">
                    Visible para amigos
                  </Label>
                  <p className="text-xs text-gray-600">Tus amigos podrán ver tu progreso</p>
                </div>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <Label htmlFor="aiEnabled" className="text-sm font-medium">
                  Predicciones con AI
                </Label>
                <p className="text-xs text-gray-600">Moni AI calculará cuánto ahorrar</p>
              </div>
              <Switch
                id="aiEnabled"
                checked={formData.aiEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, aiEnabled: checked })}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl font-medium"
            >
              {loading ? "Creando..." : "Crear meta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
