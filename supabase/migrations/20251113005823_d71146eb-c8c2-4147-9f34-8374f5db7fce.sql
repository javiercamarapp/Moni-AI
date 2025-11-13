-- Create goal_reactions table (goal_comments already exists)
CREATE TABLE public.goal_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('👍', '🎉', '💪', '🔥', '❤️', '👏')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(goal_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.goal_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goal_reactions
CREATE POLICY "Users can view reactions on public goals"
  ON public.goal_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_reactions.goal_id
      AND goals.is_public = true
    )
  );

CREATE POLICY "Users can create reactions on public goals"
  ON public.goal_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.goals
      WHERE goals.id = goal_reactions.goal_id
      AND goals.is_public = true
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON public.goal_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_reactions;

-- Create indexes for better performance
CREATE INDEX idx_goal_reactions_goal_id ON public.goal_reactions(goal_id);
CREATE INDEX idx_goal_reactions_user_id ON public.goal_reactions(user_id);