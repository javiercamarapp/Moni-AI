import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 12 challenges distributed across categories
    const { userId } = await req.json().catch(() => ({ userId: null }));

    console.log('🎯 Generando 12 retos personalizados para usuario:', user.id);

    // Define the 12 standard expense categories with emojis
    const STANDARD_CATEGORIES = [
      '🏠 Vivienda',
      '🚗 Transporte',
      '🍽️ Alimentación',
      '🧾 Servicios y suscripciones',
      '🩺 Salud y bienestar',
      '🎓 Educación y desarrollo',
      '💳 Deudas y créditos',
      '🎉 Entretenimiento y estilo de vida',
      '💸 Ahorro e inversión',
      '🤝 Apoyos y otros',
      '🐾 Mascotas',
      '❓ Gastos no identificados'
    ];

    // Get user's budgets by category
    const { data: budgets } = await supabase
      .from("category_budgets")
      .select("*, categories(name)")
      .eq("user_id", user.id);

    console.log('💰 Presupuestos encontrados:', budgets?.length || 0);

    // Get user's recent transactions (last month for analysis)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", user.id)
      .eq("type", "gasto")
      .gte("transaction_date", oneMonthAgo.toISOString().split('T')[0])
      .order("transaction_date", { ascending: false });

    console.log('💳 Transacciones encontradas:', transactions?.length || 0);

    // Initialize analysis for all 12 standard categories
    const categoryAnalysis: Record<string, { 
      categoryName: string;
      dailySpend: number;
      weeklySpend: number;
      monthlyBudget: number;
      transactionCount: number;
      exceedsBy: number;
    }> = {};
    
    // Initialize with standard categories
    STANDARD_CATEGORIES.forEach(catName => {
      const budget = budgets?.find(b => b.categories?.name === catName);
      const monthlyBudget = budget?.monthly_budget || 1000; // Default budget if not set
      categoryAnalysis[catName] = {
        categoryName: catName,
        dailySpend: 0,
        weeklySpend: 0,
        monthlyBudget,
        transactionCount: 0,
        exceedsBy: 0
      };
    });
    
    // Add transaction data if exists
    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        const catName = t.categories?.name;
        // Only count if it matches one of our standard categories
        if (catName && categoryAnalysis[catName]) {
          const amount = Number(t.amount);
          categoryAnalysis[catName].dailySpend += amount / 30;
          categoryAnalysis[catName].weeklySpend += amount / 4.33;
          categoryAnalysis[catName].transactionCount += 1;
        }
      });

      // Calculate how much each category exceeds budget
      Object.values(categoryAnalysis).forEach(cat => {
        if (cat.monthlyBudget > 0) {
          const monthlyActual = cat.weeklySpend * 4.33;
          cat.exceedsBy = monthlyActual - cat.monthlyBudget;
        }
      });
    }

    // Use all 12 standard categories
    const categoriesForChallenges = STANDARD_CATEGORIES.map(catName => categoryAnalysis[catName]);

    console.log('📊 Generando 12 retos para categorías:', categoriesForChallenges.map(c => c.categoryName).join(', '));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate challenges using AI - 12 retos MUY específicos basados en datos reales
    const prompt = `Eres un coach financiero. Analiza los GASTOS REALES del usuario y genera 12 RETOS ESPECÍFICOS.

📊 GASTOS REALES DEL USUARIO (último mes):
${categoriesForChallenges.map(cat => {
  const weeklyBudget = cat.monthlyBudget / 4.33;
  const monthlySpend = cat.weeklySpend * 4.33;
  const avgTransaction = cat.transactionCount > 0 ? monthlySpend / cat.transactionCount : 0;
  const frequency = cat.transactionCount / 4.33; // transacciones por semana
  
  return `${cat.categoryName}:
  💰 Gasto mensual: $${monthlySpend.toFixed(2)} | Gasto semanal: $${cat.weeklySpend.toFixed(2)}
  📅 Transacciones: ${cat.transactionCount}/mes (${frequency.toFixed(1)}/semana)
  💵 Promedio por transacción: $${avgTransaction.toFixed(2)}
  🎯 Presupuesto mensual: $${cat.monthlyBudget.toFixed(2)}`;
}).join('\n\n')}

🎯 REGLAS DE SELECCIÓN:

1. USA LOS NÚMEROS REALES arriba para hacer retos específicos
2. MENCIONA el gasto promedio actual del usuario en cada reto
3. Propón reducir 20-30% del gasto actual
4. NO incluyas categorías con 0 transacciones

EJEMPLOS CON NÚMEROS REALES:

Si 🎉 Entretenimiento gasta $4,500/semana:
✅ "Diversión con $3,000 esta semana (vs $4,500 usual)"
✅ "2 salidas en casa: ahorra $1,500 de tus $4,500"
❌ "Controla entretenimiento" (genérico)

Si 🍽️ Alimentación gasta $2,500/semana con 13 transacciones:
✅ "Cocina 4 días: baja de $2,500 a $1,800/semana"
✅ "Máximo $2,000 en comida (vs $2,500 actual)"
❌ "Come en casa más seguido" (no específico)

Si 🚗 Transporte gasta $350/semana:
✅ "3 días sin Uber: de $350 a $200/semana"
✅ "Máximo $250 en transporte (vs $350 actual)"

Si 🧾 Servicios gasta $380/semana:
✅ "Cancela 1 suscripción: ahorra $100/semana"
✅ "Revisa Netflix, Spotify: baja $380 a $300"

📋 FORMATO DE CADA RETO:

TÍTULO: [emoji] + Acción + Números del usuario
"🍽️ Cocina 4 días: de $2,500 a $1,800 semanales"
"🎉 Solo $3,000 en diversión esta semana (vs $4,500)"

DESCRIPCIÓN: Menciona SU gasto actual + alternativa
"Actualmente gastas $2,500/semana en comida. Te reto a cocinar 4 días y bajar a $1,800."
"Tu promedio en entretenimiento es $4,500/semana. Intenta 2 salidas en casa y gasta solo $3,000."

🎲 TIPOS DE RETOS (distribuye 12 retos):

🎯 spending_limit (4 retos):
- weekly_target = gasto_semanal * 0.75
- daily_goal = null
Ejemplo: "Máximo $3,000 esta semana (vs $4,000 actual)"

📅 days_without (3 retos):
- weekly_target = 0
- daily_goal = 4 (ENTERO, no decimales)
Ejemplo: "4 días sin delivery esta semana"

💰 daily_budget (3 retos):
- weekly_target = gasto_semanal * 0.80
- daily_goal = null
Ejemplo: "Máximo $400 diarios (vs $500 actual)"

🎨 savings_goal (2 retos):
- weekly_target = gasto_semanal * 0.30
- daily_goal = null
Ejemplo: "Ahorra $1,200 cocinando en casa"

FORMATO JSON (USA ESTOS NOMBRES EXACTOS):
{
  "challenges": [
    {
      "title": "string",
      "description": "string",
      "category": "string (con emoji)",
      "challenge_type": "spending_limit|days_without|daily_budget|savings_goal",
      "weekly_target": number,
      "daily_goal": integer o null (SOLO 4 o 5 para days_without)
    }
  ]
}`;

    console.log('🤖 Llamando a Lovable AI para generar retos...');

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Eres un coach financiero que ayuda a crear retos motivadores de ahorro. Responde en español."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_challenges",
            description: "Genera retos de ahorro basados en patrones de gasto",
            parameters: {
              type: "object",
              properties: {
                challenges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Título corto y motivador del reto" },
                      description: { type: "string", description: "Descripción breve con tips concretos" },
                      category: { type: "string", description: "Categoría de gasto" },
                      challenge_type: { 
                        type: "string", 
                        enum: ["spending_limit", "days_without", "daily_budget", "savings_goal"],
                        description: "VARÍA LOS TIPOS: spending_limit (barra), days_without (calendario), daily_budget (diario), savings_goal (ahorro)" 
                      },
                      weekly_target: { type: "number", description: "Meta de gasto semanal en pesos" },
                       daily_goal: { 
                         type: "integer", 
                         description: "SOLO para days_without: número ENTERO de días (4, 5 o 6). Para otros tipos: null" 
                       }
                    },
                    required: ["title", "description", "category", "challenge_type", "weekly_target"]
                  }
                }
              },
              required: ["challenges"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_challenges" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido, intenta más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes en Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No se pudo generar retos");
    }

    const generatedChallenges = JSON.parse(toolCall.function.arguments).challenges.slice(0, 12);

    console.log('✨ Retos generados:', generatedChallenges.length, 'retos');

    // Create challenge records
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start on Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const challengesToInsert = generatedChallenges.map((c: any) => ({
      user_id: user.id,
      title: c.title,
      description: c.description,
      category: c.category,
      challenge_type: c.challenge_type || 'spending_limit',
      current_amount: 0,
      target_amount: c.weekly_target,
      daily_goal: c.daily_goal ? Math.round(c.daily_goal) : null, // Asegurar entero
      period: 'weekly',
      start_date: startOfWeek.toISOString().split('T')[0],
      end_date: endOfWeek.toISOString().split('T')[0],
      days_status: JSON.stringify([
        { day: 0, status: 'pending' }, // Sunday
        { day: 1, status: 'pending' }, // Monday
        { day: 2, status: 'pending' }, // Tuesday
        { day: 3, status: 'pending' }, // Wednesday
        { day: 4, status: 'pending' }, // Thursday
        { day: 5, status: 'pending' }, // Friday
        { day: 6, status: 'pending' }  // Saturday
      ]),
      status: 'pending', // Changed from 'active' to 'pending'
      is_ai_generated: true
    }));

    const { data: insertedChallenges, error: insertError } = await supabase
      .from("challenges")
      .insert(challengesToInsert)
      .select();

    if (insertError) {
      console.error('❌ Error insertando retos:', insertError);
      throw insertError;
    }

    console.log('✅ Retos insertados correctamente:', insertedChallenges?.length);

    return new Response(JSON.stringify({ challenges: insertedChallenges }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error generating challenges:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});