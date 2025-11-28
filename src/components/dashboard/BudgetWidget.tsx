import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BudgetWidgetProps {
  totalBudget: number;
  currentExpenses: number;
}

export default function BudgetWidget({ totalBudget, currentExpenses }: BudgetWidgetProps) {
  const navigate = useNavigate();
  const [topCategories, setTopCategories] = useState<Array<{ name: string; spent: number; budget: number; icon: string }>>([]);
  
  const percentUsed = totalBudget > 0 ? (currentExpenses / totalBudget) * 100 : 0;
  const remaining = totalBudget - currentExpenses;
  const isOverBudget = remaining < 0;
  const isWarning = percentUsed >= 80;

  useEffect(() => {
    const fetchTopCategories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get budgets with categories
      const { data: budgets } = await supabase
        .from('category_budgets')
        .select(`
          monthly_budget,
          category_id,
          categories!inner(id, name, parent_id)
        `)
        .eq('user_id', user.id)
        .is('categories.parent_id', null);

      if (!budgets || budgets.length === 0) return;

      // Get expenses for this month
      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount, category_id, categories(name, parent_id)')
        .eq('user_id', user.id)
        .eq('type', 'gasto')
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0]);

      // Calculate spending per category
      const categorySpending: Record<string, number> = {};
      expenses?.forEach(exp => {
        const catId = exp.category_id;
        const parentId = (exp.categories as any)?.parent_id;
        const targetId = parentId || catId;
        if (targetId) {
          categorySpending[targetId] = (categorySpending[targetId] || 0) + Number(exp.amount);
        }
      });

      // Map to top 3 categories by spending
      const categoryData = budgets
        .filter(b => {
          const name = (b.categories as any)?.name || '';
          return !name.includes('Ahorro') && !name.includes('Inversión') && !name.includes('emergencia');
        })
        .map(b => {
          const catId = (b.categories as any)?.id;
          const spent = categorySpending[catId] || 0;
          const name = (b.categories as any)?.name || 'Categoría';
          const icons: Record<string, string> = {
            'Comida': '🍔',
            'Transporte': '🚗',
            'Entretenimiento': '🎬',
            'Compras': '🛍️',
            'Servicios': '💡',
            'Salud': '🏥',
            'Educación': '📚',
            'Hogar': '🏠',
            'Ropa': '👕',
            'Tecnología': '💻',
          };
          const icon = icons[name] || '📊';
          return { name, spent, budget: Number(b.monthly_budget), icon };
        })
        .sort((a, b) => (b.spent / b.budget) - (a.spent / a.budget))
        .slice(0, 3);

      setTopCategories(categoryData);
    };

    fetchTopCategories();
  }, [totalBudget, currentExpenses]);

  // Si no hay presupuesto configurado
  if (totalBudget === 0) {
    return (
      <div className="px-6 mb-4">
        <Card 
          className="p-4 bg-card rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/budgets')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Configura tu presupuesto</p>
                <p className="text-xs text-muted-foreground">Controla tus gastos mensuales</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 mb-4">
      <Card 
        className="p-4 bg-card rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
        onClick={() => navigate('/budgets')}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="text-sm font-semibold text-foreground">Presupuesto del Mes</span>
            </div>
            <div className="flex items-center gap-2">
              {isWarning && (
                <AlertTriangle className={`w-4 h-4 ${isOverBudget ? 'text-destructive' : 'text-yellow-500'}`} />
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={Math.min(percentUsed, 100)} 
              className={`h-2 ${
                isOverBudget ? 'bg-destructive/20' : 
                isWarning ? 'bg-yellow-500/20' : 
                'bg-muted'
              }`}
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${
                isOverBudget ? 'text-destructive' : 
                isWarning ? 'text-yellow-600' : 
                'text-muted-foreground'
              }`}>
                ${currentExpenses.toLocaleString()} de ${totalBudget.toLocaleString()}
              </span>
              <span className={`text-xs font-semibold ${
                isOverBudget ? 'text-destructive' : 
                isWarning ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {isOverBudget ? `Excedido $${Math.abs(remaining).toLocaleString()}` : `Quedan $${remaining.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              {topCategories.map((cat, idx) => {
                const catPercent = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                const catWarning = catPercent >= 80;
                const catOver = catPercent >= 100;
                
                return (
                  <div key={idx} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1">
                    <span className="text-xs">{cat.icon}</span>
                    <span className={`text-[10px] font-medium ${
                      catOver ? 'text-destructive' : 
                      catWarning ? 'text-yellow-600' : 
                      'text-muted-foreground'
                    }`}>
                      {catPercent.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
