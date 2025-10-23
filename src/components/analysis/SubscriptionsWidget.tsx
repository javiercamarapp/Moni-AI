import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp } from "lucide-react";

interface Subscription {
  name: string;
  amount: number;
  frequency: string;
  lastUsed: string;
  daysUnused: number;
  priceChange?: number;
  icon: string;
}

interface SubscriptionsProps {
  subscriptions: Subscription[];
  totalMonthly: number;
}

export default function SubscriptionsWidget({ subscriptions, totalMonthly }: SubscriptionsProps) {
  const unusedSubs = subscriptions.filter(s => s.daysUnused >= 30);
  const increasedSubs = subscriptions.filter(s => s.priceChange && s.priceChange > 0);

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">💳 Suscripciones</p>
            <p className="text-xs text-muted-foreground">
              Total: <span className="text-purple-600 font-bold">${totalMonthly}/mes</span>
            </p>
          </div>
          {(unusedSubs.length > 0 || increasedSubs.length > 0) && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
        </div>

        <div className="space-y-2">
          {subscriptions.map((sub, idx) => {
            const isUnused = sub.daysUnused >= 30;
            const hasIncrease = sub.priceChange && sub.priceChange > 0;
            
            return (
              <div 
                key={idx}
                className={`bg-muted/50 rounded-lg p-2 border ${
                  isUnused || hasIncrease ? 'border-yellow-300' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{sub.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{sub.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Último uso: {sub.lastUsed}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      ${sub.amount}/{sub.frequency === 'monthly' ? 'm' : 'a'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {isUnused && (
                    <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-300">
                      Sin uso {sub.daysUnused} días
                    </Badge>
                  )}
                  {hasIncrease && (
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-300 flex items-center gap-1">
                      <TrendingUp className="h-2 w-2" />
                      Subió ${sub.priceChange}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {unusedSubs.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              💡 {unusedSubs.length} suscripciones sin usar podrían ahorrarte ${unusedSubs.reduce((sum, s) => sum + s.amount, 0)}/mes
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
