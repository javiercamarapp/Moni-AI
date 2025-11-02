-- Add unique constraint to user_challenge_progress to prevent duplicate completions
ALTER TABLE public.user_challenge_progress 
ADD CONSTRAINT user_challenge_progress_user_challenge_unique 
UNIQUE (user_id, challenge_id);

-- Add unique constraint to monthly_rankings for upsert operations
ALTER TABLE public.monthly_rankings 
ADD CONSTRAINT monthly_rankings_user_month_year_unique 
UNIQUE (user_id, month, year);