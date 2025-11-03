-- Update goals table to support new AI-driven features
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Custom',
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS predicted_completion_date date,
ADD COLUMN IF NOT EXISTS required_daily_saving numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_weekly_saving numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_confidence numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_contribution_date date;

-- Add activity tracking for goals
CREATE TABLE IF NOT EXISTS public.goal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  amount numeric DEFAULT 0,
  message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on goal_activities
ALTER TABLE public.goal_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_activities
CREATE POLICY "Users can view their own goal activities"
  ON public.goal_activities FOR SELECT
  USING (auth.uid() = user_id OR goal_id IN (
    SELECT id FROM public.goals WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own goal activities"
  ON public.goal_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update circle_goals table for group features
ALTER TABLE public.circle_goals
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Custom',
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS predicted_completion_date date,
ADD COLUMN IF NOT EXISTS required_weekly_saving numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_confidence numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE;

-- Create goal invitations table
CREATE TABLE IF NOT EXISTS public.goal_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone
);

-- Enable RLS on goal_invitations
ALTER TABLE public.goal_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_invitations
CREATE POLICY "Users can view their own invitations"
  ON public.goal_invitations FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can create invitations"
  ON public.goal_invitations FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their received invitations"
  ON public.goal_invitations FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Create goal comments table for social interaction
CREATE TABLE IF NOT EXISTS public.goal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on goal_comments
ALTER TABLE public.goal_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_comments
CREATE POLICY "Users can view comments on their goals"
  ON public.goal_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.goal_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update goal predictions
CREATE OR REPLACE FUNCTION public.calculate_goal_prediction(
  p_goal_id uuid,
  p_target_amount numeric,
  p_current_savings numeric,
  p_deadline date
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_avg_daily_saving numeric;
  v_days_remaining integer;
  v_predicted_date date;
  v_required_daily numeric;
  v_required_weekly numeric;
  v_result jsonb;
BEGIN
  -- Get user_id from goal
  SELECT user_id INTO v_user_id FROM public.goals WHERE id = p_goal_id;
  
  -- Calculate average daily saving from recent transactions
  SELECT COALESCE(AVG(amount), 100) INTO v_avg_daily_saving
  FROM public.transactions
  WHERE user_id = v_user_id
    AND type = 'ingreso'
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Ensure minimum average
  v_avg_daily_saving := GREATEST(v_avg_daily_saving, 50);
  
  IF p_deadline IS NOT NULL THEN
    -- Calculate required savings if deadline exists
    v_days_remaining := p_deadline - CURRENT_DATE;
    IF v_days_remaining > 0 THEN
      v_required_daily := (p_target_amount - p_current_savings) / v_days_remaining;
      v_required_weekly := v_required_daily * 7;
    ELSE
      v_required_daily := 0;
      v_required_weekly := 0;
    END IF;
    v_predicted_date := p_deadline;
  ELSE
    -- Predict completion date based on average savings
    v_days_remaining := CEIL((p_target_amount - p_current_savings) / v_avg_daily_saving);
    v_predicted_date := CURRENT_DATE + v_days_remaining;
    v_required_daily := v_avg_daily_saving;
    v_required_weekly := v_avg_daily_saving * 7;
  END IF;
  
  -- Build result
  v_result := jsonb_build_object(
    'predicted_completion_date', v_predicted_date,
    'required_daily_saving', ROUND(v_required_daily, 2),
    'required_weekly_saving', ROUND(v_required_weekly, 2),
    'ai_confidence', 0.75,
    'days_remaining', v_days_remaining
  );
  
  RETURN v_result;
END;
$$;