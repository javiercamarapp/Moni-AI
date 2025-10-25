
-- Actualizar función para crear 12 categorías de ingresos
CREATE OR REPLACE FUNCTION public.create_default_income_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insertar 12 categorías predeterminadas de ingresos con emojis y colores
  INSERT INTO public.categories (user_id, name, type, color) VALUES
  (p_user_id, '💼 Salario / Sueldo', 'ingreso', 'bg-blue-500/20'),
  (p_user_id, '💰 Bonos / Comisiones', 'ingreso', 'bg-green-500/20'),
  (p_user_id, '💸 Freelance / Servicios', 'ingreso', 'bg-purple-500/20'),
  (p_user_id, '📈 Inversiones', 'ingreso', 'bg-emerald-500/20'),
  (p_user_id, '🏠 Rentas', 'ingreso', 'bg-orange-500/20'),
  (p_user_id, '🎁 Regalos / Donaciones recibidas', 'ingreso', 'bg-pink-500/20'),
  (p_user_id, '💳 Reembolsos', 'ingreso', 'bg-cyan-500/20'),
  (p_user_id, '🚗 Venta de bienes', 'ingreso', 'bg-amber-500/20'),
  (p_user_id, '🧠 Educación o becas', 'ingreso', 'bg-indigo-500/20'),
  (p_user_id, '🌐 Ingresos digitales', 'ingreso', 'bg-teal-500/20'),
  (p_user_id, '🪙 Cripto / NFT', 'ingreso', 'bg-yellow-500/20'),
  (p_user_id, '⭐ Categoría personalizada', 'ingreso', 'bg-violet-500/20')
  ON CONFLICT DO NOTHING;
END;
$function$;
