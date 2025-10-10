-- Delete duplicate snapshots, keeping only the most recent one
DELETE FROM public.net_worth_snapshots a
USING public.net_worth_snapshots b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.snapshot_date = b.snapshot_date;

-- Add unique constraint to net_worth_snapshots
ALTER TABLE public.net_worth_snapshots
ADD CONSTRAINT net_worth_snapshots_user_date_unique 
UNIQUE (user_id, snapshot_date);

-- Add unique constraint to assets to prevent duplicates  
ALTER TABLE public.assets
ADD CONSTRAINT assets_user_name_unique
UNIQUE (user_id, name);

-- Function to update net worth based on transaction
CREATE OR REPLACE FUNCTION public.update_net_worth_on_transaction()
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
  
  -- For income transactions, add to assets (checking account)
  IF TG_OP = 'INSERT' AND NEW.type = 'income' THEN
    -- Find or create checking account asset
    INSERT INTO public.assets (user_id, name, category, value)
    VALUES (NEW.user_id, 'Cuenta de Cheques', 'Checking', NEW.amount)
    ON CONFLICT (user_id, name) 
    DO UPDATE SET value = assets.value + NEW.amount, updated_at = now();
    
    v_assets := v_assets + NEW.amount;
    
  -- For expense transactions, reduce from assets
  ELSIF TG_OP = 'INSERT' AND NEW.type = 'expense' THEN
    -- Reduce from checking account
    UPDATE public.assets
    SET value = GREATEST(value - NEW.amount, 0), updated_at = now()
    WHERE user_id = NEW.user_id AND name = 'Cuenta de Cheques';
    
    v_assets := GREATEST(v_assets - NEW.amount, 0);
  END IF;
  
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

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS trigger_update_net_worth_on_transaction ON public.transactions;
CREATE TRIGGER trigger_update_net_worth_on_transaction
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_net_worth_on_transaction();