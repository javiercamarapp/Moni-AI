-- Create table for circle news shared by members
CREATE TABLE IF NOT EXISTS public.circle_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for faster lookups
CREATE INDEX idx_circle_news_circle_id ON public.circle_news(circle_id);
CREATE INDEX idx_circle_news_user_id ON public.circle_news(user_id);
CREATE INDEX idx_circle_news_created_at ON public.circle_news(created_at DESC);

-- Enable RLS
ALTER TABLE public.circle_news ENABLE ROW LEVEL SECURITY;

-- Circle members can view circle news
CREATE POLICY "Circle members can view news"
ON public.circle_news
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_members.circle_id = circle_news.circle_id
    AND circle_members.user_id = auth.uid()
  )
);

-- Circle members can add news
CREATE POLICY "Circle members can add news"
ON public.circle_news
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_members.circle_id = circle_news.circle_id
    AND circle_members.user_id = auth.uid()
  )
);

-- Users can delete their own news
CREATE POLICY "Users can delete their own news"
ON public.circle_news
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own news
CREATE POLICY "Users can update their own news"
ON public.circle_news
FOR UPDATE
USING (auth.uid() = user_id);