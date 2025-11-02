-- Tabla de retos diarios disponibles
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'savings', 'no_spending', 'budget_limit', 'manual_entry'
  target_amount NUMERIC,
  category TEXT, -- categoría específica si aplica
  difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  xp_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de retos del usuario con verificación
CREATE TABLE IF NOT EXISTS public.user_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed', 'pending_verification'
  accepted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  ai_verification_result JSONB, -- Detalles de la verificación de la IA
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_user_date 
  ON public.user_daily_challenges(user_id, challenge_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_status 
  ON public.user_daily_challenges(status);

-- RLS Policies
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas para daily_challenges (todos pueden ver)
CREATE POLICY "Anyone can view daily challenges"
  ON public.daily_challenges
  FOR SELECT
  USING (true);

-- Políticas para user_daily_challenges
CREATE POLICY "Users can view their own challenges"
  ON public.user_daily_challenges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
  ON public.user_daily_challenges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
  ON public.user_daily_challenges
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_user_daily_challenges_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_daily_challenges_updated_at
  BEFORE UPDATE ON public.user_daily_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_daily_challenges_updated_at();

-- Insertar retos de ejemplo
INSERT INTO public.daily_challenges (title, description, challenge_type, target_amount, category, difficulty, xp_reward) VALUES
  ('Ahorra $100 hoy', 'No gastes más de $100 pesos en todo el día', 'budget_limit', 100, null, 'easy', 10),
  ('Día sin entretenimiento', 'No gastes nada en entretenimiento o salidas hoy', 'no_spending', null, 'entretenimiento', 'medium', 15),
  ('Sin comida fuera', 'No compres comida en restaurantes o delivery hoy', 'no_spending', null, 'alimentación', 'medium', 15),
  ('Registra todos tus gastos', 'Registra al menos 3 gastos manualmente en la app hoy', 'manual_entry', 3, null, 'easy', 10),
  ('Día de ahorro extremo', 'Gasta menos de $50 pesos en todo el día', 'budget_limit', 50, null, 'hard', 25),
  ('Sin transporte privado', 'No uses Uber, DiDi o taxis hoy', 'no_spending', null, 'transporte', 'medium', 15),
  ('Sin compras impulsivas', 'No gastes en compras no planeadas (retail, online shopping)', 'no_spending', null, 'compras', 'medium', 15)
ON CONFLICT DO NOTHING;