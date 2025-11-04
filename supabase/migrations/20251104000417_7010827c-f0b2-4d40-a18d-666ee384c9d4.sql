-- Create table for app invitations
CREATE TABLE IF NOT EXISTS public.app_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.app_invitations ENABLE ROW LEVEL SECURITY;

-- Users can create their own invitations
CREATE POLICY "Users can create their own app invitations"
ON public.app_invitations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = inviter_user_id);

-- Users can view their own invitations
CREATE POLICY "Users can view their own app invitations"
ON public.app_invitations
FOR SELECT
TO authenticated
USING (auth.uid() = inviter_user_id);

-- Anyone can validate invitations (needed for signup)
CREATE POLICY "Anyone can validate app invitations"
ON public.app_invitations
FOR SELECT
TO anon
USING (expires_at > now() AND (max_uses IS NULL OR current_uses < max_uses));

-- Create table to track who was invited by whom
CREATE TABLE IF NOT EXISTS public.app_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL,
  xp_awarded boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(invited_user_id)
);

-- Enable RLS
ALTER TABLE public.app_referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their referrals
CREATE POLICY "Users can view their own referrals"
ON public.app_referrals
FOR SELECT
TO authenticated
USING (auth.uid() = inviter_user_id OR auth.uid() = invited_user_id);

-- Service role can insert referrals
CREATE POLICY "Service role can insert referrals"
ON public.app_referrals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to process referral reward
CREATE OR REPLACE FUNCTION public.process_app_referral(p_invite_code text, p_invited_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_user_id uuid;
  v_invitation_id uuid;
BEGIN
  -- Get the inviter from the invite code
  SELECT inviter_user_id, id INTO v_inviter_user_id, v_invitation_id
  FROM public.app_invitations
  WHERE invite_code = p_invite_code
    AND expires_at > now()
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF v_inviter_user_id IS NULL THEN
    RETURN; -- Invalid or expired code
  END IF;
  
  -- Don't allow self-referral
  IF v_inviter_user_id = p_invited_user_id THEN
    RETURN;
  END IF;
  
  -- Check if this user was already referred
  IF EXISTS (SELECT 1 FROM public.app_referrals WHERE invited_user_id = p_invited_user_id) THEN
    RETURN;
  END IF;
  
  -- Create the referral record
  INSERT INTO public.app_referrals (inviter_user_id, invited_user_id, invite_code, xp_awarded)
  VALUES (v_inviter_user_id, p_invited_user_id, p_invite_code, true);
  
  -- Award 50 XP to the inviter
  UPDATE public.profiles
  SET 
    total_xp = COALESCE(total_xp, 0) + 50,
    xp = COALESCE(xp, 0) + 50
  WHERE id = v_inviter_user_id;
  
  -- Increment invitation uses
  UPDATE public.app_invitations
  SET current_uses = current_uses + 1
  WHERE id = v_invitation_id;
  
  -- Create friend activity for the inviter
  INSERT INTO public.friend_activity (user_id, activity_type, description, xp_earned)
  VALUES (
    v_inviter_user_id,
    'referral',
    'Invitó a un amigo a Moni AI',
    50
  );
END;
$$;