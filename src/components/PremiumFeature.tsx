import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface PremiumFeatureProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
}

export default function PremiumFeature({ children, featureName, description }: PremiumFeatureProps) {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full border-0 shadow-2xl bg-card/95 backdrop-blur">
        <CardContent className="pt-8 pb-6 px-6 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-6 rounded-3xl">
                <Crown className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-foreground">
              Función Premium
            </h2>
            <p className="text-base text-muted-foreground font-medium">
              {featureName}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground/80">
                {description}
              </p>
            )}
          </div>

          {/* Features */}
          <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Análisis con IA avanzada</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Conexión bancaria segura</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Predicciones personalizadas</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate("/subscribe")}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            <Crown className="w-5 h-5 mr-2" />
            Desbloquear Premium - $69 MXN/mes
          </Button>

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
