-- Add XP and Score columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='total_xp') THEN
    ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='score_moni') THEN
    ALTER TABLE profiles ADD COLUMN score_moni INTEGER DEFAULT 50;
  END IF;
END $$;

-- Create function to add XP and update Score Moni
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id uuid, xp_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    total_xp = COALESCE(total_xp, 0) + xp_to_add,
    score_moni = LEAST(100, COALESCE(score_moni, 50) + (xp_to_add / 2))
  WHERE id = p_user_id;
END;
$$;

-- Create user_badges table for achievement tracking
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_name text NOT NULL,
  badge_description text,
  earned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' badges"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "System can insert badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);