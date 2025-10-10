import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, Shield, Calculator, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";

export default function SafeToSpendExplanation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Seguro para Gastar</h1>
              <p className="text-white/70 text-sm">Tu dinero disponible protegido</p>
            </div>
          </div>
        </div>

        {/* Main Explanation Card */}
        <Card className="p-6 mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">¿Qué es el Seguro para Gastar?</h2>
              <p className="text-white/80 leading-relaxed">
                Es la cantidad de dinero que puedes gastar libremente sin comprometer tus obligaciones financieras ni tus metas de ahorro. Es tu "colchón seguro" para gastos variables y discrecionales.
              </p>
            </div>
          </div>
        </Card>

        {/* Calculation Breakdown */}
        <Card className="p-6 mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">¿Cómo se calcula?</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-1">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">1. Ingreso Mensual</p>
                <p className="text-white/70 text-sm">Todo el dinero que entra en el mes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Wallet className="w-4 h-4 text-danger" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">2. Menos Gastos Fijos</p>
                <p className="text-white/70 text-sm">Renta, servicios, préstamos, etc.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Target className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">3. Menos Metas de Ahorro</p>
                <p className="text-white/70 text-sm">El dinero que planeas ahorrar</p>
              </div>
            </div>

            <div className="border-t border-white/20 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-success" />
                  <p className="text-white font-semibold">= Seguro para Gastar</p>
                </div>
                <p className="text-success font-bold text-lg">Tu dinero libre</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Benefits */}
        <Card className="p-6 mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">¿Por qué es importante?</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-success"></div>
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-semibold text-white">Protege tus obligaciones:</span> Asegura que siempre podrás pagar tus gastos fijos
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-success"></div>
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-semibold text-white">Cumple tus metas:</span> Mantiene tu plan de ahorro en marcha sin interrupciones
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-success"></div>
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-semibold text-white">Gasta sin culpa:</span> Sabes exactamente cuánto puedes gastar libremente
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-success"></div>
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-semibold text-white">Evita sobregiros:</span> Previene que gastes más de lo que deberías
              </p>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm border-primary/30">
          <h3 className="text-lg font-semibold text-white mb-3">💡 Consejo</h3>
          <p className="text-white/90 text-sm leading-relaxed">
            Si tu "Seguro para Gastar" es negativo, significa que tus gastos fijos y metas de ahorro superan tus ingresos. Es momento de revisar y ajustar tu presupuesto.
          </p>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
