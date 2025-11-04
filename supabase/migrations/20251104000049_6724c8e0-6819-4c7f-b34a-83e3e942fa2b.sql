-- Create circle invitations table
CREATE TABLE IF NOT EXISTS public.circle_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.circle_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view invitations for their circles
CREATE POLICY "Members can view circle invitations"
  ON public.circle_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_members
      WHERE circle_members.circle_id = circle_invitations.circle_id
      AND circle_members.user_id = auth.uid()
    )
  );

-- Policy: Members can create invitations for their circles
CREATE POLICY "Members can create circle invitations"
  ON public.circle_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circle_members
      WHERE circle_members.circle_id = circle_invitations.circle_id
      AND circle_members.user_id = auth.uid()
    )
  );

-- Policy: Anyone can check invitation validity (for joining)
CREATE POLICY "Anyone can validate invitations"
  ON public.circle_invitations
  FOR SELECT
  USING (
    expires_at > NOW() 
    AND (max_uses IS NULL OR current_uses < max_uses)
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_circle_invitations_code ON public.circle_invitations(code);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_circle_id ON public.circle_invitations(circle_id);