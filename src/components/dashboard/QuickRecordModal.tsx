import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    PenLine,
    Delete,
    Plus,
    X,
    Utensils,
    Home,
    Car,
    Gamepad2,
    GraduationCap,
    MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TransactionSchema } from '@/lib/validation';

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

interface Category {
    id: string;
    name: string;
    icon: string;
    isCustom?: boolean;
}

// Standard expense categories with Lucide icon names
const STANDARD_EXPENSE_CATEGORIES: Category[] = [
    { id: 'alimentos', name: 'Alimentos', icon: 'Utensils' },
    { id: 'vivienda', name: 'Vivienda', icon: 'Home' },
    { id: 'vehiculo', name: 'Vehículo', icon: 'Car' },
    { id: 'entretenimiento', name: 'Entretenimiento', icon: 'Gamepad2' },
    { id: 'educacion', name: 'Educación', icon: 'GraduationCap' },
    { id: 'other', name: 'Other', icon: 'MoreHorizontal' },
];

const QuickRecordModal = ({ isOpen, onClose, mode, initialData }: QuickRecordModalProps) => {
    const { toast } = useToast();
    const [amount, setAmount] = useState(initialData?.amount || '0');
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.categoryId || 'alimentos');
    const [note, setNote] = useState(initialData?.note || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [allCategories, setAllCategories] = useState<Category[]>(STANDARD_EXPENSE_CATEGORIES);
    const [displayedCategories, setDisplayedCategories] = useState<Category[]>([]);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isIncome = mode === 'income';
    const title = isIncome ? 'Agregar Ingreso' : 'Agregar Gasto';
    const saveLabel = isIncome ? 'Guardar Ingreso' : 'Guardar Gasto';
    const bgColor = isIncome ? 'bg-[#A1887F]' : 'bg-[#8D6E63]';
    const selectedColor = isIncome ? 'bg-[#A1887F]' : 'bg-[#8D6E63]';

    // Fetch categories and order by recent usage
    useEffect(() => {
        if (!isOpen) return;

        const fetchAndOrderCategories = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setAllCategories(STANDARD_EXPENSE_CATEGORIES);
                    setDisplayedCategories(STANDARD_EXPENSE_CATEGORIES.slice(0, 5));
                    return;
                }

                // Fetch user's custom categories
                const { data: userCategories } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('type', mode === 'expense' ? 'gasto' : 'ingreso')
                    .is('parent_id', null);

                const customCats: Category[] = (userCategories || []).map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    icon: (cat as any).icon || 'MoreHorizontal',
                    isCustom: true
                }));

                // Merge standard + custom categories
                const allCats = [...STANDARD_EXPENSE_CATEGORIES, ...customCats];

                // Get recently used category IDs from latest transactions
                const { data: recentTransactions } = await supabase
                    .from('transactions')
                    .select('category_id')
                    .eq('user_id', user.id)
                    .eq('type', mode === 'expense' ? 'gasto' : 'ingreso')
                    .not('category_id', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(20);

                // Count category usage
                const categoryUsage: Record<string, number> = {};
                (recentTransactions || []).forEach(tx => {
                    if (tx.category_id) {
                        categoryUsage[tx.category_id] = (categoryUsage[tx.category_id] || 0) + 1;
                    }
                });

                // Sort categories by usage (most used first), then alphabetically
                const sortedCats = allCats.sort((a, b) => {
                    const usageA = categoryUsage[a.id] || 0;
                    const usageB = categoryUsage[b.id] || 0;
                    if (usageB !== usageA) return usageB - usageA;
                    return a.name.localeCompare(b.name);
                });

                setAllCategories(sortedCats);
                // Show only first 5 categories initially (6th will be "Más" button)
                setDisplayedCategories(sortedCats.slice(0, 5));

                // Set default selected to most recently used or first category
                if (!initialData?.categoryId && sortedCats.length > 0) {
                    setSelectedCategoryId(sortedCats[0].id);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                setAllCategories(STANDARD_EXPENSE_CATEGORIES);
                setDisplayedCategories(STANDARD_EXPENSE_CATEGORIES.slice(0, 5));
            }
        };

        if (mode === 'expense') {
            fetchAndOrderCategories();
        }
    }, [isOpen, mode, initialData?.categoryId]);

    const handleNumClick = (num: string) => {
        if (amount === '0' && num !== '.') {
            setAmount(num);
        } else {
            if (num === '.' && amount.includes('.')) return;
            if (amount.length > 8) return;
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

    const handleSave = async () => {
        if (parseFloat(amount) <= 0) {
            toast({
                title: 'Error',
                description: 'El monto debe ser mayor a 0',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // Find the category in database or create if it's a standard one
            let categoryId = selectedCategoryId;

            // If it's a standard category (not a UUID), we need to find or create it
            if (!selectedCategoryId.includes('-')) {
                const standardCat = STANDARD_EXPENSE_CATEGORIES.find(c => c.id === selectedCategoryId);
                if (standardCat) {
                    // Check if this category exists for the user
                    const { data: existingCat } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('name', standardCat.name)
                        .eq('type', 'gasto')
                        .maybeSingle();

                    if (existingCat) {
                        categoryId = existingCat.id;
                    } else {
                        // Create the category for this user
                        const { data: newCat, error: catError } = await supabase
                            .from('categories')
                            .insert({
                                user_id: user.id,
                                name: standardCat.name,
                                type: 'gasto',
                                color: '#8D6E63',
                                icon: standardCat.icon
                            })
                            .select('id')
                            .single();

                        if (catError) throw catError;
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
                const firstError = validationResult.error.errors[0];
                toast({
                    title: 'Datos inválidos',
                    description: firstError.message,
                    variant: 'destructive',
                });
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
                description: `Tu ${isIncome ? 'ingreso' : 'gasto'} ha sido agregado exitosamente`,
            });

            // Reset form
            setAmount('0');
            setNote('');
            setDate(new Date().toISOString().split('T')[0]);
            setSelectedCategoryId('alimentos');

            onClose();
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast({
                title: 'Error',
                description: `No se pudo registrar el ${isIncome ? 'ingreso' : 'gasto'}`,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return 'Seleccionar';
        const [y, m, d] = dateString.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const today = new Date();

        const isToday =
            dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear();

        if (isToday) return 'Hoy';
        return `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    };

    const getCategoryIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            Utensils,
            Home,
            Car,
            Gamepad2,
            GraduationCap,
            MoreHorizontal,
        };
        const IconComponent = icons[iconName] || MoreHorizontal;
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
                    transition={{ duration: 0.2, ease: 'easeOut' }}
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

                        {/* Categories Carousel */}
                        <div className="mb-3">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block px-1">
                                CATEGORÍA
                            </span>
                            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-1">
                                {(showAllCategories ? allCategories : displayedCategories).map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className="flex flex-col items-center gap-1 group min-w-[54px]"
                                    >
                                        <div className={`h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${selectedCategoryId === cat.id
                                            ? `${selectedColor} text-white scale-110 shadow-lg`
                                            : 'bg-white text-gray-400 group-hover:bg-[#F5F0EE]'
                                            }`}>
                                            {getCategoryIcon(cat.icon)}
                                        </div>
                                        <span className={`text-[8px] font-bold truncate w-full text-center ${selectedCategoryId === cat.id ? 'text-[#8D6E63]' : 'text-gray-400'
                                            }`}>
                                            {cat.name}
                                        </span>
                                    </button>
                                ))}

                                {/* Más button - only show if there are more categories and not expanded */}
                                {!showAllCategories && allCategories.length > 5 && (
                                    <button
                                        onClick={() => setShowAllCategories(true)}
                                        className="flex flex-col items-center gap-1 group min-w-[54px]"
                                    >
                                        <div className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center shadow-md hover:bg-gray-200 transition-all">
                                            <Plus size={18} strokeWidth={2.5} className="text-gray-500" />
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-500">
                                            Más
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Date & Note Inputs */}
                        <div className="grid grid-cols-2 gap-2.5 mb-3">
                            <button
                                onClick={() => setIsDatePickerOpen(true)}
                                className="w-full h-10 bg-white rounded-xl flex items-center px-3 gap-2 shadow-sm border border-gray-100 text-gray-700 active:scale-98 transition-transform hover:bg-gray-50"
                            >
                                <Calendar size={14} className="text-[#8D6E63]" />
                                <span className="text-xs font-bold truncate">
                                    {formatDateDisplay(date)}
                                </span>
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

                        {/* Keypad - more compact */}
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
                            className={`w-full shrink-0 ${bgColor} text-white h-11 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <CheckCircleIcon />
                            {isSaving ? 'Guardando...' : saveLabel}
                        </button>

                    </div>

                    {/* Date Picker Overlay */}
                    {isDatePickerOpen && (
                        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4" onClick={() => setIsDatePickerOpen(false)}>
                            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Seleccionar Fecha</h3>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        setIsDatePickerOpen(false);
                                    }}
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
