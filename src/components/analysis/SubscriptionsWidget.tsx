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
    <Card className="p-4 bg-gradient-card card-glow border-white/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80">💳 Suscripciones</p>
            <p className="text-xs text-white/60">
              Total: <span className="text-purple-300 font-bold">${totalMonthly}/mes</span>
            </p>
          </div>
          {(unusedSubs.length > 0 || increasedSubs.length > 0) && (
            <AlertCircle className="h-4 w-4 text-yellow-400" />
          )}
        </div>

        <div className="space-y-2">
          {subscriptions.map((sub, idx) => {
            const isUnused = sub.daysUnused >= 30;
            const hasIncrease = sub.priceChange && sub.priceChange > 0;
            
            return (
              <div 
                key={idx}
                className={`bg-white/5 rounded-lg p-2 border ${
                  isUnused || hasIncrease ? 'border-yellow-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{sub.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-white">{sub.name}</p>
                      <p className="text-[10px] text-white/60">
                        Último uso: {sub.lastUsed}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      ${sub.amount}/{sub.frequency === 'monthly' ? 'm' : 'a'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {isUnused && (
                    <Badge variant="outline" className="text-[10px] glass text-foreground border-border">
                      Sin uso {sub.daysUnused} días
                    </Badge>
                  )}
                  {hasIncrease && (
                    <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-300 border-red-500/30 flex items-center gap-1">
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
          <div className="glass rounded-lg p-2 border-border">
            <p className="text-xs text-foreground">
              💡 {unusedSubs.length} suscripciones sin usar podrían ahorrarte ${unusedSubs.reduce((sum, s) => sum + s.amount, 0)}/mes
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
