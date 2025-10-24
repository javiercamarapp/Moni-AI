import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  amount: number;
  description: string;
  transaction_date: string;
}

const CATEGORY_DEFINITIONS = {
  'vivienda': {
    name: 'Vivienda',
    subcategories: ['Renta o hipoteca', 'Mantenimiento o predial', 'Luz', 'Agua', 'Gas', 'Internet y teléfono', 'Servicio de limpieza / seguridad'],
    keywords: ['renta', 'alquiler', 'hipoteca', 'predial', 'cfe', 'luz', 'agua', 'gas natural', 'gas', 'internet', 'izzi', 'telmex', 'totalplay', 'limpieza', 'condominio']
  },
  'transporte': {
    name: 'Transporte',
    subcategories: ['Gasolina / carga eléctrica', 'Transporte público', 'Uber, Didi, taxis', 'Estacionamiento o peajes', 'Mantenimiento del vehículo / seguro'],
    keywords: ['gasolina', 'uber', 'didi', 'taxi', 'transporte', 'metro', 'autobus', 'estacionamiento', 'peaje', 'gasolinera', 'pemex', 'mobility']
  },
  'alimentacion': {
    name: 'Alimentación',
    subcategories: ['Supermercado', 'Comidas fuera de casa', 'Café / snacks / antojos', 'Apps de comida (Rappi, Uber Eats, etc.)'],
    keywords: ['super', 'mercado', 'walmart', 'soriana', 'chedraui', 'oxxo', 'restaurante', 'comida', 'cafe', 'rappi', 'uber eats', 'didi food', 'starbucks']
  },
  'servicios': {
    name: 'Servicios y suscripciones',
    subcategories: ['Streaming (Netflix, Spotify, etc.)', 'Apps premium (IA, productividad, edición, etc.)', 'Suscripciones de software / membresías', 'Teléfono móvil'],
    keywords: ['netflix', 'spotify', 'amazon prime', 'hbo', 'disney', 'apple', 'suscripcion', 'telefono', 'telcel', 'at&t', 'movistar', 'celular', 'membresia']
  },
  'salud': {
    name: 'Salud y bienestar',
    subcategories: ['Seguro médico', 'Medicinas', 'Consultas médicas', 'Gimnasio, clases, suplementos'],
    keywords: ['farmacia', 'medico', 'hospital', 'consulta', 'gimnasio', 'doctor', 'dentista', 'seguro medico', 'similares', 'guadalajara']
  },
  'educacion': {
    name: 'Educación y desarrollo',
    subcategories: ['Colegiaturas', 'Cursos / talleres', 'Libros o herramientas de aprendizaje', 'Clases extracurriculares'],
    keywords: ['colegiatura', 'escuela', 'universidad', 'curso', 'libro', 'material escolar', 'udemy', 'coursera']
  },
  'deudas': {
    name: 'Deudas y créditos',
    subcategories: ['Tarjetas de crédito', 'Préstamos personales / automotriz', 'Créditos hipotecarios', 'Intereses / pagos mínimos'],
    keywords: ['tarjeta', 'credito', 'prestamo', 'banco', 'banamex', 'bancomer', 'santander', 'hsbc', 'bbva', 'interes']
  },
  'entretenimiento': {
    name: 'Entretenimiento y estilo de vida',
    subcategories: ['Salidas, fiestas, bares', 'Ropa, accesorios, belleza', 'Viajes o escapadas', 'Hobbies, videojuegos, mascotas'],
    keywords: ['cine', 'bar', 'fiesta', 'ropa', 'zapatos', 'viaje', 'hotel', 'entretenimiento', 'zara', 'liverpool', 'palacio', 'sephora', 'steam', 'xbox', 'playstation']
  },
  'ahorro': {
    name: 'Ahorro e inversión',
    subcategories: ['Ahorro mensual', 'Fondo de emergencia', 'Inversión (fondos, CETES, cripto, etc.)', 'Aportación a retiro (AFORE, IRA, etc.)'],
    keywords: ['ahorro', 'inversion', 'cetes', 'fondo', 'retiro', 'afore', 'gbm', 'kuspit', 'bitso']
  },
  'apoyos': {
    name: 'Apoyos y otros',
    subcategories: ['Apoyo familiar / hijos / pareja', 'Donaciones', 'Mascotas', 'Otros gastos no clasificados'],
    keywords: ['apoyo', 'donacion', 'familia', 'mascota', 'veterinaria', 'transferencia']
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('userId is required');
    }

    console.log('Categorizando gastos para usuario:', userId);

    // Obtener transacciones de los últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateString = sixMonthsAgo.toISOString().split('T')[0];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const transactionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/transactions?select=amount,description,transaction_date&user_id=eq.${userId}&type=eq.gasto&transaction_date=gte.${dateString}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    if (!transactionsResponse.ok) {
      throw new Error('Error fetching transactions');
    }

    const transactions: Transaction[] = await transactionsResponse.json();
    console.log(`Encontradas ${transactions.length} transacciones`);

    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ estimates: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar IA para categorizar cada transacción
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const systemPrompt = `Eres un experto en categorización de gastos financieros. 
Tu tarea es clasificar descripciones de transacciones en las siguientes categorías:

${Object.entries(CATEGORY_DEFINITIONS).map(([id, def]) => 
  `- ${id}: ${def.name} (${def.keywords.join(', ')})`
).join('\n')}

Para cada descripción, responde ÚNICAMENTE con el ID de la categoría (vivienda, transporte, alimentacion, servicios, salud, educacion, deudas, entretenimiento, ahorro, apoyos).
Si no estás seguro, usa 'apoyos' como categoría por defecto.`;

    // Categorizar en lotes de 50 transacciones
    const batchSize = 50;
    const categorizedTransactions: { category: string; amount: number; date: string }[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const prompt = `Categoriza estas transacciones (responde solo con el ID de categoría separado por saltos de línea):\n\n${
        batch.map((t, idx) => `${idx + 1}. ${t.description}`).join('\n')
      }`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error('Error en IA, usando palabras clave como fallback');
        // Fallback: usar palabras clave
        batch.forEach(t => {
          let category = 'apoyos';
          const desc = (t.description || '').toLowerCase();
          
          for (const [catId, catDef] of Object.entries(CATEGORY_DEFINITIONS)) {
            if (catDef.keywords.some(kw => desc.includes(kw))) {
              category = catId;
              break;
            }
          }
          
          categorizedTransactions.push({
            category,
            amount: Number(t.amount),
            date: t.transaction_date
          });
        });
        continue;
      }

      const aiData = await aiResponse.json();
      const categories = aiData.choices[0].message.content
        .split('\n')
        .map((c: string) => c.trim().toLowerCase())
        .filter((c: string) => c in CATEGORY_DEFINITIONS);

      batch.forEach((t, idx) => {
        categorizedTransactions.push({
          category: categories[idx] || 'apoyos',
          amount: Number(t.amount),
          date: t.transaction_date
        });
      });
    }

    console.log(`Categorizadas ${categorizedTransactions.length} transacciones`);

    // Calcular promedio mensual por categoría
    const estimates: Record<string, number> = {};

    for (const [categoryId] of Object.entries(CATEGORY_DEFINITIONS)) {
      const categoryTxs = categorizedTransactions.filter(t => t.category === categoryId);
      
      if (categoryTxs.length === 0) continue;

      // Agrupar por mes
      const monthlyTotals: Record<string, number> = {};
      categoryTxs.forEach(t => {
        const monthKey = t.date.substring(0, 7);
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + t.amount;
      });

      // Calcular promedio
      const months = Object.keys(monthlyTotals).length;
      if (months > 0) {
        const total = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
        estimates[categoryId] = Math.round(total / months);
        console.log(`${categoryId}: $${estimates[categoryId]} (${months} meses)`);
      }
    }

    return new Response(
      JSON.stringify({ estimates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
