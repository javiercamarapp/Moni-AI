-- Create table for message reactions
CREATE TABLE IF NOT EXISTS public.goal_comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.goal_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view reactions"
ON public.goal_comment_reactions
FOR SELECT
USING (true);

CREATE POLICY "Users can add their own reactions"
ON public.goal_comment_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.goal_comment_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_goal_comment_reactions_comment_id ON public.goal_comment_reactions(comment_id);
CREATE INDEX idx_goal_comment_reactions_user_id ON public.goal_comment_reactions(user_id);

-- Enable realtime for the chat messages table
ALTER TABLE public.goal_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_comments;