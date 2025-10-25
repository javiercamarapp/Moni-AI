-- ===============================================
-- CREAR VISTA DE RESUMEN PATRIMONIAL
-- ===============================================

CREATE OR REPLACE VIEW resumen_patrimonio AS
SELECT
  u.id AS user_id,
  COALESCE(SUM(a.valor), 0) AS total_activos,
  COALESCE(SUM(p.valor), 0) AS total_pasivos,
  (COALESCE(SUM(a.valor), 0) - COALESCE(SUM(p.valor), 0)) AS patrimonio_neto
FROM auth.users u
LEFT JOIN activos a ON a.user_id = u.id
LEFT JOIN pasivos p ON p.user_id = u.id
GROUP BY u.id;