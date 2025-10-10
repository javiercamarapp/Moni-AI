-- Remove the problematic trigger first
DROP TRIGGER IF EXISTS trigger_update_net_worth_on_transaction ON public.transactions;
DROP FUNCTION IF EXISTS public.update_net_worth_on_transaction();

-- Create a better function that just calculates net worth without modifying assets
CREATE OR REPLACE FUNCTION public.update_net_worth_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assets numeric;
  v_liabilities numeric;
  v_net_worth numeric;
  v_today date;
BEGIN
  -- Get today's date
  v_today := CURRENT_DATE;
  
  -- Calculate total assets for user
  SELECT COALESCE(SUM(value), 0) INTO v_assets
  FROM public.assets
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Calculate total liabilities for user
  SELECT COALESCE(SUM(value), 0) INTO v_liabilities
  FROM public.liabilities
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Calculate net worth
  v_net_worth := v_assets - v_liabilities;
  
  -- Update or insert today's snapshot
  INSERT INTO public.net_worth_snapshots (user_id, snapshot_date, net_worth, total_assets, total_liabilities)
  VALUES (COALESCE(NEW.user_id, OLD.user_id), v_today, v_net_worth, v_assets, v_liabilities)
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET 
    net_worth = v_net_worth,
    total_assets = v_assets,
    total_liabilities = v_liabilities;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on transactions table (simplified - just updates snapshot)
CREATE TRIGGER trigger_update_net_worth_snapshot
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_net_worth_snapshot();

-- Now create correct snapshots for all users based on their current assets/liabilities
INSERT INTO public.net_worth_snapshots (user_id, snapshot_date, net_worth, total_assets, total_liabilities)
SELECT 
  COALESCE(a.user_id, l.user_id) as user_id,
  CURRENT_DATE as snapshot_date,
  COALESCE(a.total_assets, 0) - COALESCE(l.total_liabilities, 0) as net_worth,
  COALESCE(a.total_assets, 0) as total_assets,
  COALESCE(l.total_liabilities, 0) as total_liabilities
FROM 
  (SELECT user_id, SUM(value) as total_assets FROM public.assets GROUP BY user_id) a
  FULL OUTER JOIN
  (SELECT user_id, SUM(value) as total_liabilities FROM public.liabilities GROUP BY user_id) l
  ON a.user_id = l.user_id
ON CONFLICT (user_id, snapshot_date)
DO UPDATE SET 
  net_worth = EXCLUDED.net_worth,
  total_assets = EXCLUDED.total_assets,
  total_liabilities = EXCLUDED.total_liabilities;