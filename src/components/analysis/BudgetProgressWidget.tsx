import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

interface CategoryBudget {
  name: string;
  spent: number;
  budget: number;
  percentUsed: number;
  icon: string;
}

interface BudgetProgressProps {
  categories?: CategoryBudget[];
  hasBudgets?: boolean;
  isLoading?: boolean;
}

export default function BudgetProgressWidget({ categories = [], hasBudgets = false, isLoading = false }: BudgetProgressProps) {
  const navigate = useNavigate();
  
  // Si está cargando, mostrar loader de IA
  if (isLoading) {
    return (
      <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100">
        <div className="h-32 flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BarChart3 className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            AI analizando presupuesto...
          </p>
        </div>
      </Card>
    );
  }
  
  // Si no tiene presupuestos configurados, mostrar invitación
  if (!hasBudgets || categories.length === 0) {
    return (
      <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
        <div className="text-center space-y-4">
          <div className="text-5xl">📊</div>
          <div>
            <p className="text-base font-semibold text-foreground mb-1">
              Crea tu Presupuesto Mensual
            </p>
            <p className="text-sm text-muted-foreground">
              Controla tus gastos por categoría y recibe alertas cuando te acerques al límite
            </p>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/budgets')}
            className="w-full bg-primary/10 rounded-[20px] shadow-lg border border-primary/20 hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all text-sm h-auto py-3 text-primary font-semibold"
          >
            📊 Configurar Presupuestos
          </Button>
        </div>
      </Card>
    );
  }
  
  // Si tiene presupuestos, mostrar progreso normal
  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-foreground mb-1">Presupuesto por Categoría</p>
          <p className="text-xs text-muted-foreground">Progreso del mes</p>
        </div>

        <div className="space-y-3">
          {categories.map((cat, idx) => {
            const isWarning = cat.percentUsed >= 80;
            const isCritical = cat.percentUsed >= 100;
            
            return (
              <div 
                key={idx} 
                className="space-y-1 cursor-pointer hover:bg-primary/5 p-2 rounded-lg transition-colors"
                onClick={() => navigate(`/category-expenses?category=${encodeURIComponent(cat.name)}`)}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-shrink">
                    <span className="text-xs flex-shrink-0">{cat.icon}</span>
                    <span className="text-[11px] text-foreground truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      ${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}
                    </span>
                    {isWarning && (
                      <AlertCircle className={`h-3 w-3 flex-shrink-0 ${isCritical ? 'text-destructive' : 'text-yellow-500'}`} />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(cat.percentUsed, 100)} 
                    className={`h-2 ${
                      isCritical ? 'bg-destructive/20' : 
                      isWarning ? 'bg-yellow-500/20' : 
                      'bg-muted'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${
                      isCritical ? 'text-destructive' : 
                      isWarning ? 'text-yellow-600' : 
                      'text-success'
                    }`}>
                      {cat.percentUsed.toFixed(0)}% usado
                    </span>
                    <span className="text-[10px] text-muted-foreground">
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
          <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              ⚠️ {categories.filter(c => c.percentUsed >= 80).length} categorías cerca o sobre el límite
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
