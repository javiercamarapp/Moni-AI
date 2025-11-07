-- Fix search_path for the cleanup function
CREATE OR REPLACE FUNCTION public.delete_expired_insights_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.goal_insights_cache
  WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;