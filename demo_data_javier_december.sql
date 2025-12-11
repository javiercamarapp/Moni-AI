-- Demo Transaction Data for Javier Camara - December 2024
-- First, get the user ID (you'll need to replace USER_ID_HERE with actual ID)

-- To find user ID, run this first:
-- SELECT id, email, full_name FROM profiles WHERE full_name ILIKE '%javier%camara%' OR email ILIKE '%javier%';

-- Then replace 'USER_ID_HERE' below with the actual UUID

-- INCOME TRANSACTIONS (Ingresos)
INSERT INTO transactions (user_id, type, amount, description, transaction_date, category_id, created_at)
VALUES
-- Salary
('USER_ID_HERE', 'ingreso', 45000.00, 'Nómina Diciembre', '2024-12-01', (SELECT id FROM categories WHERE name = 'Salario' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Freelance work
('USER_ID_HERE', 'ingreso', 8500.00, 'Proyecto Freelance - Diseño Web', '2024-12-05', (SELECT id FROM categories WHERE name = 'Freelance' OR name = 'Otros ingresos' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Bonus
('USER_ID_HERE', 'ingreso', 12000.00, 'Bono de fin de año', '2024-12-15', (SELECT id FROM categories WHERE name = 'Bonos' OR name = 'Otros ingresos' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW());

-- EXPENSE TRANSACTIONS (Gastos)
INSERT INTO transactions (user_id, type, amount, description, transaction_date, category_id, created_at)
VALUES
-- Housing
('USER_ID_HERE', 'gasto', 12000.00, 'Renta Diciembre', '2024-12-01', (SELECT id FROM categories WHERE name ILIKE '%renta%' OR name ILIKE '%vivienda%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Utilities
('USER_ID_HERE', 'gasto', 850.00, 'CFE - Luz', '2024-12-03', (SELECT id FROM categories WHERE name ILIKE '%servicios%' OR name ILIKE '%luz%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 450.00, 'Agua', '2024-12-03', (SELECT id FROM categories WHERE name ILIKE '%servicios%' OR name ILIKE '%agua%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 599.00, 'Internet Izzi', '2024-12-05', (SELECT id FROM categories WHERE name ILIKE '%internet%' OR name ILIKE '%servicios%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 299.00, 'Teléfono Telcel', '2024-12-05', (SELECT id FROM categories WHERE name ILIKE '%tel%' OR name ILIKE '%servicios%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Groceries
('USER_ID_HERE', 'gasto', 2340.00, 'Súper Walmart', '2024-12-02', (SELECT id FROM categories WHERE name ILIKE '%super%' OR name ILIKE '%alimentos%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 1850.00, 'Súper Soriana', '2024-12-09', (SELECT id FROM categories WHERE name ILIKE '%super%' OR name ILIKE '%alimentos%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 2100.00, 'Súper Chedraui', '2024-12-16', (SELECT id FROM categories WHERE name ILIKE '%super%' OR name ILIKE '%alimentos%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 1650.00, 'Súper HEB', '2024-12-23', (SELECT id FROM categories WHERE name ILIKE '%super%' OR name ILIKE '%alimentos%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Transportation
('USER_ID_HERE', 'gasto', 850.00, 'Gasolina', '2024-12-04', (SELECT id FROM categories WHERE name ILIKE '%gasolina%' OR name ILIKE '%transporte%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 920.00, 'Gasolina', '2024-12-11', (SELECT id FROM categories WHERE name ILIKE '%gasolina%' OR name ILIKE '%transporte%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 880.00, 'Gasolina', '2024-12-18', (SELECT id FROM categories WHERE name ILIKE '%gasolina%' OR name ILIKE '%transporte%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 145.00, 'Uber', '2024-12-06', (SELECT id FROM categories WHERE name ILIKE '%uber%' OR name ILIKE '%transporte%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 98.00, 'Uber', '2024-12-13', (SELECT id FROM categories WHERE name ILIKE '%uber%' OR name ILIKE '%transporte%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Dining & Entertainment
('USER_ID_HERE', 'gasto', 450.00, 'Restaurante Italiano', '2024-12-07', (SELECT id FROM categories WHERE name ILIKE '%restaurante%' OR name ILIKE '%comida%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 380.00, 'Tacos El Paisa', '2024-12-08', (SELECT id FROM categories WHERE name ILIKE '%restaurante%' OR name ILIKE '%comida%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 520.00, 'Cena Familiar', '2024-12-14', (SELECT id FROM categories WHERE name ILIKE '%restaurante%' OR name ILIKE '%comida%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 280.00, 'Café Starbucks', '2024-12-10', (SELECT id FROM categories WHERE name ILIKE '%café%' OR name ILIKE '%comida%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 350.00, 'Cine - Película navideña', '2024-12-12', (SELECT id FROM categories WHERE name ILIKE '%entretenimiento%' OR name ILIKE '%ocio%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Subscriptions
('USER_ID_HERE', 'gasto', 219.00, 'Netflix', '2024-12-01', (SELECT id FROM categories WHERE name ILIKE '%suscripciones%' OR name ILIKE '%netflix%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 115.00, 'Spotify Premium', '2024-12-01', (SELECT id FROM categories WHERE name ILIKE '%suscripciones%' OR name ILIKE '%spotify%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 199.00, 'Amazon Prime', '2024-12-05', (SELECT id FROM categories WHERE name ILIKE '%suscripciones%' OR name ILIKE '%amazon%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Shopping
('USER_ID_HERE', 'gasto', 1250.00, 'Ropa - Liverpool', '2024-12-15', (SELECT id FROM categories WHERE name ILIKE '%ropa%' OR name ILIKE '%compras%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 890.00, 'Zapatos', '2024-12-17', (SELECT id FROM categories WHERE name ILIKE '%ropa%' OR name ILIKE '%compras%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Health & Fitness
('USER_ID_HERE', 'gasto', 650.00, 'Gym Mensualidad', '2024-12-01', (SELECT id FROM categories WHERE name ILIKE '%gym%' OR name ILIKE '%deporte%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 450.00, 'Farmacia - Medicamentos', '2024-12-10', (SELECT id FROM categories WHERE name ILIKE '%salud%' OR name ILIKE '%farmacia%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),

-- Christmas Shopping
('USER_ID_HERE', 'gasto', 3500.00, 'Regalos Navidad', '2024-12-20', (SELECT id FROM categories WHERE name ILIKE '%regalo%' OR name ILIKE '%compras%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 1200.00, 'Decoración Navideña', '2024-12-10', (SELECT id FROM categories WHERE name ILIKE '%hogar%' OR name ILIKE '%compras%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW()),
('USER_ID_HERE', 'gasto', 2800.00, 'Cena Navideña', '2024-12-24', (SELECT id FROM categories WHERE name ILIKE '%restaurante%' OR name ILIKE '%comida%' AND user_id = 'USER_ID_HERE' LIMIT 1), NOW());

-- Summary:
-- Total Income: $65,500.00
-- Total Expenses: ~$39,000.00
-- Net: +$26,500.00
