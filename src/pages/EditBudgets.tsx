import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  suggestedPercentage: number;
  subcategories: Subcategory[];
  insight: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { 
    id: 'vivienda', 
    name: 'Vivienda', 
    icon: '🏠', 
    suggestedPercentage: 30,
    insight: 'Mide estabilidad y proporción ideal (<30% de ingresos)',
    subcategories: [
      { id: 'renta', name: 'Renta o hipoteca' },
      { id: 'mantenimiento', name: 'Mantenimiento o predial' },
      { id: 'luz', name: 'Luz' },
      { id: 'agua', name: 'Agua' },
      { id: 'gas', name: 'Gas' },
      { id: 'internet', name: 'Internet y teléfono' },
      { id: 'limpieza', name: 'Servicio de limpieza / seguridad' },
    ]
  },
  { 
    id: 'transporte', 
    name: 'Transporte', 
    icon: '🚗', 
    suggestedPercentage: 15,
    insight: 'Detecta sobrecostos o hábitos de transporte ineficiente',
    subcategories: [
      { id: 'gasolina', name: 'Gasolina / carga eléctrica' },
      { id: 'mensualidad_auto', name: 'Mensualidad de automóvil' },
      { id: 'publico', name: 'Transporte público' },
      { id: 'uber', name: 'Uber, Didi, taxis' },
      { id: 'estacionamiento', name: 'Estacionamiento o peajes' },
      { id: 'mantenimiento_vehiculo', name: 'Mantenimiento del vehículo / seguro' },
    ]
  },
  { 
    id: 'alimentacion', 
    name: 'Alimentación', 
    icon: '🍽️', 
    suggestedPercentage: 20,
    insight: 'Es la categoría donde más fuga de dinero hay',
    subcategories: [
      { id: 'supermercado', name: 'Supermercado' },
      { id: 'restaurantes', name: 'Comidas fuera de casa' },
      { id: 'cafe', name: 'Café / snacks / antojos' },
      { id: 'apps_comida', name: 'Apps de comida (Rappi, Uber Eats, etc.)' },
    ]
  },
  { 
    id: 'servicios', 
    name: 'Servicios y suscripciones', 
    icon: '🧾', 
    suggestedPercentage: 8,
    insight: 'Ideal para detectar "gastos hormiga" o suscripciones olvidadas',
    subcategories: [
      { id: 'streaming', name: 'Streaming (Netflix, Spotify, etc.)' },
      { id: 'apps_premium', name: 'Apps premium (IA, productividad, edición, etc.)' },
      { id: 'software', name: 'Suscripciones de software / membresías' },
      { id: 'telefono', name: 'Teléfono móvil' },
    ]
  },
  { 
    id: 'salud', 
    name: 'Salud y bienestar', 
    icon: '🩺', 
    suggestedPercentage: 5,
    insight: 'Muestra equilibrio entre autocuidado y exceso de gasto',
    subcategories: [
      { id: 'seguro_medico', name: 'Seguro médico' },
      { id: 'medicinas', name: 'Medicinas' },
      { id: 'consultas', name: 'Consultas médicas' },
      { id: 'gimnasio', name: 'Gimnasio, clases, suplementos' },
    ]
  },
  { 
    id: 'educacion', 
    name: 'Educación y desarrollo', 
    icon: '🎓', 
    suggestedPercentage: 5,
    insight: 'Refleja gasto de crecimiento o inversión en conocimiento',
    subcategories: [
      { id: 'colegiaturas', name: 'Colegiaturas' },
      { id: 'cursos', name: 'Cursos / talleres' },
      { id: 'libros', name: 'Libros o herramientas de aprendizaje' },
      { id: 'extracurriculares', name: 'Clases extracurriculares' },
    ]
  },
  { 
    id: 'deudas', 
    name: 'Deudas y créditos', 
    icon: '💳', 
    suggestedPercentage: 5,
    insight: 'Ayuda a calcular el índice de endeudamiento (<35% recomendable)',
    subcategories: [
      { id: 'tarjetas', name: 'Tarjetas de crédito' },
      { id: 'prestamos', name: 'Préstamos personales' },
      { id: 'hipotecarios', name: 'Créditos hipotecarios' },
      { id: 'intereses', name: 'Intereses / pagos mínimos' },
    ]
  },
  { 
    id: 'entretenimiento', 
    name: 'Entretenimiento y estilo de vida', 
    icon: '🎉', 
    suggestedPercentage: 7,
    insight: 'Identifica exceso de gasto emocional o impulsivo',
    subcategories: [
      { id: 'salidas', name: 'Salidas, fiestas, bares' },
      { id: 'ropa', name: 'Ropa, accesorios, belleza' },
      { id: 'viajes', name: 'Viajes o escapadas' },
      { id: 'hobbies', name: 'Hobbies, videojuegos, mascotas' },
    ]
  },
  { 
    id: 'ahorro', 
    name: 'Ahorro e inversión', 
    icon: '💸', 
    suggestedPercentage: 10,
    insight: 'Mide disciplina financiera (objetivo: al menos 10-20% de ingresos)',
    subcategories: [
      { id: 'ahorro_mensual', name: 'Ahorro mensual' },
      { id: 'fondo_emergencia', name: 'Fondo de emergencia' },
      { id: 'inversion', name: 'Inversión (fondos, CETES, cripto, etc.)' },
      { id: 'retiro', name: 'Aportación a retiro (AFORE, IRA, etc.)' },
    ]
  },
  { 
    id: 'apoyos', 
    name: 'Apoyos y otros', 
    icon: '🤝', 
    suggestedPercentage: 0,
    insight: 'Permite ajustar el "balance neto real" del mes',
    subcategories: [
      { id: 'apoyo_familiar', name: 'Apoyo familiar / hijos / pareja' },
      { id: 'donaciones', name: 'Donaciones' },
      { id: 'otros', name: 'Otros gastos no clasificados' },
    ]
  },
  { 
    id: 'mascotas', 
    name: 'Mascotas', 
    icon: '🐾', 
    suggestedPercentage: 3,
    insight: 'Cuida de tus compañeros peludos de forma responsable',
    subcategories: [
      { id: 'comida_mascotas', name: 'Comida y snacks' },
      { id: 'veterinario', name: 'Veterinario y medicinas' },
      { id: 'accesorios_mascotas', name: 'Accesorios y juguetes' },
      { id: 'estetica_mascotas', name: 'Estética y cuidado' },
      { id: 'seguro_mascotas', name: 'Seguro de mascotas' },
    ]
  },
  { 
    id: 'personalizada', 
    name: 'Categoría personalizada', 
    icon: '⭐', 
    suggestedPercentage: 0,
    insight: 'Crea tu propia categoría para gastos específicos',
    subcategories: [
      { id: 'personalizado_1', name: 'Concepto 1' },
      { id: 'personalizado_2', name: 'Concepto 2' },
      { id: 'personalizado_3', name: 'Concepto 3' },
      { id: 'personalizado_4', name: 'Concepto 4' },
    ]
  },
];

export default function EditBudgets() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [subcategoryBudgets, setSubcategoryBudgets] = useState<Record<string, number>>({});
  const [customSubcategories, setCustomSubcategories] = useState<Record<string, string>>({});

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

      // Cargar todas las categorías principales del usuario
      const { data: userCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id)
        .is('parent_id', null);

      if (!userCategories) {
        setLoading(false);
        return;
      }

      // Crear mapa de categorías por nombre
      const categoryMap = new Map(userCategories.map(c => [c.name.toLowerCase(), c.id]));

      const loadedBudgets: Record<string, number> = {};
      const loadedSubcategoryBudgets: Record<string, number> = {};

      // Para cada categoría predeterminada
      for (const category of DEFAULT_CATEGORIES) {
        const catId = categoryMap.get(category.name.toLowerCase());
        
        if (catId) {
          // Cargar presupuesto de categoría principal
          const { data: budget } = await supabase
            .from('category_budgets')
            .select('monthly_budget')
            .eq('user_id', user.id)
            .eq('category_id', catId)
            .maybeSingle();

          if (budget) {
            loadedBudgets[category.id] = Number(budget.monthly_budget);
          }

          // Cargar subcategorías
          const { data: subcategories } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', user.id)
            .eq('parent_id', catId);

          if (subcategories) {
            for (const subcat of subcategories) {
              // Buscar en DEFAULT_CATEGORIES la subcategoría correspondiente
              const defaultSubcat = category.subcategories.find(
                s => s.name.toLowerCase() === subcat.name.toLowerCase()
              );

              if (defaultSubcat) {
                // Cargar presupuesto de subcategoría
                const { data: subcatBudget } = await supabase
                  .from('category_budgets')
                  .select('monthly_budget')
                  .eq('user_id', user.id)
                  .eq('category_id', subcat.id)
                  .maybeSingle();

                if (subcatBudget) {
                  loadedSubcategoryBudgets[defaultSubcat.id] = Number(subcatBudget.monthly_budget);
                }
              }
            }
          }
        }
      }

      setBudgets(loadedBudgets);
      setSubcategoryBudgets(loadedSubcategoryBudgets);

    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (!value || value === 0) return "";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const updateSubcategoryBudget = (subcategoryId: string, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setSubcategoryBudgets({ ...subcategoryBudgets, [subcategoryId]: numValue });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Para cada categoría predeterminada
      for (const category of DEFAULT_CATEGORIES) {
        const categoryBudget = budgets[category.id];
        
        // Solo procesar si tiene presupuesto o subcategorías con presupuesto
        const hasSubcategoryBudgets = category.subcategories.some(
          sub => subcategoryBudgets[sub.id] && subcategoryBudgets[sub.id] > 0
        );

        if (!categoryBudget && !hasSubcategoryBudgets) continue;

        // Buscar o crear categoría principal
        let { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', category.name)
          .is('parent_id', null)
          .maybeSingle();

        let categoryId = existingCategory?.id;

        if (!categoryId) {
          const { data: newCategory, error: catError } = await supabase
            .from('categories')
            .insert({
              user_id: user.id,
              name: category.name,
              type: 'gasto',
              color: 'bg-primary/20',
              parent_id: null
            })
            .select('id')
            .single();

          if (catError) throw catError;
          categoryId = newCategory.id;
        }

        // Guardar o actualizar presupuesto de categoría principal
        if (categoryBudget && categoryBudget > 0) {
          const { data: existingBudget } = await supabase
            .from('category_budgets')
            .select('id')
            .eq('user_id', user.id)
            .eq('category_id', categoryId)
            .maybeSingle();

          if (existingBudget) {
            await supabase
              .from('category_budgets')
              .update({ monthly_budget: categoryBudget })
              .eq('id', existingBudget.id);
          } else {
            await supabase
              .from('category_budgets')
              .insert({
                user_id: user.id,
                category_id: categoryId,
                monthly_budget: categoryBudget
              });
          }
        }

        // Guardar subcategorías
        for (const subcategory of category.subcategories) {
          const subcatBudget = subcategoryBudgets[subcategory.id];
          
          if (subcatBudget && subcatBudget > 0) {
            // Obtener nombre personalizado si existe (para categoría personalizada)
            const subcatName = category.id === 'personalizada' && customSubcategories[subcategory.id]
              ? customSubcategories[subcategory.id]
              : subcategory.name;

            // Buscar o crear subcategoría
            let { data: existingSubcat } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', subcatName)
              .eq('parent_id', categoryId)
              .maybeSingle();

            let subcatId = existingSubcat?.id;

            if (!subcatId) {
              const { data: newSubcat, error: subcatError } = await supabase
                .from('categories')
                .insert({
                  user_id: user.id,
                  name: subcatName,
                  type: 'gasto',
                  color: 'bg-primary/20',
                  parent_id: categoryId
                })
                .select('id')
                .single();

              if (subcatError) throw subcatError;
              subcatId = newSubcat.id;
            }

            // Guardar o actualizar presupuesto de subcategoría
            const { data: existingSubcatBudget } = await supabase
              .from('category_budgets')
              .select('id')
              .eq('user_id', user.id)
              .eq('category_id', subcatId)
              .maybeSingle();

            if (existingSubcatBudget) {
              await supabase
                .from('category_budgets')
                .update({ monthly_budget: subcatBudget })
                .eq('id', existingSubcatBudget.id);
            } else {
              await supabase
                .from('category_budgets')
                .insert({
                  user_id: user.id,
                  category_id: subcatId,
                  monthly_budget: subcatBudget
                });
            }
          }
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

        {/* Main Card */}
        <Card className="p-5 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Modifica tus presupuestos
              </h2>
              <p className="text-xs text-muted-foreground">
                Toca para ver subcategorías y ajustar montos
              </p>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              {DEFAULT_CATEGORIES.map((category, index) => (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )}
                    className="w-full p-3 rounded-[15px] border-2 transition-all text-left border-blue-100 bg-white hover:border-primary/50 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {category.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {category.suggestedPercentage}% sugerido
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {budgets[category.id] && budgets[category.id] > 0 && (
                          <span className="text-sm font-bold text-foreground">
                            ${formatCurrency(budgets[category.id])}
                          </span>
                        )}
                        <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedCategory === category.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Panel */}
                  {expandedCategory === category.id && (
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-1.5 py-2 animate-fade-in">
                      <p className="text-[9px] text-muted-foreground italic mb-2">
                        💡 {category.insight}
                      </p>

                      {/* Subcategories */}
                      <div className="space-y-1.5">
                        {category.subcategories.map((sub) => (
                          <div key={sub.id} className="bg-gray-50 rounded-lg px-2 py-2">
                            <div className="flex items-center justify-between gap-2">
                              {category.id === 'personalizada' ? (
                                <>
                                  <Input
                                    type="text"
                                    placeholder={sub.name}
                                    value={customSubcategories[sub.id] || ""}
                                    onChange={(e) => {
                                      setCustomSubcategories({ ...customSubcategories, [sub.id]: e.target.value });
                                    }}
                                    className="flex-1 h-7 text-[10px] bg-white border-gray-200"
                                  />
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2 text-[10px] font-semibold text-muted-foreground">$</span>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="0"
                                      value={subcategoryBudgets[sub.id] ? formatCurrency(subcategoryBudgets[sub.id]) : ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '');
                                        updateSubcategoryBudget(sub.id, value);
                                      }}
                                      className="w-24 h-7 text-[10px] text-right font-semibold pl-4 pr-2 bg-white border-gray-200"
                                    />
                                  </div>
                                  {sub.id.startsWith('personalizado_') && (
                                    <Button
                                      onClick={() => {
                                        // Eliminar subcategoría
                                        const index = category.subcategories.findIndex(s => s.id === sub.id);
                                        if (index > -1) {
                                          category.subcategories.splice(index, 1);
                                        }
                                        // Limpiar datos asociados
                                        const newCustomSubcats = { ...customSubcategories };
                                        delete newCustomSubcats[sub.id];
                                        setCustomSubcategories(newCustomSubcats);
                                        
                                        const newSubcatBudgets = { ...subcategoryBudgets };
                                        delete newSubcatBudgets[sub.id];
                                        setSubcategoryBudgets(newSubcatBudgets);
                                      }}
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-foreground flex-1">
                                    • {sub.name}
                                  </span>
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2 text-[10px] font-semibold text-muted-foreground">$</span>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="0"
                                      value={subcategoryBudgets[sub.id] ? formatCurrency(subcategoryBudgets[sub.id]) : ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '');
                                        updateSubcategoryBudget(sub.id, value);
                                      }}
                                      className="w-24 h-7 text-[10px] text-right font-semibold pl-4 pr-2 bg-white border-gray-200"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add button for custom category */}
                      {category.id === 'personalizada' && (
                        <div className="flex justify-center mt-2">
                          <Button
                            onClick={() => {
                              const newId = `personalizado_${Date.now()}`;
                              const newSubcategory = { id: newId, name: `Concepto ${category.subcategories.length + 1}` };
                              category.subcategories.push(newSubcategory);
                              setCustomSubcategories({ ...customSubcategories });
                            }}
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold"
                          >
                            +
                          </Button>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        onClick={() => {
                          // Calcular total de subcategorías
                          const subcategoryTotal = category.subcategories.reduce((sum, sub) => {
                            return sum + (subcategoryBudgets[sub.id] || 0);
                          }, 0);
                          
                          // Actualizar budget de categoría principal
                          if (subcategoryTotal > 0) {
                            setBudgets({ ...budgets, [category.id]: subcategoryTotal });
                          }
                          
                          setExpandedCategory(null);
                        }}
                        className="w-full mt-2 h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-[15px] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        Cambiar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save Button */}
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
