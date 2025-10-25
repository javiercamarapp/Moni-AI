-- ===============================================
-- MIGRACIÓN: Transferir datos de assets/liabilities a activos/pasivos
-- ===============================================

-- MIGRAR ACTIVOS EXISTENTES
INSERT INTO activos (
  user_id, categoria, subcategoria, nombre, descripcion, valor, moneda, liquidez_porcentaje, tasa_rendimiento, es_activo_fijo
)
SELECT
  user_id,
  'Activos líquidos',
  'General',
  name,
  NULL,
  value,
  'MXN',
  100,
  0,
  FALSE
FROM assets
ON CONFLICT DO NOTHING;

-- MIGRAR PASIVOS EXISTENTES
INSERT INTO pasivos (
  user_id, categoria, subcategoria, nombre, descripcion, valor, moneda, tasa_interes, es_corto_plazo
)
SELECT
  user_id,
  'Pasivos corrientes (corto plazo)',
  'General',
  name,
  NULL,
  value,
  'MXN',
  0,
  TRUE
FROM liabilities
ON CONFLICT DO NOTHING;

-- ===============================================
-- ACTUALIZAR TRIGGER DE NET WORTH PARA USAR NUEVAS TABLAS
-- ===============================================

-- Primero eliminar triggers existentes
DROP TRIGGER IF EXISTS update_assets_net_worth ON public.assets;
DROP TRIGGER IF EXISTS update_liabilities_net_worth ON public.liabilities;

-- Reemplazar la función para usar las nuevas tablas
CREATE OR REPLACE FUNCTION public.update_net_worth_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_assets numeric;
  v_liabilities numeric;
  v_net_worth numeric;
  v_today date;
BEGIN
  -- Get today's date
  v_today := CURRENT_DATE;
  
  -- Calculate total assets for user (USAR TABLA activos)
  SELECT COALESCE(SUM(valor), 0) INTO v_assets
  FROM public.activos
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Calculate total liabilities for user (USAR TABLA pasivos)
  SELECT COALESCE(SUM(valor), 0) INTO v_liabilities
  FROM public.pasivos
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Calculate net worth
  v_net_worth := v_assets - v_liabilities;
  
  -- Update or insert today's snapshot
  INSERT INTO public.net_worth_snapshots (user_id, snapshot_date, net_worth, total_assets, total_liabilities)
  VALUES (COALESCE(NEW.user_id, OLD.user_id), v_today, v_net_worth, v_assets, v_liabilities)
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET 
    net_worth = v_net_worth,
    total_assets = v_assets,
    total_liabilities = v_liabilities;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Crear triggers en las NUEVAS TABLAS
CREATE TRIGGER update_activos_net_worth
  AFTER INSERT OR UPDATE OR DELETE ON public.activos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_net_worth_snapshot();

CREATE TRIGGER update_pasivos_net_worth
  AFTER INSERT OR UPDATE OR DELETE ON public.pasivos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_net_worth_snapshot();

-- ===============================================
-- NOTA: Las tablas assets y liabilities se mantienen para compatibilidad
-- Se pueden eliminar manualmente si ya no se necesitan
-- ===============================================