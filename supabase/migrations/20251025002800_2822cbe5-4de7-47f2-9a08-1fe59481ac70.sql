-- Eliminar presupuestos de subcategorías (solo mantener los de categorías principales)
DELETE FROM category_budgets
WHERE category_id IN (
  SELECT id FROM categories WHERE parent_id IS NOT NULL
);