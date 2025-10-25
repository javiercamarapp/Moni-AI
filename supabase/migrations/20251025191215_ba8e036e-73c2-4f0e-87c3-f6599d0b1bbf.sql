-- Función para aplicar categorías predeterminadas a usuarios existentes
CREATE OR REPLACE FUNCTION public.apply_default_categories_to_existing_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  existing_count INTEGER;
BEGIN
  -- Iterar sobre todos los usuarios activos
  FOR user_record IN 
    SELECT DISTINCT id FROM auth.users
  LOOP
    -- Verificar si el usuario ya tiene categorías
    SELECT COUNT(*) INTO existing_count
    FROM public.categories
    WHERE user_id = user_record.id;
    
    -- Si no tiene categorías o tiene pocas, crear las predeterminadas
    IF existing_count < 5 THEN
      -- Crear categorías de ingresos
      PERFORM public.create_default_income_categories(user_record.id);
      
      -- Crear categorías de gastos
      PERFORM public.create_default_expense_categories(user_record.id);
      
      RAISE NOTICE 'Categorías agregadas para usuario: %', user_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Ejecutar la función para aplicar categorías a usuarios existentes
SELECT public.apply_default_categories_to_existing_users();

COMMENT ON FUNCTION public.apply_default_categories_to_existing_users IS 'Aplica las categorías predeterminadas a todos los usuarios existentes que no las tengan';