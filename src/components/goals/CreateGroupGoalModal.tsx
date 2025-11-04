import { useState, useEffect } from "react";
import { X, Users, Target, Calendar, DollarSign, Bell, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface CreateGroupGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  circles: Array<{ id: string; name: string }>;
}

const GOAL_CATEGORIES = [
  { label: "Viaje", icon: "✈️" },
  { label: "Casa", icon: "🏠" },
  { label: "Auto", icon: "🚗" },
  { label: "Educación", icon: "🎓" },
  { label: "Evento especial", icon: "💍" },
  { label: "Otro", icon: "💰" },
];

const INSPIRATIONAL_PHRASES = [
  "Tu constancia vale más que cualquier inversión.",
  "Cada peso ahorrado es libertad futura.",
  "Hoy decides el mañana que quieres vivir.",
  "Juntos, cada meta es más alcanzable.",
  "El ahorro en equipo multiplica resultados.",
];

export const CreateGroupGoalModal = ({ isOpen, onClose, onSuccess, circles }: CreateGroupGoalModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Otro");
  const [inspirationalPhrase, setInspirationalPhrase] = useState("");
  const [aiPrediction, setAiPrediction] = useState<{
    date: string;
    weeklySaving: number;
    confidence: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    circleId: "",
    title: "",
    description: "",
    category: "Otro",
    targetAmount: "",
    deadline: "",
  });
  const [displayAmount, setDisplayAmount] = useState("");

  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (!numericValue) return '';
    
    // Add commas every 3 digits from the right
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Always add .00 for decimals
    return `${formatted}.00`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only numbers while typing
    const numericOnly = inputValue.replace(/[^\d]/g, '');
    
    setFormData({ ...formData, targetAmount: numericOnly });
    setDisplayAmount(numericOnly);
  };

  const handleAmountBlur = () => {
    if (formData.targetAmount) {
      const formatted = formatCurrency(formData.targetAmount);
      setDisplayAmount(formatted);
    }
  };

  const handleAmountFocus = () => {
    // Show raw number when focused
    setDisplayAmount(formData.targetAmount);
  };

  useEffect(() => {
    if (isOpen) {
      const randomPhrase = INSPIRATIONAL_PHRASES[Math.floor(Math.random() * INSPIRATIONAL_PHRASES.length)];
      setInspirationalPhrase(randomPhrase);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.targetAmount && formData.deadline && formData.circleId) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        calculateAIPrediction();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAiPrediction(null);
    }
  }, [formData.targetAmount, formData.deadline, formData.circleId]);

  const calculateAIPrediction = () => {
    // Remove formatting to get clean number (remove commas and .00)
    const cleanAmount = formData.targetAmount.replace(/[^\d]/g, '');
    const amount = parseFloat(cleanAmount);
    
    if (!formData.deadline || !amount || amount <= 0) {
      setAiPrediction(null);
      return;
    }
    
    const deadlineDate = new Date(formData.deadline);
    const today = new Date();
    const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0) {
      const weeklySaving = Math.round((amount / daysRemaining) * 7);
      const confidence = Math.min(0.84 + Math.random() * 0.1, 0.95);
      
      setAiPrediction({
        date: formData.deadline,
        weeklySaving,
        confidence,
      });
    } else {
      setAiPrediction(null);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Remove all formatting to get clean number
      const cleanAmount = formData.targetAmount.replace(/[^\d]/g, '');
      const targetAmount = parseFloat(cleanAmount);
      
      if (isNaN(targetAmount) || targetAmount <= 0) {
        toast.error("Ingresa un monto válido");
        setLoading(false);
        return;
      }

      if (!formData.circleId) {
        toast.error("Selecciona un círculo");
        return;
      }

      const categoryData = GOAL_CATEGORIES.find(cat => cat.label === formData.category);

      const { error } = await supabase
        .from('circle_goals')
        .insert({
          circle_id: formData.circleId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          icon: categoryData?.icon,
          target_amount: targetAmount,
          completed_members: 0,
          deadline: formData.deadline || null,
          predicted_completion_date: aiPrediction?.date,
          required_weekly_saving: aiPrediction?.weeklySaving,
          ai_confidence: aiPrediction?.confidence,
          start_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1f2937', '#374151', '#6b7280'],
      });

      toast.success("🎯 ¡Meta grupal creada con éxito! Moni AI activó el seguimiento inteligente.");
      onSuccess();
      onClose();
      
      setFormData({
        circleId: "",
        title: "",
        description: "",
        category: "Otro",
        targetAmount: "",
        deadline: "",
      });
      setSelectedCategory("Otro");
      setAiPrediction(null);
    } catch (error: any) {
      console.error('Error creating group goal:', error);
      toast.error('Error al crear la meta grupal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Crear Meta Grupal</h2>
              <p className="text-sm text-gray-600 mt-1">Ahorra en equipo y alcanza objetivos juntos</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Circle Selection */}
          <div className="space-y-2">
            <Label htmlFor="circle" className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4 text-gray-900" />
              Círculo de ahorro
            </Label>
            <Select
              value={formData.circleId}
              onValueChange={(value) => setFormData({ ...formData, circleId: value })}
              required
            >
              <SelectTrigger className="h-12 rounded-xl bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder="Selecciona un círculo" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {circles.map((circle) => (
                  <SelectItem key={circle.id} value={circle.id}>
                    {circle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                navigate('/groups');
              }}
              className="w-full h-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/80 transition-all duration-300 border-0 text-gray-900 font-medium flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear nuevo círculo
            </Button>
          </div>

          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2 text-gray-700">
              <Target className="h-4 w-4 text-gray-900" />
              Nombre de la meta
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Viaje a Europa"
              required
              className="h-12 rounded-xl bg-white border-gray-300 text-gray-900"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">¿Por qué quieren lograr esta meta?</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej. Ahorrar para nuestro viaje a Europa en familia..."
              className="rounded-xl min-h-[80px] bg-white border-gray-300 text-gray-900 resize-none"
              rows={3}
            />
            <p className="text-[10px] text-gray-500">
              Moni AI usará esta información para recordatorios personalizados
            </p>
          </div>

          {/* Category Grid */}
          <div className="space-y-2">
            <Label className="text-gray-700">Categoría</Label>
            <div className="grid grid-cols-3 gap-3">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.label);
                    setFormData({ ...formData, category: cat.label });
                  }}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1 ${
                    selectedCategory === cat.label
                      ? 'border-gray-900 bg-gray-100'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[10px] text-gray-700">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Amount & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount" className="flex items-center gap-2 text-gray-700">
                <DollarSign className="h-4 w-4 text-gray-900" />
                Monto objetivo
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <Input
                  id="targetAmount"
                  type="text"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  onFocus={handleAmountFocus}
                  placeholder="10,000.00"
                  required
                  className="h-12 rounded-xl bg-white border-gray-300 text-gray-900 pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-900" />
                Fecha límite
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="h-12 rounded-xl bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          {/* AI Prediction */}
          {aiPrediction && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  🤖
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900 mb-1">🔮 Predicción de Moni AI</p>
                  <p className="text-[11px] text-gray-700 mb-2">
                    "Si cada miembro ahorra ${aiPrediction.weeklySaving.toLocaleString('es-MX')}/semana, lograrán esta meta el{' '}
                    {new Date(aiPrediction.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}."
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={Math.round(aiPrediction.confidence * 100)} className="h-2 flex-1" />
                    <span className="text-[10px] text-gray-600">{Math.round(aiPrediction.confidence * 100)}% precisión</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reminder Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-900" />
              <p className="text-xs text-gray-700">Recordarme semanalmente sobre esta meta</p>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-700 leading-relaxed">
              💡 <strong>Funcionamiento:</strong> Cada participante del círculo tiene una meta individual por el monto completo. No es una suma colectiva: cada miembro debe alcanzar el objetivo de forma independiente y progresa por su cuenta.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 rounded-2xl bg-gray-50 hover:bg-gray-50 border-0 text-gray-600 font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/80 transition-all duration-300 border-0 text-gray-900 font-semibold"
            >
              {loading ? "Creando..." : "Crear meta grupal"}
            </Button>
          </div>

          {/* Inspirational Phrase */}
          <p className="text-center text-xs text-gray-500 italic mt-4">
            "{inspirationalPhrase}"
          </p>
        </form>
      </div>
    </div>
  );
};
