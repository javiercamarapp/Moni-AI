import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    async function verifySubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("subscriptions")
          .select("status, expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching subscription:", error);
        }

        const isExpired = data?.expires_at && new Date(data.expires_at) <= new Date();
        const active = data?.status === "active";

        if (isExpired) {
          navigate("/expired");
        } else if (!active) {
          navigate("/subscribe");
        } else {
          setIsActive(true);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error verifying subscription:", error);
        setLoading(false);
      }
    }

    verifySubscription();
  }, [navigate]);

  if (loading) return null;
  if (!isActive) return null;

  return <>{children}</>;
}
