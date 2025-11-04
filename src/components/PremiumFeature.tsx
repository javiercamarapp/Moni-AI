import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import moniLogo from "@/assets/moni-ai-logo.png";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <img src={moniLogo} alt="Moni AI" className="w-64 h-64 object-contain" />
        </div>
      </div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return null;
}
