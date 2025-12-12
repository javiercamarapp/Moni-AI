import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, TrendingUp, TrendingDown, ShoppingBag, Utensils, Car, Film, Home, CreditCard, Heart, GraduationCap, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cacheService';

interface CategorySpending {
  name: string;
  amount: number;
  icon: string;
  color: string;
}

interface BudgetCardProps {
  income: number;
  expenses: number;
  totalBudget: number;
}

// Helper to validate and sanitize cached categories
const validateCachedCategories = (cached: any): CategorySpending[] => {
  if (!Array.isArray(cached)) return [];
  return cached
    .filter((c): c is CategorySpending => 
      c && typeof c.name === 'string' && typeof c.amount === 'number'
    )
    .slice(0, 3) // Always ensure max 3
    .map(c => ({
      name: c.name,
      amount: c.amount,
      icon: c.icon || 'shopping',
      color: c.color || 'bg-[#5D4037]'
    }));
};

const BudgetCard: React.FC<BudgetCardProps> = ({
  income,
  expenses,
  totalBudget
}) => {
  const navigate = useNavigate();
  
  // Initialize with validated cached data - only top 3, never more
  const [topCategories, setTopCategories] = useState<CategorySpending[]>(() => {
    const cached = getCache<CategorySpending[]>(CACHE_KEYS.TOP_CATEGORIES);
    return validateCachedCategories(cached);
  });
  
  const [loading, setLoading] = useState(() => {
    const cached = getCache<CategorySpending[]>(CACHE_KEYS.TOP_CATEGORIES);
    const validated = validateCachedCategories(cached);
    return validated.length === 0;
  });

  useEffect(() => {
    const fetchTopCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, categories(name)')
          .eq('user_id', user.id)
          .eq('type', 'gasto')
          .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
          .lte('transaction_date', endOfMonth.toISOString().split('T')[0]);

        if (transactions && transactions.length > 0) {
          // Group by category
          const categoryMap = new Map<string, number>();
          transactions.forEach((tx: any) => {
            const rawName = tx.categories?.name || 'Otros';
            // Use the raw category name directly - no renaming
            const categoryName = rawName.replace(/^[^\w\sáéíóúñ]+\s*/i, '').trim().split(' ')[0];
            const current = categoryMap.get(categoryName) || 0;
            categoryMap.set(categoryName, current + Number(tx.amount));
          });

          const sortedCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, amount]) => ({
              name: name.length > 12 ? name.substring(0, 12) : name,
              amount,
              icon: getCategoryIcon(name),
              color: 'bg-[#5D4037]'
            }));

          setTopCategories(sortedCategories);
          // Cache ONLY the top 3 with user id
          setCache(CACHE_KEYS.TOP_CATEGORIES, sortedCategories, CACHE_TTL.SHORT, user.id);
        }
      } catch (error) {
        console.error('Error fetching top categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCategories();
  }, []);
  const getCategoryIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('renta') || lower.includes('hipoteca') || lower.includes('vivienda') || lower.includes('casa')) return 'home';
    if (lower.includes('supermercado') || lower.includes('super') || lower.includes('alimenta')) return 'food';
    if (lower.includes('restaur') || lower.includes('comida')) return 'food';
    if (lower.includes('transport') || lower.includes('uber')) return 'car';
    if (lower.includes('gasolina') || lower.includes('carga')) return 'car';
    if (lower.includes('entreten') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('cine') || lower.includes('estilo')) return 'film';
    if (lower.includes('salud') || lower.includes('médico') || lower.includes('farmacia')) return 'health';
    if (lower.includes('educación') || lower.includes('curso') || lower.includes('desarrollo')) return 'education';
    if (lower.includes('gimnasio') || lower.includes('gym')) return 'health';
    if (lower.includes('luz') || lower.includes('servicio') || lower.includes('agua') || lower.includes('internet')) return 'zap';
    if (lower.includes('deuda') || lower.includes('crédito') || lower.includes('tarjeta')) return 'credit';
    if (lower.includes('salidas') || lower.includes('fiestas') || lower.includes('bares')) return 'film';
    return 'shopping';
  };
  const getCategoryColor = (): string => {
    // Using consistent brown palette for all categories
    return 'bg-[#5D4037]';
  };
  const renderIcon = (iconType: string, className: string) => {
    const props = {
      size: 16,
      strokeWidth: 2.5,
      className
    };
    switch (iconType) {
      case 'food':
        return <Utensils {...props} />;
      case 'car':
        return <Car {...props} />;
      case 'film':
        return <Film {...props} />;
      case 'home':
        return <Home {...props} />;
      case 'health':
        return <Heart {...props} />;
      case 'education':
        return <GraduationCap {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'credit':
        return <CreditCard {...props} />;
      default:
        return <ShoppingBag {...props} />;
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate proportions for single compound bar
  const total = income + expenses;
  const incomePercent = total > 0 ? income / total * 100 : 50;
  const expensePercent = total > 0 ? expenses / total * 100 : 50;
  const maxCategoryAmount = topCategories.length > 0 ? topCategories[0].amount : 1;
  return <div className="w-full bg-white rounded-2xl px-4 py-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/balance')}>
    {/* Header */}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-[#F5F0EE] flex items-center justify-center text-[#8D6E63]">
          <PiggyBank size={14} />
        </div>
        <h3 className="text-gray-800 font-bold text-sm">Balance mensual</h3>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate('/balance');
        }}
        className="text-xs text-[#8D6E63] font-medium hover:text-[#5D4037] transition-colors"
      >
        Ver resumen ›
      </button>
    </div>

    {/* Single Compound Progress Bar - Income vs Expenses */}
    <div className="mb-3">
      <div className="h-4 lg:h-6 rounded-full overflow-hidden flex w-full">
        <div className="h-full bg-[#5D4037] rounded-l-full" style={{
          width: `${incomePercent}%`
        }} />
        <div className="h-full bg-[#BCAAA4] rounded-r-full" style={{
          width: `${expensePercent}%`
        }} />
      </div>
      <div className="flex justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#5D4037]"></div>
          <span className="text-xs text-gray-800 font-bold">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#BCAAA4]"></div>
          <span className="text-xs text-gray-800 font-bold">{formatCurrency(expenses)}</span>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-2 mt-3">
        <button onClick={e => {
          e.stopPropagation();
          navigate('/ingresos');
        }} className="flex-1 flex items-center justify-center gap-1.5 bg-[#5D4037]/10 hover:bg-[#5D4037]/20 text-[#5D4037] rounded-xl py-2 transition-colors">
          <TrendingUp size={14} />
          <span className="text-xs font-semibold">Ingresos</span>
        </button>
        <button onClick={e => {
          e.stopPropagation();
          navigate('/gastos');
        }} className="flex-1 flex items-center justify-center gap-1.5 bg-[#BCAAA4]/20 hover:bg-[#BCAAA4]/30 text-[#5D4037] rounded-xl py-2 transition-colors">
          <TrendingDown size={14} />
          <span className="text-xs font-semibold">Gastos</span>
        </button>
      </div>
    </div>

    {/* Divider */}
    <div className="h-px bg-gray-100 my-2" />

    {/* Top 3 Categories - Icons only, evenly distributed */}
    <div>
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
        Top categorías
      </span>

      {loading ? <div className="flex justify-around">
        {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-gray-200" />)}
      </div> : topCategories.length > 0 ? <div className="flex justify-around items-center">
        {topCategories.filter(c => c && c.name).map((category, index) => {
          const colorClass = category.color || 'bg-[#5D4037]';
          const textColorClass = colorClass.replace('bg-', 'text-') || 'text-[#5D4037]';
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="text-[10px] lg:text-xs font-medium text-gray-600 text-center leading-tight">{category.name}</span>
              <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-full ${colorClass}/20 flex items-center justify-center`}>
                {renderIcon(category.icon || 'shopping', textColorClass)}
              </div>
              <span className="text-xs lg:text-sm font-bold text-gray-800">{formatCurrency(category.amount || 0)}</span>
            </div>
          );
        })}
      </div> : <p className="text-xs text-gray-400 text-center py-1">Sin gastos este mes</p>}
    </div>
  </div>;
};
export default BudgetCard;