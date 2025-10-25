-- Add challenge_type field to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'spending_limit';

-- Add comment to explain the types
COMMENT ON COLUMN public.challenges.challenge_type IS 'Types: spending_limit (barra de progreso), days_without (completar X días), daily_budget (presupuesto diario)';

-- Add daily_goal for days_without type challenges
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.challenges.daily_goal IS 'For days_without type: number of days to complete (e.g., 5 out of 7 days without spending)';