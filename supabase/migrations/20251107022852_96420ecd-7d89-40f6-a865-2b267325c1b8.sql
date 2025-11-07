-- Create circle_news_favorites table
CREATE TABLE IF NOT EXISTS public.circle_news_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.circle_news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id)
);

-- Enable RLS
ALTER TABLE public.circle_news_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can add their own favorites"
  ON public.circle_news_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites"
  ON public.circle_news_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON public.circle_news_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_circle_news_favorites_user_id ON public.circle_news_favorites(user_id);
CREATE INDEX idx_circle_news_favorites_news_id ON public.circle_news_favorites(news_id);