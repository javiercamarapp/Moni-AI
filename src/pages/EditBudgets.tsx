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
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  budget_id?: string;
  monthly_budget: number;
}

const MAIN_CATEGORIES = [
  { name: 'Vivienda', icon: '🏠' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Alimentación', icon: '🍽️' },
  { name: 'Servicios y suscripciones', icon: '🧾' },
  { name: 'Salud y bienestar', icon: '🩺' },
  { name: 'Educación y desarrollo', icon: '🎓' },
  { name: 'Deudas y créditos', icon: '💳' },
  { name: 'Entretenimiento y estilo de vida', icon: '🎉' },
  { name: 'Ahorro e inversión', icon: '💸' },
  { name: 'Apoyos y otros', icon: '🤝' },
];

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

const DEFAULT_SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  'vivienda': [
    { id: 'renta', name: 'Renta o hipoteca' },
    { id: 'mantenimiento', name: 'Mantenimiento o predial' },
    { id: 'luz', name: 'Luz' },
    { id: 'agua', name: 'Agua' },
    { id: 'gas', name: 'Gas' },
    { id: 'internet', name: 'Internet y teléfono' },
    { id: 'limpieza', name: 'Servicio de limpieza / seguridad' },
  ],
  'transporte': [
    { id: 'gasolina', name: 'Gasolina / carga eléctrica' },
    { id: 'transporte_publico', name: 'Transporte público' },
    { id: 'uber', name: 'Uber, Didi, taxis' },
    { id: 'estacionamiento', name: 'Estacionamiento o peajes' },
    { id: 'mantenimiento_auto', name: 'Mantenimiento del vehículo / seguro' },
  ],
  'alimentación': [
    { id: 'supermercado', name: 'Supermercado' },
    { id: 'restaurantes', name: 'Comidas fuera de casa' },
    { id: 'cafe', name: 'Café / snacks / antojos' },
    { id: 'apps_comida', name: 'Apps de comida (Rappi, Uber Eats, etc.)' },
  ],
  'servicios y suscripciones': [
    { id: 'streaming', name: 'Streaming (Netflix, Spotify, etc.)' },
    { id: 'apps_premium', name: 'Apps premium (IA, productividad, edición, etc.)' },
    { id: 'suscripciones_software', name: 'Suscripciones de software / membresías' },
    { id: 'telefono', name: 'Teléfono móvil' },
  ],
  'salud y bienestar': [
    { id: 'seguro_medico', name: 'Seguro médico' },
    { id: 'medicinas', name: 'Medicinas' },
    { id: 'consultas', name: 'Consultas médicas' },
    { id: 'gimnasio', name: 'Gimnasio, clases, suplementos' },
  ],
  'educación y desarrollo': [
    { id: 'colegiaturas', name: 'Colegiaturas' },
    { id: 'cursos', name: 'Cursos / talleres' },
    { id: 'libros', name: 'Libros o herramientas de aprendizaje' },
    { id: 'clases_extra', name: 'Clases extracurriculares' },
  ],
  'deudas y créditos': [
    { id: 'tarjetas', name: 'Tarjetas de crédito' },
    { id: 'prestamos', name: 'Préstamos personales / automotriz' },
    { id: 'creditos', name: 'Créditos hipotecarios' },
    { id: 'intereses', name: 'Intereses / pagos mínimos' },
  ],
  'entretenimiento y estilo de vida': [
    { id: 'salidas', name: 'Salidas, fiestas, bares' },
    { id: 'ropa', name: 'Ropa, accesorios, belleza' },
    { id: 'viajes', name: 'Viajes o escapadas' },
    { id: 'hobbies', name: 'Hobbies, videojuegos, mascotas' },
  ],
  'ahorro e inversión': [
    { id: 'ahorro_mensual', name: 'Ahorro mensual' },
    { id: 'fondo_emergencia', name: 'Fondo de emergencia' },
    { id: 'inversion', name: 'Inversión (fondos, CETES, cripto, etc.)' },
    { id: 'retiro', name: 'Aportación a retiro (AFORE, IRA, etc.)' },
  ],
  'apoyos y otros': [
    { id: 'apoyo_familiar', name: 'Apoyo familiar / hijos / pareja' },
    { id: 'donaciones', name: 'Donaciones' },
    { id: 'mascotas', name: 'Mascotas' },
    { id: 'otros', name: 'Otros gastos no clasificados' },
  ],
};

export default function EditBudgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedBudgets, setEditedBudgets] = useState<Record<string, string>>({});
  const [editedSubcategoryBudgets, setEditedSubcategoryBudgets] = useState<Record<string, string>>({});
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

      console.log('Cargando presupuestos para usuario:', user.id);

      // Cargar SOLO categorías principales con presupuesto (parent_id IS NULL)
      const { data: mainCategories, error: catError } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('user_id', user.id)
        .is('parent_id', null);

      if (catError) throw catError;

      // Para cada categoría principal, buscar su presupuesto
      const budgetsData = await Promise.all(
        (mainCategories || []).map(async (cat) => {
          const { data: budgetData } = await supabase
            .from('category_budgets')
            .select('id, monthly_budget')
            .eq('user_id', user.id)
            .eq('category_id', cat.id)
            .maybeSingle();

          return {
            id: budgetData?.id || '',
            category_id: cat.id,
            monthly_budget: budgetData?.monthly_budget || 0,
            category: {
              id: cat.id,
              name: cat.name,
              color: cat.color
            }
          };
        })
      );

      const data = budgetsData;

      console.log('Categorías principales cargadas:', data);

      // Para cada categoría, cargar sus subcategorías
      const budgetsWithSubcategories = await Promise.all(
        (data || []).map(async (budget) => {
          console.log(`Buscando subcategorías para: ${budget.category.name} (${budget.category_id})`);
          
          // Buscar subcategorías (categorías con parent_id igual a esta categoría)
          const { data: subcats } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', user.id)
            .eq('parent_id', budget.category_id);

          console.log(`Subcategorías encontradas para ${budget.category.name}:`, subcats);

          // Si no hay subcategorías guardadas, usar las predeterminadas
          let subcategoriesWithBudget: Subcategory[] = [];
          
          if (subcats && subcats.length > 0) {
            // Para cada subcategoría guardada, buscar si tiene presupuesto
            subcategoriesWithBudget = await Promise.all(
              subcats.map(async (subcat) => {
                const { data: subcatBudget } = await supabase
                  .from('category_budgets')
                  .select('id, monthly_budget')
                  .eq('user_id', user.id)
                  .eq('category_id', subcat.id)
                  .single();

                return {
                  id: subcat.id,
                  name: subcat.name,
                  budget_id: subcatBudget?.id,
                  monthly_budget: subcatBudget?.monthly_budget || 0
                };
              })
            );
          } else {
            // Usar subcategorías predeterminadas basadas en el nombre de la categoría
            const categoryNameLower = budget.category.name.toLowerCase();
            const defaultSubs = DEFAULT_SUBCATEGORIES[categoryNameLower] || [];
            
            subcategoriesWithBudget = defaultSubs.map(sub => ({
              id: sub.id,
              name: sub.name,
              budget_id: undefined,
              monthly_budget: 0
            }));
          }

          console.log(`Subcategorías con presupuesto para ${budget.category.name}:`, subcategoriesWithBudget);

          return {
            ...budget,
            subcategories: subcategoriesWithBudget
          };
        })
      );

      console.log('Budgets finales con subcategorías:', budgetsWithSubcategories);
      setBudgets(budgetsWithSubcategories);

      // Inicializar valores editables para categorías principales
      const initialEdited: Record<string, string> = {};
      const initialSubcatEdited: Record<string, string> = {};
      
      budgetsWithSubcategories.forEach(b => {
        initialEdited[b.category_id] = String(Number(b.monthly_budget));
        
        // Inicializar subcategorías
        b.subcategories?.forEach(sub => {
          initialSubcatEdited[sub.id] = String(Number(sub.monthly_budget));
        });
      });
      
      setEditedBudgets(initialEdited);
      setEditedSubcategoryBudgets(initialSubcatEdited);

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

      // Actualizar presupuestos de categorías principales
      for (const budget of budgets) {
        const newAmount = Number(editedBudgets[budget.category_id] || 0);
        
        if (budget.id) {
          // Si ya existe el presupuesto, actualizarlo si cambió
          if (newAmount !== Number(budget.monthly_budget)) {
            const { error } = await supabase
              .from('category_budgets')
              .update({ monthly_budget: newAmount })
              .eq('id', budget.id);

            if (error) throw error;
          }
        } else if (newAmount > 0) {
          // Si no existe y el monto es mayor a 0, crear el presupuesto
          const { error } = await supabase
            .from('category_budgets')
            .insert({
              user_id: user.id,
              category_id: budget.category_id,
              monthly_budget: newAmount
            });

          if (error) throw error;
        }

        // Actualizar presupuestos de subcategorías
        if (budget.subcategories) {
          for (const subcat of budget.subcategories) {
            const newSubAmount = Number(editedSubcategoryBudgets[subcat.id] || 0);
            
            // Solo procesar si hay un monto asignado
            if (newSubAmount > 0) {
              if (subcat.budget_id) {
                // Actualizar presupuesto existente
                if (newSubAmount !== Number(subcat.monthly_budget)) {
                  const { error } = await supabase
                    .from('category_budgets')
                    .update({ monthly_budget: newSubAmount })
                    .eq('id', subcat.budget_id);

                  if (error) throw error;
                }
              } else {
                // Crear subcategoría y presupuesto nuevo
                // Primero crear la subcategoría en la tabla categories
                const { data: newSubcat, error: subcatError } = await supabase
                  .from('categories')
                  .insert({
                    user_id: user.id,
                    name: subcat.name,
                    type: 'gasto',
                    color: 'bg-primary/20',
                    parent_id: budget.category_id
                  })
                  .select()
                  .single();

                if (subcatError) throw subcatError;

                // Luego crear su presupuesto
                const { error: budgetError } = await supabase
                  .from('category_budgets')
                  .insert({
                    user_id: user.id,
                    category_id: newSubcat.id,
                    monthly_budget: newSubAmount
                  });

                if (budgetError) throw budgetError;
              }
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
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 py-2 animate-fade-in space-y-2">
                      {/* Monto de categoría principal */}
                      <div className="bg-gradient-to-r from-gray-50 to-white rounded-[12px] p-3 border border-gray-200">
                        <p className="text-[10px] font-semibold text-foreground mb-2">
                          Presupuesto total de la categoría
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

                      {/* Subcategorías */}
                      {budget.subcategories && budget.subcategories.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] text-muted-foreground font-semibold mb-1">
                            Subcategorías
                          </p>
                          {budget.subcategories.map((subcat) => (
                            <div key={subcat.id} className="bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-[10px] font-medium text-foreground">{subcat.name}</p>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">$</span>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={formatCurrency(editedSubcategoryBudgets[subcat.id] || "0")}
                                  onChange={(e) => {
                                    const cleanValue = e.target.value.replace(/[^\d]/g, '');
                                    setEditedSubcategoryBudgets(prev => ({
                                      ...prev,
                                      [subcat.id]: cleanValue
                                    }));
                                  }}
                                  className="h-8 text-sm text-center bg-white border-gray-200 pl-6"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
