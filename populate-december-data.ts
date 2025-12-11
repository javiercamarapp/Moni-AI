import { supabase } from './src/integrations/supabase/client';

async function populateDecemberData() {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('Error getting user:', userError);
            return;
        }

        console.log('Adding transactions for user:', user.email);

        // Get user's categories
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', user.id);

        console.log('Found categories:', categories?.length);

        // Helper to find category ID
        const findCategory = (keywords: string[]) => {
            const category = categories?.find(c =>
                keywords.some(keyword => c.name.toLowerCase().includes(keyword.toLowerCase()))
            );
            return category?.id || categories?.[0]?.id; // Fallback to first category
        };

        // INCOME TRANSACTIONS
        const incomeTransactions = [
            {
                user_id: user.id,
                type: 'ingreso',
                amount: 45000.00,
                description: 'Nómina Diciembre',
                transaction_date: '2024-12-01',
                category_id: findCategory(['salario', 'ingreso', 'nómina']),
            },
            {
                user_id: user.id,
                type: 'ingreso',
                amount: 8500.00,
                description: 'Proyecto Freelance - Diseño Web',
                transaction_date: '2024-12-05',
                category_id: findCategory(['freelance', 'otros ingresos', 'ingreso']),
            },
            {
                user_id: user.id,
                type: 'ingreso',
                amount: 12000.00,
                description: 'Bono de fin de año',
                transaction_date: '2024-12-15',
                category_id: findCategory(['bono', 'otros ingresos', 'ingreso']),
            },
        ];

        // EXPENSE TRANSACTIONS
        const expenseTransactions = [
            // Housing
            { user_id: user.id, type: 'gasto', amount: 12000.00, description: 'Renta Diciembre', transaction_date: '2024-12-01', category_id: findCategory(['renta', 'vivienda', 'hogar']) },

            // Utilities
            { user_id: user.id, type: 'gasto', amount: 850.00, description: 'CFE - Luz', transaction_date: '2024-12-03', category_id: findCategory(['servicios', 'luz', 'utilidades']) },
            { user_id: user.id, type: 'gasto', amount: 450.00, description: 'Agua', transaction_date: '2024-12-03', category_id: findCategory(['servicios', 'agua', 'utilidades']) },
            { user_id: user.id, type: 'gasto', amount: 599.00, description: 'Internet Izzi', transaction_date: '2024-12-05', category_id: findCategory(['internet', 'servicios']) },
            { user_id: user.id, type: 'gasto', amount: 299.00, description: 'Teléfono Telcel', transaction_date: '2024-12-05', category_id: findCategory(['teléfono', 'celular', 'servicios']) },

            // Groceries
            { user_id: user.id, type: 'gasto', amount: 2340.00, description: 'Súper Walmart', transaction_date: '2024-12-02', category_id: findCategory(['super', 'alimentos', 'comida']) },
            { user_id: user.id, type: 'gasto', amount: 1850.00, description: 'Súper Soriana', transaction_date: '2024-12-09', category_id: findCategory(['super', 'alimentos', 'comida']) },
            { user_id: user.id, type: 'gasto', amount: 2100.00, description: 'Súper Chedraui', transaction_date: '2024-12-16', category_id: findCategory(['super', 'alimentos', 'comida']) },
            { user_id: user.id, type: 'gasto', amount: 1650.00, description: 'Súper HEB', transaction_date: '2024-12-23', category_id: findCategory(['super', 'alimentos', 'comida']) },

            // Transportation
            { user_id: user.id, type: 'gasto', amount: 850.00, description: 'Gasolina', transaction_date: '2024-12-04', category_id: findCategory(['gasolina', 'transporte']) },
            { user_id: user.id, type: 'gasto', amount: 920.00, description: 'Gasolina', transaction_date: '2024-12-11', category_id: findCategory(['gasolina', 'transporte']) },
            { user_id: user.id, type: 'gasto', amount: 880.00, description: 'Gasolina', transaction_date: '2024-12-18', category_id: findCategory(['gasolina', 'transporte']) },
            { user_id: user.id, type: 'gasto', amount: 145.00, description: 'Uber', transaction_date: '2024-12-06', category_id: findCategory(['uber', 'transporte']) },
            { user_id: user.id, type: 'gasto', amount: 98.00, description: 'Uber', transaction_date: '2024-12-13', category_id: findCategory(['uber', 'transporte']) },

            // Dining & Entertainment
            { user_id: user.id, type: 'gasto', amount: 450.00, description: 'Restaurante Italiano', transaction_date: '2024-12-07', category_id: findCategory(['restaurante', 'comida']) },
            { user_id: user.id, type: 'gasto', amount: 380.00, description: 'Tacos El Paisa', transaction_date: '2024-12-08', category_id: findCategory(['restaurante', 'comida']) },
            { user_id: user.id, type: 'gasto', amount: 520.00, description: 'Cena Familiar', transaction_date: '2024-12-14', category_id: findCategory(['restaurante', 'comida']) },
            { user_id: user.id, type: 'gasto', amount: 280.00, description: 'Café Starbucks', transaction_date: '2024-12-10', category_id: findCategory(['café', 'comida']) },
            { user_id: user.id, type: 'gasto', amount: 350.00, description: 'Cine - Película navideña', transaction_date: '2024-12-12', category_id: findCategory(['entretenimiento', 'ocio']) },

            // Subscriptions
            { user_id: user.id, type: 'gasto', amount: 219.00, description: 'Netflix', transaction_date: '2024-12-01', category_id: findCategory(['suscripciones', 'netflix']) },
            { user_id: user.id, type: 'gasto', amount: 115.00, description: 'Spotify Premium', transaction_date: '2024-12-01', category_id: findCategory(['suscripciones', 'spotify']) },
            { user_id: user.id, type: 'gasto', amount: 199.00, description: 'Amazon Prime', transaction_date: '2024-12-05', category_id: findCategory(['suscripciones', 'amazon']) },

            // Shopping
            { user_id: user.id, type: 'gasto', amount: 1250.00, description: 'Ropa - Liverpool', transaction_date: '2024-12-15', category_id: findCategory(['ropa', 'compras']) },
            { user_id: user.id, type: 'gasto', amount: 890.00, description: 'Zapatos', transaction_date: '2024-12-17', category_id: findCategory(['ropa', 'compras']) },

            // Health & Fitness
            { user_id: user.id, type: 'gasto', amount: 650.00, description: 'Gym Mensualidad', transaction_date: '2024-12-01', category_id: findCategory(['gym', 'deporte', 'salud']) },
            { user_id: user.id, type: 'gasto', amount: 450.00, description: 'Farmacia - Medicamentos', transaction_date: '2024-12-10', category_id: findCategory(['salud', 'farmacia']) },

            // Christmas
            { user_id: user.id, type: 'gasto', amount: 3500.00, description: 'Regalos Navidad', transaction_date: '2024-12-20', category_id: findCategory(['regalo', 'compras']) },
            { user_id: user.id, type: 'gasto', amount: 1200.00, description: 'Decoración Navideña', transaction_date: '2024-12-10', category_id: findCategory(['hogar', 'compras']) },
            { user_id: user.id, type: 'gasto', amount: 2800.00, description: 'Cena Navideña', transaction_date: '2024-12-24', category_id: findCategory(['restaurante', 'comida']) },
        ];

        // Insert income
        console.log('Inserting income transactions...');
        const { data: incomeData, error: incomeError } = await supabase
            .from('transactions')
            .insert(incomeTransactions)
            .select();

        if (incomeError) {
            console.error('Error inserting income:', incomeError);
        } else {
            console.log(`✅ Inserted ${incomeData?.length} income transactions`);
        }

        // Insert expenses
        console.log('Inserting expense transactions...');
        const { data: expenseData, error: expenseError } = await supabase
            .from('transactions')
            .insert(expenseTransactions)
            .select();

        if (expenseError) {
            console.error('Error inserting expenses:', expenseError);
        } else {
            console.log(`✅ Inserted ${expenseData?.length} expense transactions`);
        }

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

        console.log('\n📊 Summary:');
        console.log(`Total Income: $${totalIncome.toLocaleString()}`);
        console.log(`Total Expenses: $${totalExpenses.toLocaleString()}`);
        console.log(`Net: $${(totalIncome - totalExpenses).toLocaleString()}`);
        console.log('\n✨ Demo data populated successfully!');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the function
populateDecemberData();
