import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error checking subscription:", error);
        setIsPremium(false);
      } else {
        setIsPremium(data?.subscribed || false);
        setSubscriptionEnd(data?.subscription_end || null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Recheck every minute
    const interval = setInterval(checkSubscription, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return { isPremium, loading, subscriptionEnd, refresh: checkSubscription };
}
