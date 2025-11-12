-- ============================================
-- SISTEMA DE GAMIFICACIÓN COMPLETO PARA MONI
-- ============================================

-- 1. Tabla de niveles de usuario
CREATE TABLE IF NOT EXISTS public.user_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level integer NOT NULL DEFAULT 1,
  total_xp integer NOT NULL DEFAULT 0,
  xp_to_next_level integer NOT NULL DEFAULT 1000,
  level_title text DEFAULT 'Ahorrador Novato',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Catálogo de insignias disponibles
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  requirement_type text NOT NULL, -- streak, savings, no_spending, goal_achieved
  requirement_value integer, -- valor necesario para desbloquear
  requirement_category text, -- categoría específica si aplica (ej. "café", "delivery")
  xp_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Ranking mensual con ligas
CREATE TABLE IF NOT EXISTS public.monthly_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  challenges_completed integer NOT NULL DEFAULT 0,
  league text NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, diamond
  rank_position integer,
  rank_global_position integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- 4. Historial de feedback de progreso
CREATE TABLE IF NOT EXISTS public.progress_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text NOT NULL, -- daily, weekly, monthly
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_saved numeric NOT NULL DEFAULT 0,
  challenges_completed integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  badges_unlocked integer NOT NULL DEFAULT 0,
  feedback_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Actualizar tabla de retos diarios para incluir período (diario/semanal/mensual)
ALTER TABLE public.daily_challenges 
  ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  ADD COLUMN IF NOT EXISTS estimated_savings numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_personalized boolean DEFAULT false;

-- 6. Actualizar user_daily_challenges para tracking de verificación
ALTER TABLE public.user_daily_challenges
  ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'medium', -- easy, medium, hard
  ADD COLUMN IF NOT EXISTS actual_savings numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_attempts integer DEFAULT 0;

-- RLS Policies para nuevas tablas

-- user_levels
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own level"
  ON public.user_levels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' levels"
  ON public.user_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own level"
  ON public.user_levels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert levels"
  ON public.user_levels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- badges (catálogo público)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges catalog"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

-- monthly_rankings
ALTER TABLE public.monthly_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all rankings"
  ON public.monthly_rankings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own ranking"
  ON public.monthly_rankings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ranking"
  ON public.monthly_rankings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- progress_feedback
ALTER TABLE public.progress_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.progress_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert feedback"
  ON public.progress_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_user_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_levels_updated_at();

CREATE TRIGGER monthly_rankings_updated_at
  BEFORE UPDATE ON public.monthly_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_levels_updated_at();

-- Función para inicializar nivel de usuario nuevo
CREATE OR REPLACE FUNCTION public.initialize_user_level()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_levels (user_id, current_level, total_xp, xp_to_next_level, level_title)
  VALUES (NEW.id, 1, 0, 1000, 'Ahorrador Novato')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear nivel cuando se crea usuario
CREATE TRIGGER on_auth_user_created_init_level
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_level();

-- Insertar insignias predefinidas
INSERT INTO public.badges (name, description, icon, rarity, requirement_type, requirement_value, requirement_category, xp_reward) VALUES
  ('Mes sin Starbucks', 'Pasaste un mes completo sin comprar café en Starbucks', '☕', 'common', 'no_spending', 30, '🍽️ Alimentación', 200),
  ('Anti-Delivery', 'Un mes entero cocinando en casa, sin pedir comida a domicilio', '🍳', 'common', 'no_spending', 30, '🍽️ Alimentación', 200),
  ('Ahorrador Constante', 'Cumpliste todos los retos semanales durante 4 semanas seguidas', '🔥', 'rare', 'streak', 4, NULL, 500),
  ('Meta Alcanzada', 'Completaste tu primera meta de ahorro personal', '🎯', 'rare', 'goal_achieved', 1, NULL, 300),
  ('Primer Millón', 'Acumulaste $1,000,000 MXN en ahorros totales', '💰', 'epic', 'savings', 1000000, NULL, 1000),
  ('Racha de Hierro', 'Mantuviste una racha de 7 días completando retos', '🛡️', 'common', 'streak', 7, NULL, 150),
  ('Racha de Oro', 'Mantuviste una racha de 30 días completando retos', '👑', 'legendary', 'streak', 30, NULL, 2000),
  ('Sin Gastos Hormiga', 'Evitaste todos los gastos menores de $100 durante una semana', '🐜', 'common', 'no_spending', 7, 'gastos_pequeños', 100),
  ('Maestro del Presupuesto', 'Respetaste tu presupuesto mensual completo', '📊', 'epic', 'goal_achieved', 1, NULL, 800),
  ('Inversionista Novato', 'Realizaste tu primera inversión o ahorro programado', '📈', 'rare', 'goal_achieved', 1, NULL, 400)
ON CONFLICT DO NOTHING;