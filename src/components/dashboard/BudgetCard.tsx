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
            name: name.replace(/^[^\w\s]+\s*/, ''),
            // Remove emoji prefix
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
  const getCategoryIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('alimenta') || lower.includes('comida') || lower.includes('restaur')) return 'food';
    if (lower.includes('transport') || lower.includes('uber') || lower.includes('gasolina')) return 'car';
    if (lower.includes('entreten') || lower.includes('netflix') || lower.includes('spotify')) return 'film';
    if (lower.includes('vivienda') || lower.includes('renta') || lower.includes('casa')) return 'home';
    if (lower.includes('salud') || lower.includes('médico') || lower.includes('farmacia')) return 'health';
    if (lower.includes('educación') || lower.includes('curso')) return 'education';
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

  // Calculate progress percentages
  const budgetUsed = totalBudget > 0 ? Math.min(expenses / totalBudget * 100, 100) : 0;
  const incomeVsBudget = totalBudget > 0 ? Math.min(income / totalBudget * 100, 100) : 0;
  const maxCategoryAmount = topCategories.length > 0 ? topCategories[0].amount : 1;
  return <div className="w-full bg-white rounded-2xl px-4 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/budgets')}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-[#F5F0EE] flex items-center justify-center text-[#8D6E63]">
          <PiggyBank size={16} />
        </div>
        <h3 className="text-gray-800 font-bold text-sm">Balance del mes</h3>
      </div>

      {/* Income & Expenses */}
      <div className="space-y-3">
        {/* Income */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp size={12} className="text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-600">Ingresos</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(income)}</span>
          </div>
          <Progress value={incomeVsBudget} className="h-2 bg-gray-100" />
        </div>

        {/* Expenses */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-red-50 flex items-center justify-center">
                <TrendingDown size={12} className="text-red-600" />
              </div>
              <span className="text-xs font-medium text-gray-600">Gastos</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(expenses)}</span>
          </div>
          <div className="relative">
            <Progress value={budgetUsed} className={`h-2 ${budgetUsed > 80 ? 'bg-red-100' : 'bg-gray-100'}`} />
            {totalBudget > 0}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Top 3 Categories */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
            Top categorías
          </span>
          
          {loading ? <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gray-200" />
                  <div className="flex-1 h-2 bg-gray-200 rounded" />
                </div>)}
            </div> : topCategories.length > 0 ? topCategories.map((category, index) => <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full ${category.color}/10 flex items-center justify-center`}>
                      {renderIcon(category.icon, `${category.color.replace('bg-', 'text-')}`)}
                    </div>
                    <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{formatCurrency(category.amount)}</span>
                </div>
                <Progress value={category.amount / maxCategoryAmount * 100} className="h-1.5 bg-gray-100" />
              </div>) : <p className="text-xs text-gray-400 text-center py-2">Sin gastos este mes</p>}
        </div>
      </div>
    </div>;
};
export default BudgetCard;