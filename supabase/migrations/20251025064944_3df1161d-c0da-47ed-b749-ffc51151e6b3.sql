-- ===============================================
-- CORREGIR CLASIFICACIÓN DE ACTIVOS MIGRADOS
-- ===============================================

-- Casa Polanco: Property → Activos fijos (Vivienda principal)
UPDATE activos 
SET categoria = 'Activos fijos',
    subcategoria = 'Vivienda principal',
    es_activo_fijo = TRUE
WHERE nombre = 'Casa Polanco';

-- Toyata: Other (vehículo) → Activos fijos (Auto)
UPDATE activos 
SET categoria = 'Activos fijos',
    subcategoria = 'Auto',
    es_activo_fijo = TRUE
WHERE nombre = 'Toyata';

-- Bitcoin: Investments → Activos financieros (Criptomonedas)
UPDATE activos 
SET categoria = 'Activos financieros',
    subcategoria = 'Criptomonedas'
WHERE nombre = 'Bitcoin';

-- Fondo GBM: Investments → Activos financieros (ETFs)
UPDATE activos 
SET categoria = 'Activos financieros',
    subcategoria = 'ETFs'
WHERE nombre = 'Fondo GBM';

-- Plan Pensión: Savings → Activos financieros (AFORE)
UPDATE activos 
SET categoria = 'Activos financieros',
    subcategoria = 'AFORE'
WHERE nombre = 'Plan Pensión';

-- Tesla: Investments (probablemente acciones) → Activos financieros (Acciones)
UPDATE activos 
SET categoria = 'Activos financieros',
    subcategoria = 'Acciones'
WHERE nombre = 'Tesla';

-- Préstamo Juan: Other → Activos por cobrar (Préstamos a terceros)
UPDATE activos 
SET categoria = 'Activos por cobrar',
    subcategoria = 'Préstamos a terceros'
WHERE nombre = 'Préstamo Juan';

-- Bancomer Ahorros: Checking → Activos líquidos (Cuenta de ahorro)
UPDATE activos 
SET categoria = 'Activos líquidos',
    subcategoria = 'Cuenta de ahorro',
    es_activo_fijo = FALSE
WHERE nombre = 'Bancomer Ahorros';