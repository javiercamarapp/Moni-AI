import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";

interface Action {
  title: string;
  description: string;
  impact: number;
  type: 'save' | 'reduce' | 'optimize';
}

interface TopActionsProps {
  actions: Action[];
}

export default function TopActionsWidget({ actions }: TopActionsProps) {
  const getActionIcon = (type: string) => {
    switch(type) {
      case 'save': return '💰';
      case 'reduce': return '✂️';
      case 'optimize': return '⚡';
      default: return '💡';
    }
  };

  const totalPotentialSavings = actions.reduce((sum, a) => sum + a.impact, 0);

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Top 3 Acciones de Ahorro
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ahorro potencial: <span className="text-emerald-600 font-bold">${totalPotentialSavings.toLocaleString()}/mes</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {actions.map((action, idx) => (
            <div 
              key={idx}
              className="bg-muted/50 rounded-lg p-3 border border-border hover:border-primary/50 transition-all"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getActionIcon(action.type)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-emerald-600 font-bold text-sm">
                      +${action.impact.toLocaleString()}/mes
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      (${(action.impact * 12).toLocaleString()}/año)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
          size="sm"
        >
          <TrendingUp className="h-3 w-3 mr-2" />
          Ver Plan Completo
        </Button>
      </div>
    </Card>
  );
}
