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
    <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 active:scale-95 transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Plan de Pago de Deudas
            </p>
            <p className="text-xs text-muted-foreground">
              Estrategia: {strategy === 'avalanche' ? '❄️ Avalancha' : '⛄ Bola de nieve'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={`${dti < 30 ? 'bg-emerald-50 border-emerald-200' : dti < 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} rounded-lg p-2 border`}>
            <p className="text-[10px] text-muted-foreground">DTI (Debt-to-Income)</p>
            <p className={`text-lg font-bold ${dti < 30 ? 'text-emerald-600' : dti < 50 ? 'text-yellow-600' : 'text-red-600'}`}>{dti.toFixed(1)}%</p>
            <p className={`text-[10px] ${dti < 30 ? 'text-emerald-600' : dti < 50 ? 'text-yellow-600' : 'text-red-600'}`}>{dtiStatus}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
            <p className="text-[10px] text-muted-foreground">Intereses totales</p>
            <p className="text-lg font-bold text-purple-600">${totalInterest.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">próximos 12M</p>
          </div>
        </div>

        {debts.length > 0 ? (
          <div className="space-y-2">
            {debts.map((debt, idx) => (
              <div 
                key={idx}
                className="bg-muted/50 rounded-lg p-3 border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{debt.order}
                      </span>
                      {debt.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Tasa: {debt.interest}% APR
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600 break-words">
                      ${debt.balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Pago mín: ${debt.minPayment}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Salida estimada</p>
                    <p className="text-xs font-medium text-emerald-600">{debt.payoffDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Ahorras +${debt.interestSaved}</p>
                    <p className="text-[10px] text-emerald-600">si aportas +$300</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 text-center">
            <p className="text-sm text-emerald-700">🎉 ¡Sin deudas registradas!</p>
            <p className="text-xs text-muted-foreground mt-1">Mantén este estado</p>
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
