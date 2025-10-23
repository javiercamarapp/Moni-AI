-- Add components column to user_scores table to store score breakdown
ALTER TABLE public.user_scores 
ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '{
  "savingsAndLiquidity": 0,
  "debt": 0,
  "control": 0,
  "growth": 0,
  "behavior": 0
}'::jsonb;