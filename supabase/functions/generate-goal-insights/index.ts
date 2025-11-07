import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó autorización. Por favor, inicia sesión nuevamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado. Por favor, inicia sesión nuevamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { goalId, isGroupGoal } = await req.json();

    if (!goalId) {
      return new Response(
        JSON.stringify({ error: "ID de meta no proporcionado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache first
    console.log(`Checking cache for goal ${goalId}`);
    const { data: cachedData, error: cacheError } = await supabase
      .from("goal_insights_cache")
      .select("insights, expires_at")
      .eq("goal_id", goalId)
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cacheError && cachedData) {
      console.log(`Cache hit for goal ${goalId}`);
      return new Response(
        JSON.stringify({ insights: cachedData.insights, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cache miss for goal ${goalId}, generating new insights`);

    // Fetch goal details from the appropriate table
    let goal;
    if (isGroupGoal) {
      const { data, error: goalError } = await supabase
        .from("circle_goals")
        .select("*")
        .eq("id", goalId)
        .maybeSingle();

      if (goalError) throw goalError;
      if (!data) throw new Error("Group goal not found");
      
      goal = {
        id: data.id,
        title: data.title,
        target: data.target_amount,
        current: 0, // Will calculate from members
        deadline: data.deadline,
      };
    } else {
      const { data, error: goalError } = await supabase
        .from("goals")
        .select("*")
        .eq("id", goalId)
        .maybeSingle();

      if (goalError) throw goalError;
      if (!data) throw new Error("Goal not found");
      
      goal = data;
    }

    // Fetch user's recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("transaction_date", thirtyDaysAgo.toISOString().split('T')[0])
      .order("transaction_date", { ascending: false });

    if (txError) throw txError;

    // Calculate financial metrics
    const totalIncome = transactions
      ?.filter(t => t.type === "ingreso")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const totalExpenses = transactions
      ?.filter(t => t.type === "gasto")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const avgDailyExpenses = totalExpenses / 30;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Calculate goal metrics
    const remaining = Number(goal.target) - Number(goal.current);
    const daysToDeadline = goal.deadline 
      ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const prompt = `Eres un asesor financiero experto. Analiza esta información financiera personal y genera EXACTAMENTE 5 insights únicos y accionables sobre la meta de ahorro del usuario. Cada insight debe ser diferente y útil.

INFORMACIÓN DE LA META:
- Título: ${goal.title}
- Meta total: $${goal.target.toLocaleString('es-MX')}
- Ahorrado actual: $${goal.current.toLocaleString('es-MX')}
- Falta por ahorrar: $${remaining.toLocaleString('es-MX')}
${goal.deadline ? `- Fecha límite: ${new Date(goal.deadline).toLocaleDateString('es-MX')}` : '- Sin fecha límite'}
${daysToDeadline ? `- Días restantes: ${daysToDeadline}` : ''}

INFORMACIÓN FINANCIERA (ÚLTIMOS 30 DÍAS):
- Ingresos totales: $${totalIncome.toLocaleString('es-MX')}
- Gastos totales: $${totalExpenses.toLocaleString('es-MX')}
- Gasto diario promedio: $${avgDailyExpenses.toFixed(2)}
- Tasa de ahorro: ${savingsRate.toFixed(1)}%
- Total de transacciones: ${transactions?.length || 0}

INSTRUCCIONES CRÍTICAS:
1. Genera EXACTAMENTE 5 insights diferentes
2. Cada insight debe tener entre 8-15 palabras
3. Usa emojis relevantes al inicio de cada insight
4. Sé específico con números y fechas cuando sea posible
5. Enfócate en: ahorro sugerido, tiempo estimado, estrategias, progreso, recomendaciones
6. NO uses formato JSON, solo devuelve 5 líneas de texto, una por insight
7. Cada insight debe empezar con un emoji diferente

EJEMPLO DEL FORMATO ESPERADO:
💰 Ahorra $500 semanales para alcanzar tu meta en 3 meses
📊 Tu tasa de ahorro del 25% es excelente, mantén el ritmo
🎯 Reducir gastos diarios en $50 acelerará tu objetivo
⏰ A este paso, lograrás tu meta 2 semanas antes
🚀 Aumenta aportes en $200 mensuales para cumplir a tiempo`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuración de IA no disponible. Por favor, contacta al soporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un asesor financiero experto que da consejos claros y concisos." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Por favor, recarga tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Error al generar insights. Por favor, intenta nuevamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices[0]?.message?.content;

    if (!insightsText) {
      return new Response(
        JSON.stringify({ error: "No se pudieron generar insights. Por favor, intenta nuevamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the 5 insights from the response
    const insights = insightsText
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 5);

    // Cache the insights
    try {
      await supabase
        .from("goal_insights_cache")
        .insert({
          goal_id: goalId,
          user_id: user.id,
          insights: insights,
        });
      console.log(`Cached insights for goal ${goalId}`);
    } catch (cacheInsertError) {
      console.error("Error caching insights:", cacheInsertError);
      // Don't fail if caching fails, just log it
    }

    return new Response(
      JSON.stringify({ insights, fromCache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-goal-insights:", error);
    
    // Provide specific error messages based on error type
    let errorMessage = "Error inesperado al generar insights. Por favor, intenta nuevamente.";
    
    if (error.message?.includes("fetch")) {
      errorMessage = "Error de conexión. Por favor, verifica tu conexión a internet.";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "La solicitud tardó demasiado. Por favor, intenta nuevamente.";
    } else if (error.message?.includes("not found")) {
      errorMessage = "Meta no encontrada. Por favor, verifica que la meta existe.";
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
