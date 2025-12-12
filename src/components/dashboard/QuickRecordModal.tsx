import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  PenLine,
  Delete,
  Plus,
  X,
  MoreHorizontal,
  Check,
  type LucideIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TransactionSchema } from '@/lib/validation';
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

const MAX_DISPLAYED_CATEGORIES = 6;

const QuickRecordModal = ({ isOpen, onClose, mode, initialData }: QuickRecordModalProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(initialData?.amount || '0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [note, setNote] = useState(initialData?.note || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [displayedCategories, setDisplayedCategories] = useState<DisplayCategory[]>([]);
  const [allCategories, setAllCategories] = useState<DisplayCategory[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
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

  // Available icons for custom categories
  const availableIcons = Object.keys(CATEGORY_ICONS);

  // Fetch and order categories
  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const standardCats = getStandardCategories(mode === 'expense' ? 'expense' : 'income');
        
        if (!user) {
          const cats = standardCats.map(c => ({ id: c.id, name: c.name, icon: c.icon }));
          setAllCategories(cats);
          setDisplayedCategories(cats.slice(0, MAX_DISPLAYED_CATEGORIES - 1));
          if (cats.length > 0) setSelectedCategoryId(cats[0].id);
          return;
        }

        // Fetch user's custom categories
        const { data: userCategories } = await supabase
          .from('categories')
          .select('id, name, color')
          .eq('user_id', user.id)
          .eq('type', mode === 'expense' ? 'gasto' : 'ingreso')
          .is('parent_id', null);

        // Get recently used category IDs
        const { data: recentTransactions } = await supabase
          .from('transactions')
          .select('category_id')
          .eq('user_id', user.id)
          .eq('type', mode === 'expense' ? 'gasto' : 'ingreso')
          .not('category_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(30);

        // Count category usage
        const usageCount: Record<string, number> = {};
        (recentTransactions || []).forEach(tx => {
          if (tx.category_id) {
            usageCount[tx.category_id] = (usageCount[tx.category_id] || 0) + 1;
          }
        });

        // Build custom categories array with usage info
        const customCats: DisplayCategory[] = (userCategories || []).map(cat => ({
          id: cat.id,
          name: cat.name.replace(/^[^\w\s]+\s*/, ''), // Remove emoji prefix if any
          icon: 'MoreHorizontal',
          isCustom: true,
          isRecent: (usageCount[cat.id] || 0) > 0
        }));

        // Get recently used custom categories, sorted by usage
        const recentCustom = customCats
          .filter(c => usageCount[c.id] > 0)
          .sort((a, b) => (usageCount[b.id] || 0) - (usageCount[a.id] || 0));

        // Convert standard categories
        const standardDisplay: DisplayCategory[] = standardCats.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          isCustom: false
        }));

        // Build final list: recent first, then fill with standards
        const finalList: DisplayCategory[] = [];
        const usedIds = new Set<string>();

        // Add recent custom categories first (up to MAX - 1 to leave room for "+" button)
        for (const cat of recentCustom) {
          if (finalList.length < MAX_DISPLAYED_CATEGORIES - 1) {
            finalList.push(cat);
            usedIds.add(cat.id);
          }
        }

        // Fill remaining slots with standard categories
        for (const cat of standardDisplay) {
          if (finalList.length < MAX_DISPLAYED_CATEGORIES - 1 && !usedIds.has(cat.id)) {
            finalList.push(cat);
            usedIds.add(cat.id);
          }
        }

        // All categories = recent + standards + remaining custom
        const allCats = [
          ...recentCustom,
          ...standardDisplay.filter(c => !usedIds.has(c.id) || usedIds.has(c.id)),
          ...customCats.filter(c => !usedIds.has(c.id))
        ];

        // Remove duplicates
        const uniqueAll: DisplayCategory[] = [];
        const seenIds = new Set<string>();
        for (const cat of allCats) {
          if (!seenIds.has(cat.id)) {
            uniqueAll.push(cat);
            seenIds.add(cat.id);
          }
        }

        setAllCategories(uniqueAll);
        setDisplayedCategories(finalList);
        
        // Set default selection
        if (!initialData?.categoryId && finalList.length > 0) {
          setSelectedCategoryId(finalList[0].id);
        } else if (initialData?.categoryId) {
          setSelectedCategoryId(initialData.categoryId);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        const standardCats = getStandardCategories(mode === 'expense' ? 'expense' : 'income');
        const cats = standardCats.map(c => ({ id: c.id, name: c.name, icon: c.icon }));
        setAllCategories(cats);
        setDisplayedCategories(cats.slice(0, MAX_DISPLAYED_CATEGORIES - 1));
        if (cats.length > 0) setSelectedCategoryId(cats[0].id);
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

      setAllCategories(prev => [newDisplayCat, ...prev]);
      setDisplayedCategories(prev => [newDisplayCat, ...prev.slice(0, MAX_DISPLAYED_CATEGORIES - 2)]);
      setSelectedCategoryId(newCat.id);
      setNewCategoryName('');
      setShowAddCategory(false);

      toast({ title: 'Categoría creada', description: `"${newCat.name}" ha sido agregada` });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({ title: 'Error', description: 'No se pudo crear la categoría', variant: 'destructive' });
    } finally {
      setIsCreatingCategory(false);
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
        const standardCats = getStandardCategories(mode === 'expense' ? 'expense' : 'income');
        const selectedStd = standardCats.find(c => c.id === selectedCategoryId);
        
        if (selectedStd) {
          // Check if exists
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
      toast({ title: 'Error', description: `No se pudo registrar`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Seleccionar';
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    const isToday = dateObj.toDateString() === today.toDateString();
    if (isToday) return 'Hoy';
    return `${d}/${m}/${y}`;
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = CATEGORY_ICONS[iconName] || MoreHorizontal;
    return <IconComponent size={18} strokeWidth={2.5} />;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-[#FAFAF9] rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-3 flex items-center justify-between shrink-0 border-b border-gray-100">
            <button
              onClick={onClose}
              className="h-9 w-9 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform"
            >
              <X size={18} />
            </button>
            <h1 className="text-base font-bold text-gray-800">{title}</h1>
            <div className="w-9" />
          </div>

          <div className="flex-1 flex flex-col px-5 py-3 overflow-y-auto">
            {/* Amount Display */}
            <div className="flex flex-col items-center justify-center mb-4">
              <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">
                INGRESAR MONTO
              </span>
              <div className="bg-white rounded-2xl px-5 py-3 w-full shadow-sm border border-gray-100 flex justify-center items-center">
                <span className="text-3xl font-black text-gray-800 tracking-tight truncate">
                  ${amount}
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-3">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block px-1">
                CATEGORÍA
              </span>
              
              {!showAddCategory ? (
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-1">
                  {(showAllCategories ? allCategories : displayedCategories).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="flex flex-col items-center gap-1 group min-w-[54px]"
                    >
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                        selectedCategoryId === cat.id
                          ? `${selectedColor} text-white scale-110 shadow-lg`
                          : 'bg-white text-[#8D6E63] group-hover:bg-[#F5F0EE]'
                      }`}>
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <span className={`text-[8px] font-bold truncate w-full text-center ${
                        selectedCategoryId === cat.id ? 'text-[#8D6E63]' : 'text-gray-400'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  ))}

                  {/* More button */}
                  {!showAllCategories && allCategories.length > displayedCategories.length && (
                    <button
                      onClick={() => setShowAllCategories(true)}
                      className="flex flex-col items-center gap-1 group min-w-[54px]"
                    >
                      <div className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center shadow-md hover:bg-gray-200 transition-all">
                        <MoreHorizontal size={18} className="text-gray-500" />
                      </div>
                      <span className="text-[8px] font-bold text-gray-500">Más</span>
                    </button>
                  )}

                  {/* Add new category button */}
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="flex flex-col items-center gap-1 group min-w-[54px]"
                  >
                    <div className="h-11 w-11 rounded-full bg-[#8D6E63]/10 flex items-center justify-center shadow-md hover:bg-[#8D6E63]/20 transition-all border-2 border-dashed border-[#8D6E63]/30">
                      <Plus size={18} className="text-[#8D6E63]" />
                    </div>
                    <span className="text-[8px] font-bold text-[#8D6E63]">Nueva</span>
                  </button>
                </div>
              ) : (
                /* Add Category Form */
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Nombre de categoría..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
                    {availableIcons.slice(0, 8).map((iconName) => (
                      <button
                        key={iconName}
                        onClick={() => setSelectedNewIcon(iconName)}
                        className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          selectedNewIcon === iconName
                            ? 'bg-[#8D6E63] text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {getCategoryIcon(iconName)}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                      className="flex-1 h-9 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                      className="flex-1 h-9 bg-[#8D6E63] text-white rounded-xl font-semibold text-sm hover:bg-[#7D5E53] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} />
                      {isCreatingCategory ? 'Creando...' : 'Crear'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <button
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full h-10 bg-white rounded-xl flex items-center px-3 gap-2 shadow-sm border border-gray-100 text-gray-700 active:scale-98 transition-transform hover:bg-gray-50"
              >
                <Calendar size={14} className="text-[#8D6E63]" />
                <span className="text-xs font-bold truncate">{formatDateDisplay(date)}</span>
              </button>

              <div className="w-full bg-white h-10 rounded-xl flex items-center px-3 gap-2 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-[#8D6E63]/20 transition-all">
                <PenLine size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Nota..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-full bg-transparent border-none outline-none text-xs font-medium text-gray-700 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num.toString())}
                  className="h-12 bg-white rounded-xl shadow-sm active:shadow-none active:translate-y-[1px] border border-gray-100 flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleDelete}
                className="h-12 bg-white rounded-xl shadow-sm active:shadow-none active:translate-y-[1px] border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all"
              >
                <Delete size={18} />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full shrink-0 ${bgColor} text-white h-11 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              <CheckCircleIcon />
              {isSaving ? 'Guardando...' : saveLabel}
            </button>
          </div>

          {/* Date Picker */}
          {isDatePickerOpen && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4" onClick={() => setIsDatePickerOpen(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Seleccionar Fecha</h3>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setIsDatePickerOpen(false); }}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20"
                />
                <button
                  onClick={() => setIsDatePickerOpen(false)}
                  className="mt-4 w-full bg-gray-100 text-gray-700 h-10 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
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

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default QuickRecordModal;
