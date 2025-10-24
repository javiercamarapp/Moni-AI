import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Plus, Trash2, X } from "lucide-react";
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

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function EditBudgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedBudgets, setEditedBudgets] = useState<Record<string, number>>({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedNewCategory, setSelectedNewCategory] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Cargar presupuestos existentes
      const { data: budgetsData, error: budgetsError } = await supabase
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

      if (budgetsError) throw budgetsError;

      setBudgets(budgetsData || []);

      // Cargar todas las categorías disponibles
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .order('name');

      if (categoriesError) throw categoriesError;

      setAllCategories(categoriesData || []);

      // Inicializar valores editables
      const initialEdited: Record<string, number> = {};
      (budgetsData || []).forEach(b => {
        initialEdited[b.category_id] = Number(b.monthly_budget);
      });
      setEditedBudgets(initialEdited);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (categoryId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedBudgets(prev => ({
      ...prev,
      [categoryId]: numValue
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Actualizar presupuestos existentes
      for (const budget of budgets) {
        const newAmount = editedBudgets[budget.category_id];
        if (newAmount !== Number(budget.monthly_budget)) {
          const { error } = await supabase
            .from('category_budgets')
            .update({ monthly_budget: newAmount })
            .eq('id', budget.id);

          if (error) throw error;
        }
      }

      toast.success("Presupuesto actualizado correctamente");
      navigate('/budgets');
    } catch (error) {
      console.error('Error saving budgets:', error);
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string, categoryId: string) => {
    try {
      const { error } = await supabase
        .from('category_budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;

      setBudgets(prev => prev.filter(b => b.id !== budgetId));
      setEditedBudgets(prev => {
        const newEdited = { ...prev };
        delete newEdited[categoryId];
        return newEdited;
      });

      toast.success("Categoría eliminada del presupuesto");
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error("Error al eliminar categoría");
    }
  };

  const handleAddCategory = async () => {
    if (!selectedNewCategory) {
      toast.error("Selecciona una categoría");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('category_budgets')
        .insert({
          user_id: user.id,
          category_id: selectedNewCategory,
          monthly_budget: 0
        })
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
        .single();

      if (error) throw error;

      setBudgets(prev => [...prev, data]);
      setEditedBudgets(prev => ({
        ...prev,
        [selectedNewCategory]: 0
      }));

      setShowAddCategory(false);
      setSelectedNewCategory("");
      toast.success("Categoría agregada");
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error("Error al agregar categoría");
    }
  };

  const getCategoryIcon = (name: string) => {
    const icons: Record<string, string> = {
      'vivienda': '🏠',
      'transporte': '🚗',
      'alimentación': '🍽️',
      'servicios': '💡',
      'salud': '💊',
      'entretenimiento': '🎮',
      'ahorro': '💰',
      'mascotas': '🐾',
    };
    return icons[name.toLowerCase()] || '📊';
  };

  const availableCategories = allCategories.filter(
    cat => !budgets.some(b => b.category_id === cat.id)
  );

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
          <Button
            variant="ghost"
            onClick={handleSave}
            disabled={saving}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border border-blue-100 h-9 w-9 p-0"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>

        {/* Instrucciones */}
        <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
          <p className="text-xs text-muted-foreground text-center">
            Modifica los montos de tu presupuesto mensual por categoría
          </p>
        </Card>

        {/* Lista de presupuestos editables */}
        <div className="space-y-3">
          {budgets.map((budget, index) => (
            <Card 
              key={budget.id}
              className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(budget.category.name)}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{budget.category.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBudget(budget.id, budget.category_id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Monto mensual</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">$</span>
                    <Input
                      type="number"
                      value={editedBudgets[budget.category_id] || 0}
                      onChange={(e) => handleAmountChange(budget.category_id, e.target.value)}
                      className="flex-1 rounded-[10px]"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Botón para agregar categoría */}
        {!showAddCategory && availableCategories.length > 0 && (
          <Button
            onClick={() => setShowAddCategory(true)}
            className="w-full bg-white/10 backdrop-blur-sm rounded-[20px] shadow-lg border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 transition-all text-primary font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Categoría
          </Button>
        )}

        {/* Panel para agregar nueva categoría */}
        {showAddCategory && (
          <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Nueva Categoría</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddCategory(false);
                    setSelectedNewCategory("");
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Selecciona una categoría</label>
                <select
                  value={selectedNewCategory}
                  onChange={(e) => setSelectedNewCategory(e.target.value)}
                  className="w-full p-2 rounded-[10px] border border-input bg-background text-sm"
                >
                  <option value="">Seleccionar...</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {getCategoryIcon(cat.name)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleAddCategory}
                disabled={!selectedNewCategory}
                className="w-full bg-primary rounded-[15px] hover:scale-105 active:scale-95 transition-all"
              >
                Agregar
              </Button>
            </div>
          </Card>
        )}

        {/* Botón de guardar inferior */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary rounded-[20px] shadow-xl hover:scale-105 active:scale-95 transition-all font-bold text-lg py-6"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
