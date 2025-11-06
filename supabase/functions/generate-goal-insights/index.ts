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
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { goalId } = await req.json();

    // Fetch goal details
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select("*")
      .eq("id", goalId)
      .single();

    if (goalError) throw goalError;

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
      throw new Error("LOVABLE_API_KEY not configured");
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
      throw new Error("Error generating insights");
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices[0].message.content;

    // Parse the 5 insights from the response
    const insights = insightsText
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 5);

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-goal-insights:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
