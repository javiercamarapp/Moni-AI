import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  PenLine,
  Delete,
  Plus,
  X,
  Check,
  Trash2,
  type LucideIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TransactionSchema } from '@/lib/validation';
import { invalidateAllCache } from '@/lib/cacheService';
import {
  getStandardCategories,
  CATEGORY_ICONS,
  type StandardCategory
} from '@/lib/standardCategories';

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'expense' | 'income';
  initialData?: {
    amount?: string;
    categoryId?: string;
    date?: string;
    note?: string;
  };
}

interface DisplayCategory {
  id: string;
  name: string;
  icon: string;
  isCustom?: boolean;
  isRecent?: boolean;
}

const QuickRecordModal = ({ isOpen, onClose, mode, initialData }: QuickRecordModalProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(initialData?.amount || '0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [note, setNote] = useState(initialData?.note || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [standardCategories, setStandardCategories] = useState<DisplayCategory[]>([]);
  const [customCategories, setCustomCategories] = useState<DisplayCategory[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedNewIcon, setSelectedNewIcon] = useState('ShoppingCart');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const isIncome = mode === 'income';
  const title = isIncome ? 'Agregar Ingreso' : 'Agregar Gasto';
  const saveLabel = isIncome ? 'Guardar Ingreso' : 'Guardar Gasto';
  const bgColor = isIncome ? 'bg-[#A1887F]' : 'bg-[#8D6E63]';
  const selectedColor = isIncome ? 'bg-[#A1887F]' : 'bg-[#8D6E63]';

  const availableIcons = Object.keys(CATEGORY_ICONS).slice(0, 8);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const stdCats = getStandardCategories(mode === 'expense' ? 'expense' : 'income');
        
        // Convert standard categories to display format
        const standardDisplay: DisplayCategory[] = stdCats.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          isCustom: false
        }));
        setStandardCategories(standardDisplay);

        if (!user) {
          if (standardDisplay.length > 0) setSelectedCategoryId(standardDisplay[0].id);
          return;
        }

        // Fetch user's custom categories
        const { data: userCategories } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('type', mode === 'expense' ? 'gasto' : 'ingreso')
          .is('parent_id', null);

        // Get recently used category IDs for sorting
        const { data: recentTransactions } = await supabase
          .from('transactions')
          .select('category_id')
          .eq('user_id', user.id)
          .eq('type', mode === 'expense' ? 'gasto' : 'ingreso')
          .not('category_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);

        const usageCount: Record<string, number> = {};
        (recentTransactions || []).forEach(tx => {
          if (tx.category_id) {
            usageCount[tx.category_id] = (usageCount[tx.category_id] || 0) + 1;
          }
        });

        // Build custom categories sorted by recent usage
        const customCats: DisplayCategory[] = (userCategories || [])
          .map(cat => ({
            id: cat.id,
            name: cat.name.replace(/^[^\w\sáéíóúñ]+\s*/i, ''),
            icon: 'ShoppingCart',
            isCustom: true,
            isRecent: (usageCount[cat.id] || 0) > 0
          }))
          .sort((a, b) => (usageCount[b.id] || 0) - (usageCount[a.id] || 0));

        setCustomCategories(customCats);

        // Set default selection: most recent custom, or first standard
        if (!initialData?.categoryId) {
          const recentCustom = customCats.find(c => usageCount[c.id] > 0);
          if (recentCustom) {
            setSelectedCategoryId(recentCustom.id);
          } else if (standardDisplay.length > 0) {
            setSelectedCategoryId(standardDisplay[0].id);
          }
        } else {
          setSelectedCategoryId(initialData.categoryId);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        const stdCats = getStandardCategories(mode === 'expense' ? 'expense' : 'income');
        const standardDisplay = stdCats.map(c => ({ id: c.id, name: c.name, icon: c.icon, isCustom: false }));
        setStandardCategories(standardDisplay);
        if (standardDisplay.length > 0) setSelectedCategoryId(standardDisplay[0].id);
      }
    };

    fetchCategories();
  }, [isOpen, mode, initialData?.categoryId]);

  const handleNumClick = (num: string) => {
    if (amount === '0' && num !== '.') {
      setAmount(num);
    } else {
      if (num === '.' && amount.includes('.')) return;
      if (amount.length > 10) return;
      setAmount(amount + num);
    }
  };

  const handleDelete = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount('0');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'Error', description: 'Ingresa un nombre para la categoría', variant: 'destructive' });
      return;
    }

    setIsCreatingCategory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data: newCat, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newCategoryName.trim(),
          type: mode === 'expense' ? 'gasto' : 'ingreso',
          color: '#8D6E63'
        })
        .select('id, name')
        .single();

      if (error) throw error;

      const newDisplayCat: DisplayCategory = {
        id: newCat.id,
        name: newCat.name,
        icon: selectedNewIcon,
        isCustom: true
      };

      setCustomCategories(prev => [newDisplayCat, ...prev]);
      setSelectedCategoryId(newCat.id);
      setNewCategoryName('');
      setShowAddCategory(false);

      toast({ title: 'Categoría creada', description: `"${newCat.name}" agregada` });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({ title: 'Error', description: 'No se pudo crear la categoría', variant: 'destructive' });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCustomCategories(prev => prev.filter(c => c.id !== categoryId));
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(standardCategories[0]?.id || '');
      }
      toast({ title: 'Eliminada', description: 'Categoría eliminada' });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (parseFloat(amount) <= 0) {
      toast({ title: 'Error', description: 'El monto debe ser mayor a 0', variant: 'destructive' });
      return;
    }

    if (!selectedCategoryId) {
      toast({ title: 'Error', description: 'Selecciona una categoría', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let categoryId = selectedCategoryId;

      // If it's a standard category (starts with std_), create it in DB for user
      if (selectedCategoryId.startsWith('std_')) {
        const stdCats = getStandardCategories(mode === 'expense' ? 'expense' : 'income');
        const selectedStd = stdCats.find(c => c.id === selectedCategoryId);

        if (selectedStd) {
          const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', selectedStd.name)
            .eq('type', mode === 'expense' ? 'gasto' : 'ingreso')
            .maybeSingle();

          if (existing) {
            categoryId = existing.id;
          } else {
            const { data: newCat, error } = await supabase
              .from('categories')
              .insert({
                user_id: user.id,
                name: selectedStd.name,
                type: mode === 'expense' ? 'gasto' : 'ingreso',
                color: '#8D6E63'
              })
              .select('id')
              .single();

            if (error) throw error;
            categoryId = newCat.id;
          }
        }
      }

      const validationResult = TransactionSchema.safeParse({
        amount: parseFloat(amount),
        description: note || (isIncome ? 'Ingreso' : 'Gasto'),
        payment_method: 'efectivo',
        account: 'efectivo',
        category_id: categoryId,
        frequency: 'once',
        transaction_date: date,
        type: isIncome ? 'ingreso' : 'gasto',
      });

      if (!validationResult.success) {
        toast({ title: 'Datos inválidos', description: validationResult.error.errors[0].message, variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: validationResult.data.amount,
          description: validationResult.data.description,
          payment_method: validationResult.data.payment_method,
          account: validationResult.data.account,
          category_id: validationResult.data.category_id,
          frequency: validationResult.data.frequency,
          transaction_date: validationResult.data.transaction_date,
          type: validationResult.data.type,
        });

      if (error) throw error;

      invalidateAllCache();

      toast({
        title: isIncome ? 'Ingreso registrado' : 'Gasto registrado',
        description: `Tu ${isIncome ? 'ingreso' : 'gasto'} ha sido agregado`,
      });

      setAmount('0');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({ title: 'Error', description: 'No se pudo registrar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Seleccionar';
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    if (dateObj.toDateString() === today.toDateString()) return 'Hoy';
    return `${d}/${m}/${y}`;
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = CATEGORY_ICONS[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={16} strokeWidth={2} />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-[#FAFAF9] rounded-3xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100">
            <button
              onClick={onClose}
              className="h-8 w-8 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500"
            >
              <X size={16} />
            </button>
            <h1 className="text-sm font-bold text-gray-800">{title}</h1>
            <div className="w-8" />
          </div>

          <div className="px-4 py-3">
            {/* Amount Display */}
            <div className="flex flex-col items-center mb-3">
              <div className="bg-white rounded-xl px-4 py-2 w-full shadow-sm border border-gray-100 flex justify-center">
                <span className="text-2xl font-black text-gray-800">${amount}</span>
              </div>
            </div>

            {/* Categories Section */}
            <div className="mb-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                CATEGORÍA
              </span>

              {!showAddCategory ? (
                <div className="space-y-3">
                  {/* Standard Categories - 2 rows of 3 */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {standardCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                          selectedCategoryId === cat.id
                            ? `${selectedColor} text-white shadow-md`
                            : 'bg-white text-[#8D6E63] border border-gray-100'
                        }`}>
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <span className={`text-[7px] font-semibold truncate w-full text-center ${
                          selectedCategoryId === cat.id ? 'text-[#5D4037]' : 'text-gray-400'
                        }`}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Categories (if any) + Add Button - same grid */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {customCategories.slice(0, 5).map((cat) => (
                      <div key={cat.id} className="relative group flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className="flex flex-col items-center"
                        >
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                            selectedCategoryId === cat.id
                              ? `${selectedColor} text-white shadow-md`
                              : 'bg-white text-[#8D6E63] border border-gray-100'
                          }`}>
                            {getCategoryIcon(cat.icon)}
                          </div>
                        </button>
                        <span className={`text-[7px] font-semibold truncate w-full text-center ${
                          selectedCategoryId === cat.id ? 'text-[#5D4037]' : 'text-gray-400'
                        }`}>
                          {cat.name}
                        </span>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                          className="absolute -top-1.5 -right-0.5 h-4 w-4 bg-[#5D4037] text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    {/* Add new category button */}
                    <button
                      onClick={() => setShowAddCategory(true)}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <div className="h-9 w-9 rounded-full bg-[#8D6E63]/10 flex items-center justify-center border border-dashed border-[#8D6E63]/40">
                        <Plus size={14} className="text-[#8D6E63]" />
                      </div>
                      <span className="text-[7px] font-semibold text-[#8D6E63]">Nueva</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Add Category Form */
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <input
                    type="text"
                    placeholder="Nombre..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full h-8 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none mb-2"
                    autoFocus
                  />

                  <div className="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar">
                    {availableIcons.map((iconName) => (
                      <button
                        key={iconName}
                        onClick={() => setSelectedNewIcon(iconName)}
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                          selectedNewIcon === iconName
                            ? 'bg-[#8D6E63] text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {getCategoryIcon(iconName)}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                      className="flex-1 h-7 bg-gray-100 text-gray-600 rounded-lg font-semibold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                      className="flex-1 h-7 bg-[#8D6E63] text-white rounded-lg font-semibold text-xs disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <Check size={12} />
                      {isCreatingCategory ? '...' : 'Crear'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => setIsDatePickerOpen(true)}
                className="h-8 bg-white rounded-lg flex items-center px-2.5 gap-1.5 shadow-sm border border-gray-100 text-gray-700"
              >
                <Calendar size={12} className="text-[#8D6E63]" />
                <span className="text-xs font-semibold">{formatDateDisplay(date)}</span>
              </button>

              <div className="h-8 bg-white rounded-lg flex items-center px-2.5 gap-1.5 shadow-sm border border-gray-100">
                <PenLine size={12} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Nota..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-full bg-transparent border-none outline-none text-xs font-medium text-gray-700"
                />
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num.toString())}
                  className="h-10 bg-white rounded-lg shadow-sm border border-gray-100 text-base font-bold text-gray-700 active:bg-gray-50"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleDelete}
                className="h-10 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-700 flex items-center justify-center active:bg-gray-50"
              >
                <Delete size={16} />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full ${bgColor} text-white h-10 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              <Check size={14} />
              {isSaving ? 'Guardando...' : saveLabel}
            </button>
          </div>

          {/* Date Picker */}
          {isDatePickerOpen && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4" onClick={() => setIsDatePickerOpen(false)}>
              <div className="bg-white rounded-2xl p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Seleccionar Fecha</h3>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setIsDatePickerOpen(false); }}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium"
                />
                <button
                  onClick={() => setIsDatePickerOpen(false)}
                  className="mt-3 w-full bg-gray-100 text-gray-700 h-9 rounded-xl font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickRecordModal;
