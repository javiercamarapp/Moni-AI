-- Add pinned and attachment fields to goal_comments
ALTER TABLE goal_comments
ADD COLUMN is_pinned boolean DEFAULT false,
ADD COLUMN attachment_url text,
ADD COLUMN attachment_type text;

-- Create index for pinned messages
CREATE INDEX idx_goal_comments_pinned ON goal_comments(goal_id, is_pinned) WHERE is_pinned = true;

-- Add RLS policy for pinning messages (only circle admins can pin)
CREATE POLICY "Circle admins can pin messages"
ON goal_comments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM circle_goals cg
    JOIN circles c ON c.id = cg.circle_id
    WHERE cg.id = goal_comments.goal_id
    AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM circle_goals cg
    JOIN circles c ON c.id = cg.circle_id
    WHERE cg.id = goal_comments.goal_id
    AND c.user_id = auth.uid()
  )
);

-- Create storage bucket for chat attachments if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);