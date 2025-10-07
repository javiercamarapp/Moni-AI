-- Create user_scores table to cache financial scores
CREATE TABLE IF NOT EXISTS public.user_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score_moni INTEGER NOT NULL DEFAULT 40,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own score
CREATE POLICY "Users can view their own score"
ON public.user_scores
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own score
CREATE POLICY "Users can insert their own score"
ON public.user_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own score
CREATE POLICY "Users can update their own score"
ON public.user_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON public.user_scores(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_scores_updated_at
  BEFORE UPDATE ON public.user_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();