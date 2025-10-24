import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface Budget {
  id: string;
  category_id: string;
  monthly_budget: number;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  'vivienda': '🏠',
  'transporte': '🚗',
  'alimentación': '🍽️',
  'servicios y suscripciones': '🧾',
  'salud y bienestar': '🩺',
  'educación y desarrollo': '🎓',
  'deudas y créditos': '💳',
  'entretenimiento y estilo de vida': '🎉',
  'ahorro e inversión': '💸',
  'apoyos y otros': '🤝',
  'mascotas': '🐾',
};

export default function EditBudgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedBudgets, setEditedBudgets] = useState<Record<string, string>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('category_budgets')
        .select(`
          id,
          category_id,
          monthly_budget,
          category:categories (
            id,
            name,
            color
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setBudgets(data || []);

      // Inicializar valores editables
      const initialEdited: Record<string, string> = {};
      (data || []).forEach(b => {
        initialEdited[b.category_id] = String(Number(b.monthly_budget));
      });
      setEditedBudgets(initialEdited);

    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (categoryId: string, value: string) => {
    // Solo permitir números
    const cleanValue = value.replace(/[^\d]/g, '');
    setEditedBudgets(prev => ({
      ...prev,
      [categoryId]: cleanValue
    }));
  };

  const formatCurrency = (value: string): string => {
    if (!value || value === "0") return "";
    const number = parseFloat(value);
    if (isNaN(number)) return "";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Actualizar presupuestos
      for (const budget of budgets) {
        const newAmount = Number(editedBudgets[budget.category_id] || 0);
        if (newAmount !== Number(budget.monthly_budget)) {
          const { error } = await supabase
            .from('category_budgets')
            .update({ monthly_budget: newAmount })
            .eq('id', budget.id);

          if (error) throw error;
        }
      }

      toast.success("Presupuesto actualizado");
      navigate('/budgets');
    } catch (error) {
      console.error('Error saving budgets:', error);
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    return CATEGORY_ICONS[lowerName] || '📊';
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/budgets')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">✏️ Editar Presupuesto</h1>
          <div className="w-9" />
        </div>

        {/* Instrucciones */}
        <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Modifica tus presupuestos
              </h2>
              <p className="text-xs text-muted-foreground">
                Toca cada categoría para ajustar el monto mensual
              </p>
            </div>

            {/* Lista de presupuestos */}
            <div className="space-y-2">
              {budgets.map((budget, index) => (
                <div key={budget.id} className="space-y-1">
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === budget.category_id ? null : budget.category_id
                    )}
                    className="w-full p-3 rounded-[15px] border-2 transition-all text-left border-blue-100 bg-white hover:border-primary/50 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(budget.category.name)}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {budget.category.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            Presupuesto mensual
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          ${formatCurrency(editedBudgets[budget.category_id] || "0")}
                        </span>
                        <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedCategory === budget.category_id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </button>

                  {/* Panel expandido para editar */}
                  {expandedCategory === budget.category_id && (
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 py-2 animate-fade-in">
                      <div className="bg-gradient-to-r from-gray-50 to-white rounded-[12px] p-3 border border-gray-200">
                        <p className="text-[10px] font-semibold text-foreground mb-2">
                          Ajusta el monto mensual
                        </p>
                        
                        <div className="relative mb-3">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={formatCurrency(editedBudgets[budget.category_id] || "0")}
                            onChange={(e) => handleAmountChange(budget.category_id, e.target.value)}
                            className="text-xl text-center font-bold h-12 rounded-[10px] border-2 border-primary/20 pl-8 bg-white"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setExpandedCategory(null);
                            }}
                            className="flex-1 h-8 text-[10px] bg-primary hover:bg-primary/90 text-white rounded-[8px] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                          >
                            Listo
                          </Button>
                          <Button
                            onClick={() => {
                              setEditedBudgets(prev => ({
                                ...prev,
                                [budget.category_id]: String(Number(budget.monthly_budget))
                              }));
                            }}
                            variant="outline"
                            className="flex-1 h-8 text-[10px] rounded-[8px] border-gray-300 hover:bg-gray-50"
                          >
                            Restaurar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Botón de guardar */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary rounded-[20px] shadow-xl hover:scale-105 active:scale-95 transition-all font-bold text-base py-6"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
