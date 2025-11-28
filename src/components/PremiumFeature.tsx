import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { LoadingScreen } from "@/components/LoadingScreen";

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
    return <LoadingScreen />;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return null;
}
