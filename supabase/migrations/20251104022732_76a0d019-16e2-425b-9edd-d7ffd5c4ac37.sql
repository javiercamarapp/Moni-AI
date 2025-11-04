-- Add table to track individual member progress for group goals
CREATE TABLE IF NOT EXISTS public.circle_goal_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.circle_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(goal_id, user_id)
);

-- Enable RLS
ALTER TABLE public.circle_goal_members ENABLE ROW LEVEL SECURITY;

-- Policies for circle_goal_members
CREATE POLICY "Circle members can view goal progress"
  ON public.circle_goal_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_goals cg
      JOIN circle_members cm ON cm.circle_id = cg.circle_id
      WHERE cg.id = circle_goal_members.goal_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Circle members can update their own progress"
  ON public.circle_goal_members
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert member progress"
  ON public.circle_goal_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_goals cg
      JOIN circle_members cm ON cm.circle_id = cg.circle_id
      WHERE cg.id = circle_goal_members.goal_id
      AND cm.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_circle_goal_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_circle_goal_members_updated_at
  BEFORE UPDATE ON public.circle_goal_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_circle_goal_members_updated_at();

-- Update circle_goals table to reflect individual goal model
ALTER TABLE public.circle_goals 
  DROP COLUMN IF EXISTS current_amount;

-- Add column to track how many members have completed
ALTER TABLE public.circle_goals 
  ADD COLUMN IF NOT EXISTS completed_members INTEGER NOT NULL DEFAULT 0;