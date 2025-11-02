-- Tabla para reacciones sociales
CREATE TABLE IF NOT EXISTS public.friend_activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.friend_activity(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(activity_id, from_user_id, emoji)
);

-- RLS para reacciones
ALTER TABLE public.friend_activity_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver reacciones públicas"
ON public.friend_activity_reactions
FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden crear sus propias reacciones"
ON public.friend_activity_reactions
FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias reacciones"
ON public.friend_activity_reactions
FOR DELETE USING (auth.uid() = from_user_id);

-- Función para incrementar XP social
CREATE OR REPLACE FUNCTION public.increment_social_xp(
  target_user_id UUID,
  xp_amount INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Actualizar o insertar en monthly_rankings
  INSERT INTO public.monthly_rankings (user_id, month, year, total_points, challenges_completed)
  VALUES (target_user_id, current_month, current_year, xp_amount, 0)
  ON CONFLICT (user_id, month, year)
  DO UPDATE SET total_points = monthly_rankings.total_points + xp_amount;
END;
$$;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_friend_activity_reactions_activity ON public.friend_activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_friend_activity_reactions_from_user ON public.friend_activity_reactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_activity_reactions_to_user ON public.friend_activity_reactions(to_user_id);

-- Habilitar Realtime en friend_activity_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_activity_reactions;