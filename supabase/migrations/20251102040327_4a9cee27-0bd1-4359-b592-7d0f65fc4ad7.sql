-- Asegurar que circle_goals existe y tiene las columnas correctas
-- (si ya existe, este bloque no hará nada gracias a IF NOT EXISTS)
ALTER TABLE public.circle_goals ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Meta del círculo';

-- Crear función RPC para actualizar progreso grupal y dar XP
CREATE OR REPLACE FUNCTION public.update_circle_goal(
  p_circle_id UUID,
  p_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Actualizar el monto actual de la meta
  UPDATE public.circle_goals
  SET current_amount = current_amount + p_amount
  WHERE circle_id = p_circle_id;
  
  -- Dar XP proporcional al aporte (1 XP por cada $10)
  UPDATE public.circle_members
  SET xp = xp + GREATEST(1, ROUND(p_amount / 10))
  WHERE circle_id = p_circle_id
  AND user_id = auth.uid();
END;
$$;

-- Habilitar realtime en las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_challenges;

-- Políticas RLS adicionales para circle_members (actualización de XP)
DROP POLICY IF EXISTS "Circle members can update their XP" ON public.circle_members;
CREATE POLICY "Circle members can update their XP" 
ON public.circle_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para circle_goals
DROP POLICY IF EXISTS "Circle members can update goals" ON public.circle_goals;
CREATE POLICY "Circle members can update goals" 
ON public.circle_goals 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM circle_members 
  WHERE circle_members.circle_id = circle_goals.circle_id 
  AND circle_members.user_id = auth.uid()
));