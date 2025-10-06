import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingDown } from "lucide-react";

interface Debt {
  name: string;
  balance: number;
  interest: number;
  minPayment: number;
  order: number;
  payoffDate: string;
  interestSaved: number;
}

interface DebtPaymentPlanProps {
  debts: Debt[];
  strategy: 'avalanche' | 'snowball';
  totalInterest: number;
  dti: number;
}

export default function DebtPaymentPlanWidget({ debts, strategy, totalInterest, dti }: DebtPaymentPlanProps) {
  const dtiColor = dti < 30 ? 'emerald' : dti < 50 ? 'yellow' : 'red';
  const dtiStatus = dti < 30 ? '✅ Saludable' : dti < 50 ? '⚠️ Cuidado' : '🚨 Crítico';

  return (
    <Card className="p-4 bg-white/5 backdrop-blur border-white/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80 flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Plan de Pago de Deudas
            </p>
            <p className="text-xs text-white/60">
              Estrategia: {strategy === 'avalanche' ? '❄️ Avalancha' : '⛄ Bola de nieve'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={`bg-${dtiColor}-500/10 rounded-lg p-2 border border-${dtiColor}-500/30`}>
            <p className="text-[10px] text-white/70">DTI (Debt-to-Income)</p>
            <p className={`text-lg font-bold text-${dtiColor}-300`}>{dti.toFixed(1)}%</p>
            <p className={`text-[10px] text-${dtiColor}-300`}>{dtiStatus}</p>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
            <p className="text-[10px] text-white/70">Intereses totales</p>
            <p className="text-lg font-bold text-purple-300">${totalInterest.toLocaleString()}</p>
            <p className="text-[10px] text-white/60">próximos 12M</p>
          </div>
        </div>

        {debts.length > 0 ? (
          <div className="space-y-2">
            {debts.map((debt, idx) => (
              <div 
                key={idx}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-white flex items-center gap-1">
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{debt.order}
                      </span>
                      {debt.name}
                    </p>
                    <p className="text-[10px] text-white/60 mt-1">
                      Tasa: {debt.interest}% APR
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-300">
                      ${(debt.balance / 1000).toFixed(1)}k
                    </p>
                    <p className="text-[10px] text-white/60">
                      Pago mín: ${debt.minPayment}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-white/60">Salida estimada</p>
                    <p className="text-xs font-medium text-emerald-300">{debt.payoffDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/60">Ahorras +${debt.interestSaved}</p>
                    <p className="text-[10px] text-emerald-300">si aportas +$300</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30 text-center">
            <p className="text-sm text-emerald-300">🎉 ¡Sin deudas registradas!</p>
            <p className="text-xs text-white/60 mt-1">Mantén este estado</p>
          </div>
        )}

        <Button 
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          size="sm"
        >
          <TrendingDown className="h-3 w-3 mr-2" />
          Ver Simulador de Pagos
        </Button>
      </div>
    </Card>
  );
}
