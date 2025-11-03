import { useState } from "react";
import { X, Users, Target, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateGroupGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  circles: Array<{ id: string; name: string }>;
}

const GOAL_CATEGORIES = [
  { value: "Travel", label: "Viajes", icon: "✈️" },
  { value: "Tech", label: "Tecnología", icon: "💻" },
  { value: "Education", label: "Educación", icon: "🎓" },
  { value: "Investment", label: "Inversión", icon: "📈" },
  { value: "Lifestyle", label: "Estilo de vida", icon: "🌟" },
  { value: "Custom", label: "Personalizado", icon: "🎯" }
];

export const CreateGroupGoalModal = ({ isOpen, onClose, onSuccess, circles }: CreateGroupGoalModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    circleId: "",
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
    category: "Custom"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const targetAmount = parseFloat(formData.targetAmount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        toast.error("Ingresa un monto válido");
        return;
      }

      if (!formData.circleId) {
        toast.error("Selecciona un círculo");
        return;
      }

      const selectedCategory = GOAL_CATEGORIES.find(c => c.value === formData.category);

      const { error } = await supabase
        .from('circle_goals')
        .insert({
          circle_id: formData.circleId,
          title: formData.title,
          description: formData.description,
          target_amount: targetAmount,
          current_amount: 0,
          deadline: formData.deadline || null,
          category: formData.category,
          icon: selectedCategory?.icon,
          start_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast.success("Meta grupal creada exitosamente");
      onSuccess();
      onClose();
      
      setFormData({
        circleId: "",
        title: "",
        description: "",
        targetAmount: "",
        deadline: "",
        category: "Custom"
      });
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
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-cyan-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Crear Meta Grupal</h2>
              <p className="text-sm text-white/80 mt-1">Ahorra en equipo y alcanza objetivos juntos</p>
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
          {/* Circle Selection */}
          <div className="space-y-2">
            <Label htmlFor="circle" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Selecciona el círculo
            </Label>
            <Select
              value={formData.circleId}
              onValueChange={(value) => setFormData({ ...formData, circleId: value })}
              required
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Elige un círculo..." />
              </SelectTrigger>
              <SelectContent>
                {circles.map((circle) => (
                  <SelectItem key={circle.id} value={circle.id}>
                    {circle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-600" />
              Nombre de la meta
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Viaje a Europa del equipo"
              required
              className="h-12 rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe la meta grupal..."
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
              <Label htmlFor="targetAmount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Monto objetivo total
              </Label>
              <Input
                id="targetAmount"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="$100,000"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                Fecha límite
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

          {/* Info Box */}
          <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs text-gray-700">
              💡 <span className="font-medium">Tip:</span> Todos los miembros del círculo podrán contribuir a esta meta. Moni AI calculará cuánto debe aportar cada uno basado en el progreso del equipo.
            </p>
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
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-xl font-medium"
            >
              {loading ? "Creando..." : "Crear meta grupal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
