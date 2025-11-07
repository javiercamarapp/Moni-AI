-- Create competition_groups table for custom competition groups
CREATE TABLE IF NOT EXISTS public.competition_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create competition_group_members table
CREATE TABLE IF NOT EXISTS public.competition_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.competition_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.competition_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_group_members ENABLE ROW LEVEL SECURITY;

-- Policies for competition_groups
CREATE POLICY "Users can view public groups or their own groups"
  ON public.competition_groups
  FOR SELECT
  USING (
    is_private = false 
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.competition_group_members 
      WHERE group_id = competition_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own groups"
  ON public.competition_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own groups"
  ON public.competition_groups
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own groups"
  ON public.competition_groups
  FOR DELETE
  USING (auth.uid() = created_by);

-- Policies for competition_group_members
CREATE POLICY "Users can view group members"
  ON public.competition_group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_groups 
      WHERE id = competition_group_members.group_id 
      AND (
        is_private = false 
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.competition_group_members cgm
          WHERE cgm.group_id = competition_groups.id AND cgm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Group creators can add members"
  ON public.competition_group_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competition_groups 
      WHERE id = competition_group_members.group_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups"
  ON public.competition_group_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.competition_groups 
      WHERE id = competition_group_members.group_id 
      AND is_private = false
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.competition_group_members
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Group creators can remove members"
  ON public.competition_group_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_groups 
      WHERE id = competition_group_members.group_id 
      AND created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_competition_groups_created_by ON public.competition_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_competition_group_members_group_id ON public.competition_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_competition_group_members_user_id ON public.competition_group_members(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_competition_groups_updated_at
  BEFORE UPDATE ON public.competition_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();