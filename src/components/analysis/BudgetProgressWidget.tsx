import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";

interface CategoryBudget {
  name: string;
  spent: number;
  budget: number;
  percentUsed: number;
  icon: string;
}

interface BudgetProgressProps {
  categories: CategoryBudget[];
}

export default function BudgetProgressWidget({ categories }: BudgetProgressProps) {
  return (
    <Card className="p-4 bg-white/5 backdrop-blur border-white/20">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-white/80 mb-1">Presupuesto por Categoría</p>
          <p className="text-xs text-white/60">Progreso del mes</p>
        </div>

        <div className="space-y-3">
          {categories.map((cat, idx) => {
            const isWarning = cat.percentUsed >= 80;
            const isCritical = cat.percentUsed >= 100;
            
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-xs text-white/80">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">
                      ${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}
                    </span>
                    {isWarning && (
                      <AlertCircle className={`h-3 w-3 ${isCritical ? 'text-red-400' : 'text-yellow-400'}`} />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(cat.percentUsed, 100)} 
                    className={`h-2 ${
                      isCritical ? 'bg-red-500/20' : 
                      isWarning ? 'bg-yellow-500/20' : 
                      'bg-white/10'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${
                      isCritical ? 'text-red-300' : 
                      isWarning ? 'text-yellow-300' : 
                      'text-emerald-300'
                    }`}>
                      {cat.percentUsed.toFixed(0)}% usado
                    </span>
                    <span className="text-[10px] text-white/50">
                      {cat.percentUsed < 100 
                        ? `Quedan $${(cat.budget - cat.spent).toLocaleString()}` 
                        : `Excedido $${(cat.spent - cat.budget).toLocaleString()}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {categories.some(c => c.percentUsed >= 80) && (
          <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/30">
            <p className="text-xs text-yellow-200">
              ⚠️ {categories.filter(c => c.percentUsed >= 80).length} categorías cerca o sobre el límite
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
