-- Add budget_quiz_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN budget_quiz_completed boolean DEFAULT false;

-- Update existing users to false if null
UPDATE public.profiles 
SET budget_quiz_completed = false 
WHERE budget_quiz_completed IS NULL;