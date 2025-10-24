-- Limpiar categorías incorrectas que no deberían ser principales
-- Solo mantener las 10 categorías principales correctas:
-- Vivienda, Transporte, Alimentación, Servicios y suscripciones, Salud y bienestar,
-- Educación y desarrollo, Deudas y créditos, Entretenimiento y estilo de vida,
-- Ahorro e inversión, Apoyos y otros

-- Primero eliminar los presupuestos de categorías incorrectas
DELETE FROM public.category_budgets
WHERE category_id IN (
  SELECT id FROM public.categories
  WHERE parent_id IS NULL
  AND LOWER(name) NOT IN (
    'vivienda',
    'transporte',
    'alimentación',
    'servicios y suscripciones',
    'salud y bienestar',
    'educación y desarrollo',
    'deudas y créditos',
    'entretenimiento y estilo de vida',
    'ahorro e inversión',
    'apoyos y otros',
    'mascotas'
  )
);

-- Luego eliminar las subcategorías de categorías incorrectas
DELETE FROM public.categories
WHERE parent_id IN (
  SELECT id FROM public.categories
  WHERE parent_id IS NULL
  AND LOWER(name) NOT IN (
    'vivienda',
    'transporte',
    'alimentación',
    'servicios y suscripciones',
    'salud y bienestar',
    'educación y desarrollo',
    'deudas y créditos',
    'entretenimiento y estilo de vida',
    'ahorro e inversión',
    'apoyos y otros',
    'mascotas'
  )
);

-- Finalmente eliminar las categorías principales incorrectas
DELETE FROM public.categories
WHERE parent_id IS NULL
AND LOWER(name) NOT IN (
  'vivienda',
  'transporte',
  'alimentación',
  'servicios y suscripciones',
  'salud y bienestar',
  'educación y desarrollo',
  'deudas y créditos',
  'entretenimiento y estilo de vida',
  'ahorro e inversión',
  'apoyos y otros',
  'mascotas'
);