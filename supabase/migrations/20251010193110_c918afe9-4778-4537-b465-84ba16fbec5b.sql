-- Crear tabla para configuración de gastos fijos
CREATE TABLE IF NOT EXISTS public.fixed_expenses_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fixed_expenses_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own fixed expenses config"
  ON public.fixed_expenses_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fixed expenses config"
  ON public.fixed_expenses_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed expenses config"
  ON public.fixed_expenses_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fixed expenses config"
  ON public.fixed_expenses_config FOR DELETE
  USING (auth.uid() = user_id);

-- Crear tabla para presupuestos por categoría
CREATE TABLE IF NOT EXISTS public.category_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  monthly_budget NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own category budgets"
  ON public.category_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category budgets"
  ON public.category_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category budgets"
  ON public.category_budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category budgets"
  ON public.category_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_category_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_budgets_updated_at
  BEFORE UPDATE ON public.category_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_category_budgets_updated_at();

CREATE TRIGGER update_fixed_expenses_config_updated_at
  BEFORE UPDATE ON public.fixed_expenses_config
  FOR EACH ROW
  EXECUTE FUNCTION update_category_budgets_updated_at();