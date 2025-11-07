-- Create table for caching AI insights
CREATE TABLE IF NOT EXISTS public.goal_insights_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  insights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Add index for faster lookups
CREATE INDEX idx_goal_insights_cache_goal_id ON public.goal_insights_cache(goal_id);
CREATE INDEX idx_goal_insights_cache_user_id ON public.goal_insights_cache(user_id);
CREATE INDEX idx_goal_insights_cache_expires_at ON public.goal_insights_cache(expires_at);

-- Enable RLS
ALTER TABLE public.goal_insights_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cached insights"
ON public.goal_insights_cache
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached insights"
ON public.goal_insights_cache
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cached insights"
ON public.goal_insights_cache
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to auto-delete expired cache entries
CREATE OR REPLACE FUNCTION public.delete_expired_insights_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.goal_insights_cache
  WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to clean up expired entries periodically
CREATE TRIGGER cleanup_expired_insights_cache
AFTER INSERT ON public.goal_insights_cache
EXECUTE FUNCTION public.delete_expired_insights_cache();