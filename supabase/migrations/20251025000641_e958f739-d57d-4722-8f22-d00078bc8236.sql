-- Eliminar TODOS los presupuestos de categorías
DELETE FROM public.category_budgets;

-- Eliminar TODAS las subcategorías (categorías con parent_id)
DELETE FROM public.categories WHERE parent_id IS NOT NULL;

-- Eliminar TODAS las categorías principales
DELETE FROM public.categories WHERE parent_id IS NULL;