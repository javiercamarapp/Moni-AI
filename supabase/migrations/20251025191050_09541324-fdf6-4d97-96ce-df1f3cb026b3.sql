-- Función para crear categorías predeterminadas de ingresos para nuevos usuarios
CREATE OR REPLACE FUNCTION public.create_default_income_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar categorías predeterminadas de ingresos con emojis y colores
  INSERT INTO public.categories (user_id, name, type, color) VALUES
  -- Categorías principales predeterminadas
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
  (p_user_id, '🤝 Sociedades / Dividendos empresariales', 'ingreso', 'bg-rose-500/20')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Función para crear categorías predeterminadas de gastos para nuevos usuarios
CREATE OR REPLACE FUNCTION public.create_default_expense_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar categorías predeterminadas de gastos con emojis y colores
  INSERT INTO public.categories (user_id, name, type, color) VALUES
  -- Categorías principales de gastos
  (p_user_id, '🏠 Vivienda', 'gasto', 'bg-blue-500/20'),
  (p_user_id, '🚗 Transporte', 'gasto', 'bg-gray-500/20'),
  (p_user_id, '🍽️ Alimentación', 'gasto', 'bg-green-500/20'),
  (p_user_id, '🧾 Servicios y suscripciones', 'gasto', 'bg-purple-500/20'),
  (p_user_id, '🩺 Salud y bienestar', 'gasto', 'bg-red-500/20'),
  (p_user_id, '🎓 Educación y desarrollo', 'gasto', 'bg-indigo-500/20'),
  (p_user_id, '💳 Deudas y créditos', 'gasto', 'bg-orange-500/20'),
  (p_user_id, '🎉 Entretenimiento y estilo de vida', 'gasto', 'bg-pink-500/20'),
  (p_user_id, '💸 Ahorro e inversión', 'gasto', 'bg-emerald-500/20'),
  (p_user_id, '🤝 Apoyos y otros', 'gasto', 'bg-cyan-500/20'),
  (p_user_id, '🐾 Mascotas', 'gasto', 'bg-amber-500/20'),
  (p_user_id, '❓ Gastos no identificados', 'gasto', 'bg-slate-500/20')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Modificar el trigger handle_new_user para crear categorías predeterminadas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear perfil del usuario
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  
  -- Crear categorías predeterminadas de ingresos
  PERFORM public.create_default_income_categories(new.id);
  
  -- Crear categorías predeterminadas de gastos
  PERFORM public.create_default_expense_categories(new.id);
  
  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.create_default_income_categories IS 'Crea las categorías predeterminadas de ingresos para un nuevo usuario';
COMMENT ON FUNCTION public.create_default_expense_categories IS 'Crea las categorías predeterminadas de gastos para un nuevo usuario';