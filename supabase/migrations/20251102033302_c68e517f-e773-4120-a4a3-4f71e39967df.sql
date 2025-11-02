-- Add xp column to circle_members table
ALTER TABLE public.circle_members ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Create circle_challenges table for challenges within circles
CREATE TABLE IF NOT EXISTS public.circle_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.circle_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view circle challenges"
ON public.circle_challenges
FOR SELECT
USING (true);

CREATE POLICY "Circle members can create challenges"
ON public.circle_challenges
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = circle_challenges.circle_id
    AND circle_members.user_id = auth.uid()
  )
);

-- Create circle_goals table for group goals within circles
CREATE TABLE IF NOT EXISTS public.circle_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.circle_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view circle goals"
ON public.circle_goals
FOR SELECT
USING (true);

CREATE POLICY "Circle members can create goals"
ON public.circle_goals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = circle_goals.circle_id
    AND circle_members.user_id = auth.uid()
  )
);