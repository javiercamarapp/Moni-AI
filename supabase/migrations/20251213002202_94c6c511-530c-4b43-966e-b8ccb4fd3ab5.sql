-- Update existing expense categories to simpler names
UPDATE public.categories 
SET name = CASE 
  WHEN name LIKE '%Vivienda%' THEN 'Vivienda'
  WHEN name LIKE '%Transporte%' THEN 'Transporte'
  WHEN name LIKE '%Alimentación%' THEN 'Comida'
  WHEN name LIKE '%Servicios%' THEN 'Servicios'
  WHEN name LIKE '%Salud%' THEN 'Salud'
  WHEN name LIKE '%Educación%' THEN 'Educación'
  WHEN name LIKE '%Deudas%' THEN 'Deudas'
  WHEN name LIKE '%Entretenimiento%' THEN 'Entretenimiento'
  WHEN name LIKE '%Ahorro%' OR name LIKE '%inversión%' THEN 'Ahorro'
  WHEN name LIKE '%Apoyos%' THEN 'Otros'
  WHEN name LIKE '%Mascotas%' THEN 'Mascotas'
  WHEN name LIKE '%no identificados%' THEN 'Sin categoría'
  ELSE name
END
WHERE type = 'gasto';

-- Update existing income categories to simpler names
UPDATE public.categories 
SET name = CASE 
  WHEN name LIKE '%Salario%' OR name LIKE '%Sueldo%' THEN 'Salario'
  WHEN name LIKE '%Bonos%' OR name LIKE '%Comisiones%' THEN 'Bonos'
  WHEN name LIKE '%Freelance%' OR name LIKE '%Servicios%' THEN 'Freelance'
  WHEN name LIKE '%Inversiones%' THEN 'Inversiones'
  WHEN name LIKE '%Rentas%' THEN 'Rentas'
  WHEN name LIKE '%Regalos%' OR name LIKE '%Donaciones%' THEN 'Regalos'
  WHEN name LIKE '%Reembolsos%' THEN 'Reembolsos'
  WHEN name LIKE '%Venta%' THEN 'Ventas'
  WHEN name LIKE '%Educación%' OR name LIKE '%becas%' THEN 'Becas'
  WHEN name LIKE '%digitales%' THEN 'Digital'
  WHEN name LIKE '%Cripto%' OR name LIKE '%NFT%' THEN 'Cripto'
  WHEN name LIKE '%personalizada%' THEN 'Otros'
  ELSE name
END
WHERE type = 'ingreso';

-- Update the create_default_expense_categories function with simpler names
CREATE OR REPLACE FUNCTION public.create_default_expense_categories(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.categories (user_id, name, type, color) VALUES
  (p_user_id, 'Vivienda', 'gasto', 'bg-blue-500/20'),
  (p_user_id, 'Transporte', 'gasto', 'bg-gray-500/20'),
  (p_user_id, 'Comida', 'gasto', 'bg-green-500/20'),
  (p_user_id, 'Servicios', 'gasto', 'bg-purple-500/20'),
  (p_user_id, 'Salud', 'gasto', 'bg-red-500/20'),
  (p_user_id, 'Educación', 'gasto', 'bg-indigo-500/20'),
  (p_user_id, 'Deudas', 'gasto', 'bg-orange-500/20'),
  (p_user_id, 'Entretenimiento', 'gasto', 'bg-pink-500/20'),
  (p_user_id, 'Ahorro', 'gasto', 'bg-emerald-500/20'),
  (p_user_id, 'Otros', 'gasto', 'bg-cyan-500/20'),
  (p_user_id, 'Mascotas', 'gasto', 'bg-amber-500/20'),
  (p_user_id, 'Sin categoría', 'gasto', 'bg-slate-500/20')
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Update the create_default_income_categories function with simpler names
CREATE OR REPLACE FUNCTION public.create_default_income_categories(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.categories (user_id, name, type, color) VALUES
  (p_user_id, 'Salario', 'ingreso', 'bg-blue-500/20'),
  (p_user_id, 'Bonos', 'ingreso', 'bg-green-500/20'),
  (p_user_id, 'Freelance', 'ingreso', 'bg-purple-500/20'),
  (p_user_id, 'Inversiones', 'ingreso', 'bg-emerald-500/20'),
  (p_user_id, 'Rentas', 'ingreso', 'bg-orange-500/20'),
  (p_user_id, 'Regalos', 'ingreso', 'bg-pink-500/20'),
  (p_user_id, 'Reembolsos', 'ingreso', 'bg-cyan-500/20'),
  (p_user_id, 'Ventas', 'ingreso', 'bg-amber-500/20'),
  (p_user_id, 'Becas', 'ingreso', 'bg-indigo-500/20'),
  (p_user_id, 'Digital', 'ingreso', 'bg-teal-500/20'),
  (p_user_id, 'Cripto', 'ingreso', 'bg-yellow-500/20'),
  (p_user_id, 'Otros', 'ingreso', 'bg-violet-500/20')
  ON CONFLICT DO NOTHING;
END;
$function$;