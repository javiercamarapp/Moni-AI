import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft, Save, Plus, X,
  Home, Car, Utensils, Zap, Heart, PiggyBank,
  Dog, Film, GraduationCap, CreditCard, Gift,
  ShoppingCart, HelpCircle, Star, Smartphone, Plane,
  LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { SectionLoader } from "@/components/SectionLoader";
import { invalidateAllCache } from "@/lib/cacheService";

// Icon mapping for categories
const ICON_MAP: Record<string, LucideIcon> = {
  Home, Car, Utensils, Zap, Heart, PiggyBank, Dog, Film,
  GraduationCap, CreditCard, Gift, ShoppingCart, Star, Smartphone, Plane
};

// Get icon for category based on name
const getCategoryIcon = (name: string): LucideIcon => {
  const nameLower = name.toLowerCase().replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

  if (nameLower.includes('vivienda') || nameLower.includes('casa') || nameLower.includes('renta')) return Home;
  if (nameLower.includes('transporte') || nameLower.includes('auto') || nameLower.includes('gasolina')) return Car;
  if (nameLower.includes('alimentación') || nameLower.includes('comida') || nameLower.includes('super')) return Utensils;
  if (nameLower.includes('servicio') || nameLower.includes('suscripci')) return Zap;
  if (nameLower.includes('salud') || nameLower.includes('bienestar')) return Heart;
  if (nameLower.includes('ahorro') || nameLower.includes('inversión')) return PiggyBank;
  if (nameLower.includes('mascota') || nameLower.includes('perro') || nameLower.includes('gato')) return Dog;
  if (nameLower.includes('entretenimiento') || nameLower.includes('ocio') || nameLower.includes('estilo')) return Film;
  if (nameLower.includes('educación') || nameLower.includes('desarrollo') || nameLower.includes('curso')) return GraduationCap;
  if (nameLower.includes('deuda') || nameLower.includes('crédito')) return CreditCard;
  if (nameLower.includes('apoyo') || nameLower.includes('regalo') || nameLower.includes('otro')) return Gift;
  if (nameLower.includes('personal')) return Star;

  return ShoppingCart;
};

interface BudgetCategory {
  id: string;
  categoryId: string;
  name: string;
  budget: number;
  icon: LucideIcon;
}

export default function EditBudgets() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  // Add category form state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newIcon, setNewIcon] = useState('ShoppingCart');

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

      // Load user's categories with their budgets
      const { data: userCategories, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id)
        .is('parent_id', null);

      if (catError) throw catError;

      // Load budgets for these categories
      const categoryBudgets: BudgetCategory[] = [];

      for (const cat of userCategories || []) {
        const { data: budget } = await supabase
          .from('category_budgets')
          .select('id, monthly_budget')
          .eq('user_id', user.id)
          .eq('category_id', cat.id)
          .maybeSingle();

        categoryBudgets.push({
          id: budget?.id || `new-${cat.id}`,
          categoryId: cat.id,
          name: cat.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim(),
          budget: Number(budget?.monthly_budget) || 0,
          icon: getCategoryIcon(cat.name)
        });
      }

      setCategories(categoryBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (categoryId: string, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const num = cleanValue === '' ? 0 : parseInt(cleanValue, 10);

    setCategories(prev => prev.map(cat =>
      cat.categoryId === categoryId ? { ...cat, budget: num } : cat
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const cat of categories) {
        if (cat.budget > 0) {
          // Check if budget exists
          const { data: existing } = await supabase
            .from('category_budgets')
            .select('id')
            .eq('user_id', user.id)
            .eq('category_id', cat.categoryId)
            .maybeSingle();

          if (existing) {
            // Update existing budget
            await supabase
              .from('category_budgets')
              .update({ monthly_budget: cat.budget })
              .eq('id', existing.id);
          } else {
            // Create new budget
            await supabase
              .from('category_budgets')
              .insert({
                user_id: user.id,
                category_id: cat.categoryId,
                monthly_budget: cat.budget
              });
          }
        }
      }

      // Invalidate cache so fresh data loads
      invalidateAllCache();

      toast.success("Presupuesto guardado");
      setHasChanges(false);
      navigate('/budgets');
    } catch (error) {
      console.error('Error saving budgets:', error);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAmount) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create new category
      const { data: newCat, error: catError } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newName.trim(),
          type: 'gasto',
          color: '#8D6E63'
        })
        .select('id')
        .single();

      if (catError) throw catError;

      const budget = Math.abs(parseInt(newAmount) || 0);

      // Create budget for new category
      if (budget > 0) {
        await supabase
          .from('category_budgets')
          .insert({
            user_id: user.id,
            category_id: newCat.id,
            monthly_budget: budget
          });
      }

      // Add to local state
      const IconComponent = ICON_MAP[newIcon] || ShoppingCart;
      setCategories(prev => [...prev, {
        id: `new-${newCat.id}`,
        categoryId: newCat.id,
        name: newName.trim(),
        budget,
        icon: IconComponent
      }]);

      // Reset form
      setNewName('');
      setNewAmount('');
      setIsAdding(false);
      setHasChanges(true);

      toast.success("Categoría agregada");
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error("Error al agregar categoría");
    }
  };

  const total = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const maxBudget = Math.max(...categories.map(c => c.budget), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] pb-20 flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-gray-800">
      <div className="max-w-5xl mx-auto min-h-screen relative">

        {/* Header */}
        <div className="w-full flex items-center gap-4 pt-8 pb-4 px-6 bg-transparent">
          <button
            onClick={() => navigate('/budgets')}
            className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors text-gray-700"
            aria-label="Go back"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <div className="flex flex-col flex-1">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Editar Presupuesto
            </h1>
            <p className="text-xs font-medium text-gray-500">
              Ajusta tus montos mensuales
            </p>
          </div>
        </div>

        {/* Total Assigned Section */}
        <div className="w-full px-6 mt-4">
          <div className="flex items-end justify-between mb-6 px-1">
            <div>
              <span className="text-[10px] font-bold text-[#8D6E63] uppercase tracking-widest block mb-1">
                Total Asignado
              </span>
              <span className="text-3xl font-black text-[#5D4037]">
                ${total.toLocaleString()}
              </span>
            </div>

            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#5D4037] text-white rounded-xl shadow-lg shadow-[#5D4037]/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300 disabled:opacity-50"
              >
                <Save size={16} strokeWidth={2.5} />
                <span className="text-xs font-bold">{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            )}
          </div>

          {/* Categories List */}
          <div className="space-y-3 pb-6">
            {categories.map((item, index) => {
              const relativeWidth = (item.budget / maxBudget) * 100;
              const Icon = item.icon;

              return (
                <div
                  key={item.categoryId}
                  className="group flex items-center justify-between p-3.5 bg-white rounded-2xl border border-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_14px_rgba(93,64,55,0.06)] hover:border-stone-200 transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 w-full">
                    {/* Icon Container */}
                    <div className="w-11 h-11 flex-shrink-0 rounded-full bg-[#EFEBE9] border border-[#E0D6D2] flex items-center justify-center text-[#5D4037] group-hover:bg-[#5D4037] group-hover:text-white group-hover:scale-110 transition-all duration-300 transform">
                      <Icon size={18} strokeWidth={1.5} />
                    </div>

                    {/* Text & Progress Track */}
                    <div className="flex flex-col gap-1.5 w-full mr-1">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-[#5D4037] tracking-tight mb-0.5">{item.name}</span>

                        {/* Editable Budget */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Mensual</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.budget === 0 ? '' : item.budget}
                              placeholder="0"
                              onChange={(e) => handleAmountChange(item.categoryId, e.target.value)}
                              className="w-20 text-right text-sm font-bold text-[#5D4037] bg-[#EFEBE9]/50 rounded-lg px-2 py-1 outline-none border border-transparent focus:border-stone-300 focus:bg-white focus:ring-1 focus:ring-[#5D4037]/10 transition-all placeholder:text-stone-300"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div
                        className="h-1.5 bg-[#EFEBE9] rounded-full overflow-hidden flex transition-all duration-500"
                        style={{ width: '100%' }}
                      >
                        <div
                          className="h-full bg-[#5D4037]/20 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.max(relativeWidth, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Category Section */}
          <div className="mt-4 pb-24">
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full py-3.5 rounded-xl border border-dashed border-stone-300 text-gray-500 font-bold flex items-center justify-center gap-2 hover:border-[#5D4037] hover:text-[#5D4037] hover:bg-[#5D4037]/5 transition-all duration-300 group text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-[#5D4037] group-hover:text-white transition-colors">
                  <Plus size={14} strokeWidth={3} />
                </div>
                Agregar Categoría
              </button>
            ) : (
              <form onSubmit={handleAddCategory} className="bg-white p-5 rounded-2xl shadow-xl border border-stone-100">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-[#5D4037] text-sm uppercase tracking-wide">Nueva Categoría</h3>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="p-1.5 bg-stone-50 rounded-full hover:bg-stone-100 text-gray-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Nombre</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej. Gimnasio"
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border-none focus:ring-1 focus:ring-[#5D4037] outline-none font-bold text-[#5D4037] text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Presupuesto ($)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border-none focus:ring-1 focus:ring-[#5D4037] outline-none font-bold text-[#5D4037] text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Icono</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {['ShoppingCart', 'Home', 'Car', 'Utensils', 'Heart', 'Dog', 'Film', 'Gift', 'Plane', 'Star'].map((iconName) => {
                        const Icon = ICON_MAP[iconName] || ShoppingCart;
                        const isSelected = newIcon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setNewIcon(iconName)}
                            className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${isSelected ? 'bg-[#5D4037] text-white shadow-lg scale-105' : 'bg-stone-50 text-gray-400 hover:bg-stone-100'}`}
                          >
                            <Icon size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#5D4037] text-white font-bold rounded-xl shadow-lg shadow-[#5D4037]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2 text-sm"
                  >
                    Guardar Categoría
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
