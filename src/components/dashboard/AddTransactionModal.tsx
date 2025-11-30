import React, { useState, useEffect } from 'react';
import { ArrowLeft, Utensils, Bus, ShoppingBag, Gamepad2, Receipt, Calendar, PenLine, Delete, Plus, Briefcase, Heart, Home, Zap, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'expense' | 'income';
  onSuccess?: () => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

// Date Picker Modal Component
const DatePickerModal: React.FC<{
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}> = ({ selectedDate, onSelect, onClose }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    onSelect(`${year}-${m}-${d}`);
    onClose();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const [selY, selM, selD] = selectedDate.split('-').map(Number);
    return selY === year && selM === (month + 1) && selD === day;
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-[320px] shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
          <X size={20} />
        </button>

        <div className="flex items-center justify-between mb-6 px-2 pt-2">
          <button onClick={handlePrevMonth} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 active:scale-90 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {monthNames[month]} <span className="text-gray-400 text-sm ml-1">{year}</span>
          </h2>
          <button onClick={handleNextMonth} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 active:scale-90 transition-transform">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 gap-x-1">
          {daysArray.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} />;
            const selected = isSelected(day);
            const today = isToday(day);
            return (
              <div key={day} className="flex items-center justify-center aspect-square">
                <button
                  onClick={() => handleDateClick(day)}
                  className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all
                    ${selected ? 'bg-[#8D6E63] text-white shadow-md scale-105' : today ? 'bg-[#F5F0EE] text-[#8D6E63]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, mode, onSuccess }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isIncome = mode === 'income';
  const title = isIncome ? 'Agregar Ingreso' : 'Agregar Gasto';
  const saveLabel = isIncome ? 'Guardar Ingreso' : 'Guardar Gasto';

  // Default category icons mapping
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('comida') || lower.includes('restaurante') || lower.includes('alimento')) return Utensils;
    if (lower.includes('transporte') || lower.includes('uber') || lower.includes('gasolina')) return Bus;
    if (lower.includes('compra') || lower.includes('shopping') || lower.includes('ropa')) return ShoppingBag;
    if (lower.includes('ocio') || lower.includes('entretenimiento') || lower.includes('diversión')) return Gamepad2;
    if (lower.includes('factura') || lower.includes('servicio') || lower.includes('luz') || lower.includes('agua')) return Receipt;
    if (lower.includes('salud') || lower.includes('médico') || lower.includes('farmacia')) return Heart;
    if (lower.includes('casa') || lower.includes('hogar') || lower.includes('renta')) return Home;
    if (lower.includes('trabajo') || lower.includes('salario') || lower.includes('nómina')) return Briefcase;
    return Zap;
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, mode]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('user_id', user.id)
        .eq('type', isIncome ? 'ingreso' : 'gasto')
        .limit(10);

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Seleccionar';
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();
    
    const isToday = dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();
    
    if (isToday) return 'Hoy';
    return `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
  };

  const handleSave = async () => {
    if (amount === '0' || parseFloat(amount) <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa un monto mayor a 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión",
          variant: "destructive",
        });
        return;
      }

      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          description: note || (isIncome ? 'Ingreso' : 'Gasto'),
          category_id: selectedCategory,
          transaction_date: date,
          type: isIncome ? 'ingreso' : 'gasto',
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-categorize if no category selected
      if (!selectedCategory && newTransaction) {
        supabase.functions.invoke('categorize-transaction', {
          body: {
            transactionId: newTransaction.id,
            userId: user.id,
            description: note || (isIncome ? 'Ingreso' : 'Gasto'),
            amount: parseFloat(amount),
            type: isIncome ? 'ingreso' : 'gasto'
          }
        }).catch(error => {
          console.error('Error categorizando transacción:', error);
        });
      }

      toast({
        title: isIncome ? "Ingreso registrado" : "Gasto registrado",
        description: `$${parseFloat(amount).toLocaleString('es-MX')} agregado exitosamente`,
      });

      // Reset form
      setAmount('0');
      setNote('');
      setSelectedCategory(null);
      setDate(new Date().toISOString().split('T')[0]);
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la transacción",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#f3f4f6] w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
      
      {/* Header */}
      <div className="px-6 py-4 pt-6 flex items-center justify-between shrink-0">
        <button 
          onClick={onClose}
          className="h-10 w-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">{title}</h1>
        <div className="w-10" /> 
      </div>

      <div className="flex-1 flex flex-col px-6 pb-6 min-h-0 overflow-y-auto">
        
        {/* Amount Display */}
        <div className="flex flex-col items-center justify-center shrink-0 py-4">
          <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">INGRESAR MONTO</span>
          <div className="bg-white rounded-[2rem] px-8 py-5 w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-white flex justify-center items-center">
            <span className="text-4xl font-black text-gray-800 tracking-tight truncate">
              ${amount}
            </span>
          </div>
        </div>

        {/* Categories Carousel */}
        {categories.length > 0 && (
          <div className="mb-4 shrink-0">
            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CATEGORÍA</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
              {categories.slice(0, 5).map((cat) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className="flex flex-col items-center gap-1.5 group min-w-[60px]"
                  >
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                      selectedCategory === cat.id 
                        ? 'bg-[#8D6E63] text-white scale-110 shadow-lg' 
                        : 'bg-white text-gray-400 group-hover:bg-[#F5F0EE]'
                    }`}>
                      <Icon size={18} strokeWidth={selectedCategory === cat.id ? 2.5 : 2} />
                    </div>
                    <span className={`text-[9px] font-bold truncate w-full text-center ${selectedCategory === cat.id ? 'text-[#8D6E63]' : 'text-gray-400'}`}>
                      {cat.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date & Note Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
          <button 
            onClick={() => setIsDatePickerOpen(true)}
            className="w-full h-11 bg-white rounded-2xl flex items-center px-4 gap-2 shadow-sm border border-white text-gray-700 active:scale-98 transition-transform"
          >
            <Calendar size={16} className="text-[#8D6E63] shrink-0" />
            <span className="text-xs font-bold truncate">{formatDateDisplay(date)}</span>
          </button>

          <div className="w-full bg-white h-11 rounded-2xl flex items-center px-4 gap-2 shadow-sm border border-white focus-within:ring-2 focus-within:ring-[#8D6E63]/20 transition-all">
            <PenLine size={16} className="text-gray-400 shrink-0" />
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
        <div className="grid grid-cols-3 gap-2.5 mb-4 flex-1 min-h-[180px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
            <button 
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-full bg-white rounded-xl shadow-[0_2px_0_0_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-[1px] border border-gray-50 flex items-center justify-center text-xl font-bold text-gray-700 hover:bg-gray-50 transition-all py-3"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={handleDelete}
            className="h-full bg-white rounded-xl shadow-[0_2px_0_0_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-[1px] border border-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all py-3"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          disabled={isSubmitting || amount === '0'}
          className="w-full shrink-0 bg-[#8D6E63] text-white h-12 rounded-[1rem] font-bold text-sm uppercase tracking-wide shadow-[0_10px_20px_-5px_rgba(141,110,99,0.4)] hover:shadow-[0_15px_25px_-5px_rgba(141,110,99,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          {isSubmitting ? 'Guardando...' : saveLabel}
        </button>
      </div>
      </div>

      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <DatePickerModal 
          selectedDate={date} 
          onSelect={setDate} 
          onClose={() => setIsDatePickerOpen(false)} 
        />
      )}
    </div>
  );
};

export default AddTransactionModal;
