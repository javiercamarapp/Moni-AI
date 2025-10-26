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

    // Generate 8 challenges distributed across categories
    const { userId } = await req.json().catch(() => ({ userId: null }));

    console.log('🎯 Generando 8 retos distribuidos para usuario:', user.id);

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

    // Generate challenges using AI - 8 retos optimizados y personalizados
    const prompt = `Eres un coach financiero experto. Analiza los datos del usuario y genera EXACTAMENTE 8 retos semanales PERSONALIZADOS, ESPECÍFICOS y ALCANZABLES.

DATOS REALES DEL USUARIO:
${categoriesForChallenges.map(cat => {
  const weeklyBudget = cat.monthlyBudget / 4.33;
  const savingsTarget = weeklyBudget * 0.25;
  const avgTransaction = cat.transactionCount > 0 ? cat.weeklySpend / cat.transactionCount : 0;
  const status = cat.transactionCount === 0 ? `Sin transacciones` :
                 cat.exceedsBy > 0 ? `⚠️ EXCEDE por $${cat.exceedsBy.toFixed(2)} (${((cat.exceedsBy/cat.monthlyBudget)*100).toFixed(0)}%)` : 
                 cat.monthlyBudget > 0 ? `✅ Dentro` : 
                 `Sin presupuesto`;
  return `${cat.categoryName}:
  Gasto actual: $${cat.weeklySpend.toFixed(2)}/semana | Presupuesto: $${weeklyBudget.toFixed(2)}/semana
  Transacciones: ${cat.transactionCount}/mes | Promedio: $${avgTransaction.toFixed(2)}/tx
  Estado: ${status}`;
}).join('\n')}

INSTRUCCIONES CRÍTICAS:

1. SELECCIONA 8 CATEGORÍAS donde el usuario:
   - Gaste MÁS dinero (prioriza alto impacto)
   - Tenga margen real de ahorro
   - Pueda ver resultados tangibles

2. PARA CADA RETO CREA:
   
   TÍTULO (title):
   - Corto, específico, motivador
   - Incluye monto o días exactos
   - Ejemplo BUENO: "Reduce delivery a $800 esta semana"
   - Ejemplo MALO: "Ahorra en comida" ❌
   
   DESCRIPCIÓN (description):
   - 2-3 estrategias CONCRETAS y ACCIONABLES
   - Usa datos del usuario (ej: "Gastas $X promedio por delivery")
   - Sugiere alternativas específicas
   - Ejemplo BUENO: "Prepara 4 comidas en casa. Ahorro: $600/semana"
   - Ejemplo MALO: "Trata de cocinar más" ❌
   
   CATEGORÍA (category):
   - DEBE incluir emoji exacto de la lista
   - Ejemplo: "🍕 Alimentos y Bebidas"

3. TIPOS DE RETOS (distribuye variedad):

   🎯 spending_limit (3 retos):
   - target_amount = presupuesto_semanal * 0.75
   - Para categorías con gasto alto
   - Título: "Gasta máximo $X en [categoría]"

   📅 days_without (2 retos):
   - daily_goal = 5, target_amount = 0
   - Para gastos frecuentes/impulsivos
   - Título: "5 días sin [gasto específico]"

   💰 daily_budget (2 retos):
   - target_amount = (presupuesto_semanal / 7) * 0.85
   - Para gastos diarios
   - Título: "Máximo $X diarios en [categoría]"

   🎨 savings_goal (1 reto):
   - target_amount = presupuesto_semanal * 0.25
   - Para categorías clave
   - Título: "Ahorra $X en [categoría]"

4. CALIDAD DE CONTENIDO:
   - Tips ESPECÍFICOS (ej: "Compra el martes, 20% descuento")
   - Montos REALISTAS basados en datos
   - Lenguaje MOTIVADOR pero directo
   - Evita frases genéricas como "intenta" o "trata"

FORMATO JSON:
{
  "challenges": [
    {
      "title": "string (específico con monto)",
      "description": "string (2-3 tips concretos)",
      "category": "string (con emoji)",
      "challenge_type": "spending_limit|days_without|daily_budget|savings_goal",
      "target_amount": number,
      "daily_goal": number (solo para days_without, sino null)
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
                      daily_goal: { type: "number", description: "Solo para days_without: número de días a completar (4-6)" }
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

    const generatedChallenges = JSON.parse(toolCall.function.arguments).challenges.slice(0, 8);

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
      daily_goal: c.daily_goal || null,
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