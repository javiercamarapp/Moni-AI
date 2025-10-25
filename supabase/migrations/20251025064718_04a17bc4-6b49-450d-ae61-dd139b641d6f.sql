-- ===============================================
-- LIMPIAR DUPLICADOS - Mantener solo categorías en español
-- ===============================================

-- Eliminar activos con categorías antiguas en inglés
DELETE FROM activos
WHERE categoria IN ('Checking', 'Investments', 'Property', 'Savings', 'Other', 'Custom');

-- Eliminar pasivos con categorías antiguas en inglés
DELETE FROM pasivos
WHERE categoria IN ('Credit', 'Loans', 'Mortgage', 'Other', 'Custom');

-- Verificar que solo queden las categorías en español
-- (La migración anterior ya insertó estos datos correctamente)