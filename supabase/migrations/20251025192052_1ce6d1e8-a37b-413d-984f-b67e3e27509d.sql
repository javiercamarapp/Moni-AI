-- Eliminar transacciones duplicadas manteniendo solo la primera de cada grupo
-- Esto identifica duplicados basados en: user_id, description, amount, transaction_date, type

WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, description, amount, transaction_date, type 
      ORDER BY created_at ASC
    ) as rn
  FROM public.transactions
)
DELETE FROM public.transactions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Comentario sobre la limpieza
COMMENT ON TABLE public.transactions IS 'Transacciones del usuario - duplicados eliminados el 2025-10-25';