import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import moniLogo from "@/assets/moni-ai-logo.png";
import { Progress } from "@/components/ui/progress";

interface PremiumFeatureProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
}

export default function PremiumFeature({ children }: PremiumFeatureProps) {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isPremium) {
      navigate("/subscribe");
    }
  }, [isPremium, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center">
          <img src={moniLogo} alt="Moni AI" className="w-24 h-24 object-contain" />
        </div>
        <div className="w-64 space-y-2">
          <Progress value={66} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">Verificando suscripción...</p>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return null;
}
