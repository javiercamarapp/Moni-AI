import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, TrendingUp, TrendingDown, ShoppingBag, Utensils, Car, Film, Home, CreditCard, Heart, GraduationCap, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
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
const BudgetCard: React.FC<BudgetCardProps> = ({
  income,
  expenses,
  totalBudget
}) => {
  const navigate = useNavigate();
  const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchTopCategories = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const {
          data: transactions
        } = await supabase.from('transactions').select('amount, categories(name)').eq('user_id', user.id).eq('type', 'gasto').gte('transaction_date', startOfMonth.toISOString().split('T')[0]).lte('transaction_date', endOfMonth.toISOString().split('T')[0]);
        if (transactions && transactions.length > 0) {
          // Group by category
          const categoryMap = new Map<string, number>();
          transactions.forEach((tx: any) => {
            const categoryName = tx.categories?.name || 'Otros';
            const current = categoryMap.get(categoryName) || 0;
            categoryMap.set(categoryName, current + Number(tx.amount));
          });

          // Sort and get top 3
          const sorted = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, amount]) => ({
            name: getShortCategoryName(name),
            amount,
            icon: getCategoryIcon(name),
            color: getCategoryColor(name)
          }));
          setTopCategories(sorted);
        }
      } catch (error) {
        console.error('Error fetching top categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopCategories();
  }, []);

  const getShortCategoryName = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('alimenta') || lower.includes('comida') || lower.includes('super')) return 'Super';
    if (lower.includes('restaur')) return 'Comida';
    if (lower.includes('transport') || lower.includes('uber') || lower.includes('gasolina')) return 'Transporte';
    if (lower.includes('entreten') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('cine') || lower.includes('ocio')) return 'Entretenimiento';
    if (lower.includes('vivienda') || lower.includes('renta') || lower.includes('casa')) return 'Vivienda';
    if (lower.includes('salud') || lower.includes('médico') || lower.includes('farmacia')) return 'Salud';
    if (lower.includes('educación') || lower.includes('curso') || lower.includes('desarrollo')) return 'Entretenimiento';
    if (lower.includes('servicio') || lower.includes('luz') || lower.includes('agua')) return 'Servicios';
    if (lower.includes('deuda') || lower.includes('crédito') || lower.includes('tarjeta')) return 'Deudas';
    if (lower.includes('compras') || lower.includes('ropa')) return 'Compras';
    // Get first word only as fallback
    const cleanName = name.replace(/^[^\w\s]+\s*/, '').split(' ')[0];
    return cleanName.length > 10 ? cleanName.substring(0, 10) : cleanName;
  };
  const getCategoryIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('alimenta') || lower.includes('comida') || lower.includes('restaur') || lower.includes('super')) return 'food';
    if (lower.includes('transport') || lower.includes('uber') || lower.includes('gasolina')) return 'car';
    if (lower.includes('entreten') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('cine') || lower.includes('ocio')) return 'film';
    if (lower.includes('vivienda') || lower.includes('renta') || lower.includes('casa')) return 'home';
    if (lower.includes('salud') || lower.includes('médico') || lower.includes('farmacia')) return 'health';
    if (lower.includes('educación') || lower.includes('curso') || lower.includes('desarrollo')) return 'film';
    if (lower.includes('servicio') || lower.includes('luz') || lower.includes('agua')) return 'zap';
    if (lower.includes('deuda') || lower.includes('crédito') || lower.includes('tarjeta')) return 'credit';
    return 'shopping';
  };
  const getCategoryColor = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('alimenta') || lower.includes('comida')) return 'bg-green-500';
    if (lower.includes('transport')) return 'bg-blue-500';
    if (lower.includes('entreten')) return 'bg-pink-500';
    if (lower.includes('vivienda')) return 'bg-indigo-500';
    if (lower.includes('salud')) return 'bg-red-500';
    if (lower.includes('educación')) return 'bg-purple-500';
    if (lower.includes('servicio')) return 'bg-yellow-500';
    if (lower.includes('deuda')) return 'bg-orange-500';
    return 'bg-gray-500';
  };
  const renderIcon = (iconType: string, className: string) => {
    const props = {
      size: 14,
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
  const incomePercent = total > 0 ? (income / total) * 100 : 50;
  const expensePercent = total > 0 ? (expenses / total) * 100 : 50;
  const maxCategoryAmount = topCategories.length > 0 ? topCategories[0].amount : 1;

  return <div className="w-full bg-white rounded-2xl px-4 py-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/balance')}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-xl bg-[#F5F0EE] flex items-center justify-center text-[#8D6E63]">
          <PiggyBank size={14} />
        </div>
        <h3 className="text-gray-800 font-bold text-sm">Balance del mes</h3>
      </div>

      {/* Single Compound Progress Bar - Income vs Expenses */}
      <div className="mb-3">
        <div className="h-4 lg:h-6 rounded-full overflow-hidden flex w-full">
          <div 
            className="h-full bg-[#5D4037] rounded-l-full"
            style={{ width: `${incomePercent}%` }}
          />
          <div 
            className="h-full bg-[#BCAAA4] rounded-r-full"
            style={{ width: `${expensePercent}%` }}
          />
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
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 my-2" />

        {/* Top 3 Categories - Icons only, evenly distributed */}
        <div>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Top categorías
          </span>
          
          {loading ? <div className="flex justify-around">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-10 w-10 rounded-full bg-gray-200" />)}
            </div> : topCategories.length > 0 ? <div className="flex justify-around items-center">
              {topCategories.map((category, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-medium text-gray-600 text-center leading-tight">{category.name}</span>
                  <div className={`h-8 w-8 rounded-full ${category.color}/20 flex items-center justify-center`}>
                    {renderIcon(category.icon, `${category.color.replace('bg-', 'text-')}`)}
                  </div>
                  <span className="text-[10px] font-bold text-gray-800">{formatCurrency(category.amount)}</span>
                </div>
              ))}
            </div> : <p className="text-xs text-gray-400 text-center py-1">Sin gastos este mes</p>}
        </div>
    </div>;
};
export default BudgetCard;