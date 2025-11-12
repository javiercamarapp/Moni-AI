import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('No autorizado');

    console.log('Generando retos personalizados para usuario:', user.id);

    // Obtener transacciones recientes (últimos 60 días)
    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });

    console.log(`Transacciones encontradas: ${transactions?.length || 0}`);

    // Obtener categorías del usuario
    const { data: categories } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    // Analizar patrones de gasto
    const spendingPatterns = analyzeSpendingPatterns(transactions || [], categories || []);
    console.log('Patrones de gasto analizados:', spendingPatterns);

    // Generar retos con IA
    const challenges = await generateChallengesWithAI(spendingPatterns, user.id);

    return new Response(JSON.stringify({ 
      success: true,
      challenges,
      message: '¡Retos personalizados generados con éxito!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeSpendingPatterns(transactions: any[], categories: any[]) {
  const patterns: any = {
    topCategories: {},
    totalSpent: 0,
    avgDailySpending: 0,
    frequentSmallPurchases: 0,
  };

  // Agrupar por categoría
  transactions.forEach(t => {
    if (t.type === 'gasto') {
      patterns.totalSpent += Number(t.amount);
      
      if (t.category_id) {
        const category = categories.find(c => c.id === t.category_id);
        const categoryName = category?.name || 'Sin categoría';
        
        if (!patterns.topCategories[categoryName]) {
          patterns.topCategories[categoryName] = { total: 0, count: 0 };
        }
        patterns.topCategories[categoryName].total += Number(t.amount);
        patterns.topCategories[categoryName].count += 1;
      }

      // Contar gastos pequeños (< $100)
      if (Number(t.amount) < 100) {
        patterns.frequentSmallPurchases += 1;
      }
    }
  });

  patterns.avgDailySpending = patterns.totalSpent / 60;

  return patterns;
}

async function generateChallengesWithAI(patterns: any, userId: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY no configurado');

  const prompt = `Eres Moni, un asistente financiero inteligente. Analiza estos patrones de gasto del usuario y genera 3 retos de ahorro personalizados:

**Datos del usuario:**
- Gasto total (últimos 60 días): $${patterns.totalSpent.toFixed(2)} MXN
- Gasto diario promedio: $${patterns.avgDailySpending.toFixed(2)} MXN
- Gastos pequeños (<$100): ${patterns.frequentSmallPurchases} compras
- Categorías principales: ${JSON.stringify(patterns.topCategories)}

**Genera 3 retos:**
1. Un **reto diario** (100 XP)
2. Un **reto semanal** (500 XP)
3. Un **reto mensual** (800-2000 XP según dificultad)

Para cada reto proporciona:
- **titulo**: breve y motivador
- **descripcion**: explica el desafío de forma positiva y alcanzable
- **period**: "daily", "weekly" o "monthly"
- **challenge_type**: "budget_limit", "no_spending", "manual_entry" o "savings"
- **category**: categoría específica si aplica
- **target_amount**: meta numérica si aplica
- **estimated_savings**: ahorro estimado en pesos
- **xp_reward**: 100 para diario, 500 para semanal, 800-2000 para mensual
- **difficulty**: "easy", "medium" o "hard"

Responde SOLO con JSON válido, sin texto adicional:`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Eres un experto en gamificación financiera. Siempre respondes con JSON válido.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error de IA:', response.status, errorText);
    throw new Error('Error al generar retos con IA');
  }

  const aiData = await response.json();
  const content = aiData.choices[0].message.content;
  console.log('Respuesta de IA:', content);

  const challengesData = JSON.parse(content);
  
  // Asegurarse de que sea un array
  const challengesArray = challengesData.challenges || challengesData.retos || (Array.isArray(challengesData) ? challengesData : []);

  return challengesArray;
}