-- Eliminar subcategorías duplicadas, manteniendo solo la primera de cada nombre por parent_id
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, parent_id, name ORDER BY created_at) as rn
  FROM public.categories
  WHERE parent_id IS NOT NULL
)
DELETE FROM public.category_budgets
WHERE category_id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Eliminar las subcategorías duplicadas
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, parent_id, name ORDER BY created_at) as rn
  FROM public.categories
  WHERE parent_id IS NOT NULL
)
DELETE FROM public.categories
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);