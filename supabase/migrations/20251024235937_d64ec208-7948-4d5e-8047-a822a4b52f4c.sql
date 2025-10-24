-- Eliminar "Mascotas" como categoría principal (no es parte de las 10 categorías principales)
DELETE FROM public.category_budgets
WHERE category_id IN (
  SELECT id FROM public.categories
  WHERE parent_id IS NULL
  AND LOWER(name) = 'mascotas'
);

DELETE FROM public.categories
WHERE parent_id IS NULL
AND LOWER(name) = 'mascotas';