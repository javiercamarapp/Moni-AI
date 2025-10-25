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

    // Get how many challenges to generate and userId (default: 2)
    const { count = 2, userId } = await req.json().catch(() => ({ count: 2, userId: null }));

    console.log('🎯 Generando retos para usuario:', user.id, 'Count:', count);

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

    if (!transactions || transactions.length === 0) {
      console.log('⚠️ No hay transacciones para analizar');
      return new Response(JSON.stringify({ 
        error: 'No hay suficientes transacciones del último mes para generar retos personalizados',
        challenges: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Analyze spending patterns by category AND compare with budgets
    const categoryAnalysis: Record<string, { 
      categoryName: string;
      dailySpend: number;
      weeklySpend: number;
      monthlyBudget: number;
      transactionCount: number;
      exceedsBy: number;
    }> = {};
    
    transactions.forEach(t => {
      const catName = t.categories?.name || "Otros";
      if (!categoryAnalysis[catName]) {
        const budget = budgets?.find(b => b.categories?.name === catName);
        const monthlyBudget = budget?.monthly_budget || 0;
        categoryAnalysis[catName] = { 
          categoryName: catName,
          dailySpend: 0, 
          weeklySpend: 0,
          monthlyBudget,
          transactionCount: 0,
          exceedsBy: 0
        };
      }
      const amount = Number(t.amount);
      categoryAnalysis[catName].dailySpend += amount / 30; // Aprox daily
      categoryAnalysis[catName].weeklySpend += amount / 4.33; // Aprox weekly
      categoryAnalysis[catName].transactionCount += 1;
    });

    // Calculate how much each category exceeds budget
    Object.values(categoryAnalysis).forEach(cat => {
      if (cat.monthlyBudget > 0) {
        const monthlyActual = cat.weeklySpend * 4.33;
        cat.exceedsBy = monthlyActual - cat.monthlyBudget;
      }
    });

    // Prioritize categories with budgets that are being exceeded or have high spending
    const categoriesForChallenges = Object.values(categoryAnalysis)
      .filter(cat => cat.monthlyBudget > 0 || cat.weeklySpend > 100) // Has budget or significant spending
      .sort((a, b) => b.exceedsBy - a.exceedsBy) // Most exceeded first
      .slice(0, Math.max(count, 5)); // Get top categories

    console.log('📊 Categorías para análisis:', categoriesForChallenges.length);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate challenges using AI - enfocados en gastos hormiga y presupuesto
    const prompt = `Analiza el presupuesto mensual vs gasto real de este usuario y genera ${count} retos semanales para REDUCIR GASTOS HORMIGA:

ANÁLISIS DE CATEGORÍAS:
${categoriesForChallenges.map(cat => {
  const status = cat.exceedsBy > 0 ? `⚠️ EXCEDE presupuesto por $${cat.exceedsBy.toFixed(2)}` : 
                 cat.monthlyBudget > 0 ? `✅ Dentro de presupuesto` : 
                 `Sin presupuesto definido`;
  return `- ${cat.categoryName}:
  • Presupuesto mensual: $${cat.monthlyBudget.toFixed(2)}
  • Gasto diario promedio: $${cat.dailySpend.toFixed(2)}
  • Gasto semanal promedio: $${cat.weeklySpend.toFixed(2)}
  • ${cat.transactionCount} transacciones (último mes)
  • Estado: ${status}`;
}).join('\n\n')}

ENFÓCATE EN ESTOS TIPOS DE RETOS ESPECÍFICOS:
1. 🏪 **OXXO/Tienditas**: "Semana sin OXXO" - llevar lunch/snacks de casa
2. 🍕 **Deliverys**: "Cero deliverys esta semana" - cocinar en casa
3. ☕ **Cafés/Antojos**: "Mi café de casa" - eliminar cafés comprados
4. 💸 **Gastos hormiga**: "Detector de gastos hormiga" - revisar cada gasto diario
5. 🎮 **Apps/Suscripciones**: "Auditoría digital" - cancelar suscripciones no usadas
6. 🚗 **Transporte**: "Ruta inteligente" - combinar viajes, usar transporte público
7. 🍔 **Comida fuera**: "Chef casero" - máximo X comidas fuera por semana
8. 🛒 **Supermercado**: "Lista inteligente" - no comprar por impulso
9. 🎬 **Entretenimiento**: "Entretenimiento gratis" - usar opciones sin costo
10. 👕 **Ropa**: "Armario creativo" - combinar lo que ya tienes
11. 💡 **Servicios**: "Ahorro energético" - reducir consumo
12. 🎁 **Otros**: "Gasto consciente" - cuestionar cada compra

REGLAS IMPORTANTES:
- Prioriza categorías que EXCEDEN su presupuesto
- Usa el gasto DIARIO/SEMANAL real para calcular metas realistas
- Meta semanal = reducir 30-50% del gasto semanal actual
- Incluye tips PRÁCTICOS y ACCIONABLES
- Lenguaje motivador tipo "desafío" o "misión"
- Menciona cuánto AHORRARÁN si cumplen el reto

Formato JSON: título motivador, descripción con tips específicos, categoría, y meta de gasto semanal en pesos.`;

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
                      description: { type: "string", description: "Descripción breve del reto" },
                      category: { type: "string", description: "Categoría de gasto" },
                      weekly_target: { type: "number", description: "Meta de gasto semanal en pesos" }
                    },
                    required: ["title", "description", "category", "weekly_target"]
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

    const generatedChallenges = JSON.parse(toolCall.function.arguments).challenges.slice(0, count);

    console.log('✨ Retos generados:', generatedChallenges.length);

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
      current_amount: 0,
      target_amount: c.weekly_target,
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