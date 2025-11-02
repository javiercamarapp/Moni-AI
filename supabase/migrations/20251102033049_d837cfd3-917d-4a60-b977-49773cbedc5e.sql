-- Create circles table for community groups
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view circles"
ON public.circles
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own circles"
ON public.circles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own circles"
ON public.circles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own circles"
ON public.circles
FOR DELETE
USING (auth.uid() = user_id);

-- Create circle_members table
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

-- Enable RLS
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view circle members"
ON public.circle_members
FOR SELECT
USING (true);

CREATE POLICY "Users can join circles"
ON public.circle_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles"
ON public.circle_members
FOR DELETE
USING (auth.uid() = user_id);

-- Create friend_activity table
CREATE TABLE IF NOT EXISTS public.friend_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friend_activity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their friends' activity"
ON public.friend_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = friend_activity.user_id)
    OR (friendships.friend_id = auth.uid() AND friendships.user_id = friend_activity.user_id)
    AND friendships.status = 'accepted'
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can create their own activity"
ON public.friend_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);