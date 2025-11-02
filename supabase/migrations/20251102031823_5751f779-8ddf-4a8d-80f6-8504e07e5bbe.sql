-- Create monthly_challenges table for financial challenges
CREATE TABLE public.monthly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can view challenges
CREATE POLICY "Anyone can view monthly challenges" 
ON public.monthly_challenges 
FOR SELECT 
USING (true);

-- Create user_challenge_progress table
CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.monthly_challenges(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own challenge progress" 
ON public.user_challenge_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own challenge progress" 
ON public.user_challenge_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own challenge progress" 
ON public.user_challenge_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create monthly_rankings table to track user points
CREATE TABLE public.monthly_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.monthly_rankings ENABLE ROW LEVEL SECURITY;

-- Everyone can view rankings (for leaderboards)
CREATE POLICY "Anyone can view monthly rankings" 
ON public.monthly_rankings 
FOR SELECT 
USING (true);

-- Users can insert their own rankings
CREATE POLICY "Users can insert their own rankings" 
ON public.monthly_rankings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rankings
CREATE POLICY "Users can update their own rankings" 
ON public.monthly_rankings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_monthly_challenges_updated_at
BEFORE UPDATE ON public.monthly_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_challenge_progress_updated_at
BEFORE UPDATE ON public.user_challenge_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_rankings_updated_at
BEFORE UPDATE ON public.monthly_rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();