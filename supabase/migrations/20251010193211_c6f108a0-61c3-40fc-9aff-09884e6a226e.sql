-- Fix security issue: add search_path to function with CASCADE
DROP FUNCTION IF EXISTS update_category_budgets_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_category_budgets_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_category_budgets_updated_at
  BEFORE UPDATE ON public.category_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_category_budgets_updated_at();

CREATE TRIGGER update_fixed_expenses_config_updated_at
  BEFORE UPDATE ON public.fixed_expenses_config
  FOR EACH ROW
  EXECUTE FUNCTION update_category_budgets_updated_at();