-- Agregar campo para rastrear si el usuario completó el quiz de nivel
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level_quiz_completed BOOLEAN DEFAULT false;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_level_quiz 
ON public.profiles(level_quiz_completed);