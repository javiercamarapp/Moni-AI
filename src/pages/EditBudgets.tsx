import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";

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
  const [customSubcategoriesByCategory, setCustomSubcategoriesByCategory] = useState<Record<string, Subcategory[]>>({});

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
      const loadedCustomSubcategoriesByCategory: Record<string, Subcategory[]> = {};

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
            const customSubcats: Subcategory[] = [];
            
            for (const subcat of subcategories) {
              // Buscar en DEFAULT_CATEGORIES la subcategoría correspondiente
              const defaultSubcat = category.subcategories.find(
                s => s.name.toLowerCase() === subcat.name.toLowerCase()
              );

              if (defaultSubcat) {
                // Cargar presupuesto de subcategoría predeterminada
                const { data: subcatBudget } = await supabase
                  .from('category_budgets')
                  .select('monthly_budget')
                  .eq('user_id', user.id)
                  .eq('category_id', subcat.id)
                  .maybeSingle();

                if (subcatBudget) {
                  loadedSubcategoryBudgets[defaultSubcat.id] = Number(subcatBudget.monthly_budget);
                }
              } else {
                // Es una subcategoría personalizada
                const customId = `custom_${category.id}_${subcat.id}`;
                customSubcats.push({ id: customId, name: subcat.name });
                
                // Cargar presupuesto de subcategoría personalizada
                const { data: subcatBudget } = await supabase
                  .from('category_budgets')
                  .select('monthly_budget')
                  .eq('user_id', user.id)
                  .eq('category_id', subcat.id)
                  .maybeSingle();

                if (subcatBudget) {
                  loadedSubcategoryBudgets[customId] = Number(subcatBudget.monthly_budget);
                }
              }
            }
            
            if (customSubcats.length > 0) {
              loadedCustomSubcategoriesByCategory[category.id] = customSubcats;
            }
          }
        }
      }

      setBudgets(loadedBudgets);
      setSubcategoryBudgets(loadedSubcategoryBudgets);
      setCustomSubcategoriesByCategory(loadedCustomSubcategoriesByCategory);

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

        // Crear subcategorías solo como referencia (sin presupuestos)
        for (const subcategory of category.subcategories) {
          const subcatBudget = subcategoryBudgets[subcategory.id];
          
          if (subcatBudget && subcatBudget > 0) {
            // Obtener nombre personalizado si existe (para categoría personalizada)
            const subcatName = category.id === 'personalizada' && customSubcategories[subcategory.id]
              ? customSubcategories[subcategory.id]
              : subcategory.name;

            // Buscar o crear subcategoría solo como referencia
            let { data: existingSubcat } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', subcatName)
              .eq('parent_id', categoryId)
              .maybeSingle();

            if (!existingSubcat) {
              await supabase
                .from('categories')
                .insert({
                  user_id: user.id,
                  name: subcatName,
                  type: 'gasto',
                  color: 'bg-primary/20',
                  parent_id: categoryId
                });
            }
          }
        }

        // Procesar subcategorías personalizadas adicionales
        const customSubcats = customSubcategoriesByCategory[category.id] || [];
        for (const customSubcat of customSubcats) {
          const subcatBudget = subcategoryBudgets[customSubcat.id];
          
          if (subcatBudget && subcatBudget > 0) {
            // Obtener nombre personalizado
            const subcatName = customSubcategories[customSubcat.id] || customSubcat.name;

            // Buscar o crear subcategoría personalizada
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

            // Guardar presupuesto de subcategoría personalizada
            const { data: existingBudget } = await supabase
              .from('category_budgets')
              .select('id')
              .eq('user_id', user.id)
              .eq('category_id', subcatId)
              .maybeSingle();

            if (existingBudget) {
              await supabase
                .from('category_budgets')
                .update({ monthly_budget: subcatBudget })
                .eq('id', existingBudget.id);
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
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <Button
              variant="ghost"
              onClick={() => navigate('/budgets')}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 p-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Presupuesto</h1>
            </div>
            <div className="w-10" />
          </div>
          <p className="text-xs text-center text-gray-600">
            Ajusta tus montos mensuales
          </p>
        </div>
      </div>

      <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>

        {/* Main Card */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 animate-fade-in">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl mb-1.5">📊</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1 tracking-tight">
                Modifica tus presupuestos
              </h2>
              <p className="text-xs text-gray-500">
                Toca para ver subcategorías y ajustar montos
              </p>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              {DEFAULT_CATEGORIES.map((category, index) => (
                <div key={category.id} className="space-y-2">
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )}
                    className="w-full p-4 rounded-2xl transition-all text-left bg-white hover:bg-gray-50 border-0 shadow-sm hover:shadow-md animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{category.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {category.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {category.suggestedPercentage}% sugerido
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {budgets[category.id] && budgets[category.id] > 0 && (
                          <span className="text-sm font-bold text-gray-900">
                            ${formatCurrency(budgets[category.id])}
                          </span>
                        )}
                        <ArrowRight className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedCategory === category.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Panel */}
                  {expandedCategory === category.id && (
                    <div className="ml-2 pl-4 border-l-2 border-gray-200 space-y-2 py-3 animate-fade-in">
                      <p className="text-xs text-gray-500 italic mb-3">
                        💡 {category.insight}
                      </p>

                      {/* Subcategories */}
                      <div className="space-y-2">
                        {/* Subcategorías predeterminadas */}
                        {category.subcategories.map((sub) => (
                          <div key={sub.id} className="bg-gray-50/50 rounded-xl px-3 py-3 border border-gray-100">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              {category.id === 'personalizada' ? (
                                <>
                                  <Input
                                    type="text"
                                    placeholder={sub.name}
                                    value={customSubcategories[sub.id] || ""}
                                    onChange={(e) => {
                                      setCustomSubcategories({ ...customSubcategories, [sub.id]: e.target.value });
                                    }}
                                    className="flex-1 h-8 text-xs bg-white border-gray-200 rounded-lg"
                                  />
                                  <div className="relative flex items-center">
                                    <span className="absolute left-3 text-xs font-medium text-gray-500">$</span>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="0"
                                      value={subcategoryBudgets[sub.id] ? formatCurrency(subcategoryBudgets[sub.id]) : ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '');
                                        updateSubcategoryBudget(sub.id, value);
                                      }}
                                      className="w-24 h-8 text-xs text-right font-medium pl-6 pr-3 bg-white border-gray-200 rounded-lg"
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
                                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-xs font-medium text-gray-700 flex-1">
                                    • {sub.name}
                                  </span>
                                  <div className="relative flex items-center">
                                    <span className="absolute left-3 text-xs font-medium text-gray-500">$</span>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="0"
                                      value={subcategoryBudgets[sub.id] ? formatCurrency(subcategoryBudgets[sub.id]) : ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '');
                                        updateSubcategoryBudget(sub.id, value);
                                      }}
                                      className="w-24 h-8 text-xs text-right font-medium pl-6 pr-3 bg-white border-gray-200 rounded-lg"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Subcategorías personalizadas */}
                        {customSubcategoriesByCategory[category.id]?.map((sub) => (
                          <div key={sub.id} className="bg-blue-50/50 rounded-xl px-3 py-3 border border-blue-200">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <Input
                                type="text"
                                placeholder="Nombre de subcategoría"
                                value={customSubcategories[sub.id] || sub.name}
                                onChange={(e) => {
                                  setCustomSubcategories({ ...customSubcategories, [sub.id]: e.target.value });
                                }}
                                className="flex-1 h-8 text-xs bg-white border-gray-200 rounded-lg"
                              />
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-xs font-medium text-gray-500">$</span>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={subcategoryBudgets[sub.id] ? formatCurrency(subcategoryBudgets[sub.id]) : ""}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d]/g, '');
                                    updateSubcategoryBudget(sub.id, value);
                                  }}
                                  className="w-24 h-8 text-xs text-right font-medium pl-6 pr-3 bg-white border-gray-200 rounded-lg"
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  // Eliminar subcategoría personalizada
                                  const newCustomSubcats = { ...customSubcategoriesByCategory };
                                  newCustomSubcats[category.id] = newCustomSubcats[category.id].filter(s => s.id !== sub.id);
                                  setCustomSubcategoriesByCategory(newCustomSubcats);
                                  
                                  // Limpiar datos asociados
                                  const newCustomNames = { ...customSubcategories };
                                  delete newCustomNames[sub.id];
                                  setCustomSubcategories(newCustomNames);
                                  
                                  const newSubcatBudgets = { ...subcategoryBudgets };
                                  delete newSubcatBudgets[sub.id];
                                  setSubcategoryBudgets(newSubcatBudgets);
                                }}
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add button for all categories */}
                      <div className="flex justify-center mt-3">
                        <Button
                          onClick={() => {
                            const newId = `custom_${category.id}_${Date.now()}`;
                            const newSubcategory = { 
                              id: newId, 
                              name: `Nueva subcategoría ${(customSubcategoriesByCategory[category.id]?.length || 0) + 1}` 
                            };
                            
                            const currentCustom = customSubcategoriesByCategory[category.id] || [];
                            setCustomSubcategoriesByCategory({
                              ...customSubcategoriesByCategory,
                              [category.id]: [...currentCustom, newSubcategory]
                            });
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-9 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5"
                        >
                          + Agregar subcategoría
                        </Button>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={async () => {
                          // Calcular total de subcategorías
                          const subcategoryTotal = category.subcategories.reduce((sum, sub) => {
                            return sum + (subcategoryBudgets[sub.id] || 0);
                          }, 0);
                          
                          // Actualizar budget de categoría principal
                          if (subcategoryTotal > 0) {
                            setBudgets({ ...budgets, [category.id]: subcategoryTotal });
                          }
                          
                          // Guardar automáticamente en la base de datos
                          setSaving(true);
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;

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

                            // Actualizar presupuesto de categoría principal con el total
                            if (subcategoryTotal > 0) {
                              const { data: existingBudget } = await supabase
                                .from('category_budgets')
                                .select('id')
                                .eq('user_id', user.id)
                                .eq('category_id', categoryId)
                                .maybeSingle();

                              if (existingBudget) {
                                await supabase
                                  .from('category_budgets')
                                  .update({ monthly_budget: subcategoryTotal })
                                  .eq('id', existingBudget.id);
                              } else {
                                await supabase
                                  .from('category_budgets')
                                  .insert({
                                    user_id: user.id,
                                    category_id: categoryId,
                                    monthly_budget: subcategoryTotal
                                  });
                              }
                            }

                            // Crear subcategorías solo como referencia (sin presupuestos)
                            for (const subcategory of category.subcategories) {
                              const subcatBudget = subcategoryBudgets[subcategory.id];
                              
                              if (subcatBudget && subcatBudget > 0) {
                                // Obtener nombre personalizado si existe
                                const subcatName = category.id === 'personalizada' && customSubcategories[subcategory.id]
                                  ? customSubcategories[subcategory.id]
                                  : subcategory.name;

                                // Buscar o crear subcategoría solo como referencia
                                let { data: existingSubcat } = await supabase
                                  .from('categories')
                                  .select('id')
                                  .eq('user_id', user.id)
                                  .eq('name', subcatName)
                                  .eq('parent_id', categoryId)
                                  .maybeSingle();

                                if (!existingSubcat) {
                                  await supabase
                                    .from('categories')
                                    .insert({
                                      user_id: user.id,
                                      name: subcatName,
                                      type: 'gasto',
                                      color: 'bg-primary/20',
                                      parent_id: categoryId
                                    });
                                }
                              }
                            }

                            toast.success(`${category.name} actualizado`);
                            setExpandedCategory(null);
                          } catch (error) {
                            console.error('Error saving category:', error);
                            toast.error("Error al guardar cambios");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="w-full mt-4 h-11 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                      >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
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
              className="w-full h-12 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </Button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
