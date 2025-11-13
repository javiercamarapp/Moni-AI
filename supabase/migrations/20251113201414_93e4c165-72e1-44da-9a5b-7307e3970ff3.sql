-- Corregir funciones de base de datos sin search_path configurado
-- Esto previene ataques de escalada de privilegios

-- 1. Corregir update_user_levels_updated_at
CREATE OR REPLACE FUNCTION public.update_user_levels_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Corregir calculate_goal_prediction
CREATE OR REPLACE FUNCTION public.calculate_goal_prediction(p_goal_id uuid, p_target_amount numeric, p_current_savings numeric, p_deadline date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 3. Corregir initialize_user_level
CREATE OR REPLACE FUNCTION public.initialize_user_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_levels (user_id, current_level, total_xp, xp_to_next_level, level_title)
  VALUES (NEW.id, 1, 0, 1000, 'Ahorrador Novato')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- 4. Corregir update_subscriptions_updated_at
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. Corregir update_friend_challenges_updated_at
CREATE OR REPLACE FUNCTION public.update_friend_challenges_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;