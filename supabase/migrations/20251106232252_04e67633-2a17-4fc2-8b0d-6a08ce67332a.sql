-- Add soft delete and reply functionality to goal_comments
ALTER TABLE public.goal_comments
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN reply_to_id UUID REFERENCES public.goal_comments(id) ON DELETE SET NULL;

-- Create index for replies
CREATE INDEX idx_goal_comments_reply_to_id ON public.goal_comments(reply_to_id);

-- Create table for mentions
CREATE TABLE IF NOT EXISTS public.goal_comment_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.goal_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mentions table
ALTER TABLE public.goal_comment_mentions ENABLE ROW LEVEL SECURITY;

-- Create policies for mentions
CREATE POLICY "Anyone can view mentions"
ON public.goal_comment_mentions
FOR SELECT
USING (true);

CREATE POLICY "Users can create mentions"
ON public.goal_comment_mentions
FOR INSERT
WITH CHECK (true);

-- Create index for mentions
CREATE INDEX idx_goal_comment_mentions_comment_id ON public.goal_comment_mentions(comment_id);
CREATE INDEX idx_goal_comment_mentions_user_id ON public.goal_comment_mentions(mentioned_user_id);

-- Update RLS policy to allow users to delete their own comments (soft delete)
CREATE POLICY "Users can delete their own comments"
ON public.goal_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);