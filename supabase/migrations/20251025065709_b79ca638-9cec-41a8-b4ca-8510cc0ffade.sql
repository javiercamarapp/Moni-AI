-- ===============================================
-- CORREGIR CLASIFICACIÓN DE PASIVOS
-- ===============================================

-- Hipoteca: Mortgage → Pasivos NO corrientes (largo plazo)
UPDATE pasivos 
SET categoria = 'Pasivos no corrientes (largo plazo)',
    subcategoria = 'Hipoteca',
    es_corto_plazo = FALSE
WHERE nombre = 'Hipoteca';

-- Crédito automóvil: Loans → Pasivos NO corrientes (largo plazo)
UPDATE pasivos 
SET categoria = 'Pasivos no corrientes (largo plazo)',
    subcategoria = 'Crédito automotriz largo',
    es_corto_plazo = FALSE
WHERE nombre = 'Crédito automovíl';

-- Préstamo Maestría: Loans → Pasivos NO corrientes (largo plazo)
UPDATE pasivos 
SET categoria = 'Pasivos no corrientes (largo plazo)',
    subcategoria = 'Crédito educativo',
    es_corto_plazo = FALSE
WHERE nombre = 'Préstamo Maestría';

-- Préstamo personal: Loans → Pasivos corrientes (corto plazo)
UPDATE pasivos 
SET categoria = 'Pasivos corrientes (corto plazo)',
    subcategoria = 'Préstamo personal',
    es_corto_plazo = TRUE
WHERE nombre = 'Préstamo personal';

-- BBVA azul: Credit → Pasivos corrientes (corto plazo)
UPDATE pasivos 
SET categoria = 'Pasivos corrientes (corto plazo)',
    subcategoria = 'Tarjeta de crédito',
    es_corto_plazo = TRUE
WHERE nombre = 'BBVA azul';