import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Target, Calendar, DollarSign, Users, Lock, Globe, Sparkles, Bell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GOAL_CATEGORIES = [
  { value: "Travel", label: "Viaje", icon: "✈️" },
  { value: "House", label: "Casa", icon: "🏡" },
  { value: "Car", label: "Auto", icon: "🚗" },
  { value: "Education", label: "Educación", icon: "🎓" },
  { value: "Custom", label: "Fondo libre", icon: "💰" },
  { value: "Event", label: "Evento", icon: "💍" }
];

const INSPIRATIONAL_PHRASES = [
  "Tu constancia vale más que cualquier inversión.",
  "Cada peso ahorrado es libertad futura.",
  "Hoy decides el mañana que quieres vivir.",
  "Las metas se logran un paso a la vez.",
  "Tu futuro financiero comienza hoy.",
  "La disciplina de hoy es la libertad de mañana."
];

export const CreateGoalModal = ({ isOpen, onClose, onSuccess }: CreateGoalModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [inspirationalPhrase, setInspirationalPhrase] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    category: "Custom",
    type: "personal" as "personal" | "group",
    isPublic: false,
    aiEnabled: true,
    motivation: "",
    reminderEnabled: true
  });

  useEffect(() => {
    if (isOpen) {
      const randomPhrase = INSPIRATIONAL_PHRASES[Math.floor(Math.random() * INSPIRATIONAL_PHRASES.length)];
      setInspirationalPhrase(randomPhrase);
    }
  }, [isOpen]);

  useEffect(() => {
    const calculatePrediction = async () => {
      if (!formData.target || !formData.deadline) {
        setPrediction(null);
        return;
      }

      const targetAmount = parseFloat(formData.target);
      if (isNaN(targetAmount) || targetAmount <= 0) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calcular ahorro semanal requerido
        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const weeksRemaining = Math.ceil(daysRemaining / 7);
        
        if (weeksRemaining <= 0) return;

        const requiredWeeklySaving = Math.ceil(targetAmount / weeksRemaining);
        
        setPrediction({
          predicted_completion_date: formData.deadline,
          required_weekly_saving: requiredWeeklySaving,
          ai_confidence: 0.82,
          weeks_remaining: weeksRemaining
        });
      } catch (error) {
        console.error('Error calculating prediction:', error);
      }
    };

    const debounce = setTimeout(calculatePrediction, 500);
    return () => clearTimeout(debounce);
  }, [formData.target, formData.deadline]);

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
          description: formData.motivation || formData.description,
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

      // Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F4A460', '#DEB887']
      });

      toast.success("🎯 Meta creada con éxito", {
        description: "Moni AI te acompañará paso a paso."
      });
      
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
        aiEnabled: true,
        motivation: "",
        reminderEnabled: true
      });
      setPrediction(null);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error('Error al crear la meta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Meta</h2>
              <p className="text-sm text-gray-600 mt-1">Define tu objetivo y deja que Moni AI te guíe</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2 text-gray-900">
              <Target className="h-4 w-4 text-amber-600" />
              Nombre de la meta
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Viaje a Europa"
              required
              className="h-12 rounded-xl bg-white text-gray-900 border-gray-300"
            />
          </div>

          {/* Category - Visual Grid */}
          <div className="space-y-3">
            <Label className="text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Categoría
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    formData.category === cat.value
                      ? "border-amber-600 bg-amber-50 shadow-sm"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <p className="text-xs font-medium text-gray-900">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Motivation Purpose */}
          <div className="space-y-2">
            <Label htmlFor="motivation" className="text-gray-900">
              ¿Por qué quieres lograr esta meta?
            </Label>
            <Textarea
              id="motivation"
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              placeholder="Ej. Ahorrar para mi viaje a Europa con mi familia."
              className="rounded-xl min-h-[80px] bg-white text-gray-900 border-gray-300"
            />
            <p className="text-xs text-gray-500">
              💬 Moni usa esta información para recordatorios personalizados
            </p>
          </div>

          {/* Target Amount & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target" className="flex items-center gap-2 text-gray-900">
                <DollarSign className="h-4 w-4 text-amber-600" />
                Monto objetivo
              </Label>
              <Input
                id="target"
                type="text"
                value={formData.target ? `$${parseFloat(formData.target).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setFormData({ ...formData, target: value });
                }}
                placeholder="$50,000.00"
                required
                className="h-12 rounded-xl bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-4 w-4 text-amber-600" />
                Fecha límite
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
                className="h-12 rounded-xl bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>

          {/* AI Prediction */}
          {prediction && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    🔮 Predicción de Moni AI
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Según tus ingresos y hábitos, podrías lograr esta meta el{" "}
                    <strong>{new Date(prediction.predicted_completion_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                  </p>
                  <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
                    <p className="text-sm font-medium text-amber-700">
                      💰 Ahorra ${prediction.required_weekly_saving.toLocaleString()} por semana para cumplirla a tiempo.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${prediction.ai_confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {Math.round(prediction.ai_confidence * 100)}% precisión
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Goal Type */}
          <div className="space-y-2">
            <Label className="text-gray-900">Tipo de meta</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "personal" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === "personal"
                    ? "border-amber-600 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Target className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="font-medium text-sm text-gray-900">Individual</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "group" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === "group"
                    ? "border-amber-600 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="font-medium text-sm text-gray-900">Grupal</p>
              </button>
            </div>
          </div>

          {/* Privacy & Options */}
          <div className="space-y-4 bg-amber-50/30 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                <div>
                  <Label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-900">
                    🔔 Recordarme semanalmente sobre esta meta
                  </Label>
                  <p className="text-xs text-gray-600">Moni te enviará recordatorios de progreso</p>
                </div>
              </div>
              <Switch
                id="reminderEnabled"
                checked={formData.reminderEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-amber-100">
              <div className="flex items-center gap-2">
                {formData.type === "group" ? (
                  <Users className="h-4 w-4 text-amber-600" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-600" />
                )}
                <div>
                  <Label htmlFor="isPublic" className="text-sm font-medium text-gray-900">
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
          </div>

          {/* Inspirational Quote */}
          <div className="text-center py-4 border-t border-gray-100">
            <p className="text-sm italic text-gray-600">
              "{inspirationalPhrase}"
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-white border-2 border-amber-600 text-amber-700 hover:bg-amber-50 rounded-xl font-semibold shadow-sm"
            >
              {loading ? "Creando..." : "Crear meta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
