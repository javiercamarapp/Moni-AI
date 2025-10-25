-- ===============================================
-- CORREGIR VISTA DE RESUMEN PATRIMONIAL (SEGURA)
-- ===============================================

-- Eliminar la vista insegura
DROP VIEW IF EXISTS resumen_patrimonio;

-- Crear vista segura sin exponer auth.users
-- Esta vista agrega los datos por user_id sin exponer información sensible
CREATE OR REPLACE VIEW resumen_patrimonio 
WITH (security_invoker = true)
AS
SELECT
  user_id,
  COALESCE(SUM(activos_total), 0) AS total_activos,
  COALESCE(SUM(pasivos_total), 0) AS total_pasivos,
  (COALESCE(SUM(activos_total), 0) - COALESCE(SUM(pasivos_total), 0)) AS patrimonio_neto
FROM (
  SELECT 
    user_id,
    SUM(valor) as activos_total,
    0 as pasivos_total
  FROM activos
  GROUP BY user_id
  
  UNION ALL
  
  SELECT 
    user_id,
    0 as activos_total,
    SUM(valor) as pasivos_total
  FROM pasivos
  GROUP BY user_id
) combined
GROUP BY user_id;

-- Habilitar RLS en la vista
ALTER VIEW resumen_patrimonio SET (security_invoker = true);

-- Crear política RLS para que los usuarios solo vean su propio resumen
-- Nota: Las vistas heredan las políticas de las tablas subyacentes cuando security_invoker=true