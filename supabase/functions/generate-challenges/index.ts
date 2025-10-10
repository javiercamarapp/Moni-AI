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

    // Get how many challenges to generate (default: 2)
    const { count = 2 } = await req.json().catch(() => ({ count: 2 }));

    // Get user's recent transactions (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", user.id)
      .eq("type", "gasto")
      .gte("transaction_date", threeMonthsAgo.toISOString().split('T')[0])
      .order("transaction_date", { ascending: false });

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ challenges: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Analyze spending patterns by category
    const categorySpending: Record<string, { total: number; count: number; name: string }> = {};
    
    transactions.forEach(t => {
      const catName = t.categories?.name || "Otros";
      if (!categorySpending[catName]) {
        categorySpending[catName] = { total: 0, count: 0, name: catName };
      }
      categorySpending[catName].total += Number(t.amount);
      categorySpending[catName].count += 1;
    });

    // Find categories with high spending
    const spendingArray = Object.values(categorySpending)
      .sort((a, b) => b.total - a.total)
      .slice(0, Math.max(count, 3));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate challenges using AI
    const prompt = `Analiza estos patrones de gasto y genera ${count} retos semanales específicos y motivadores:

${spendingArray.map(s => `- ${s.name}: $${s.total.toFixed(2)} en ${s.count} transacciones (últimos 3 meses)`).join('\n')}

Para cada categoría, genera un reto semanal realista que reduzca el gasto en un 30-40%. 
Formato: título corto y motivador, descripción breve, y la meta de gasto semanal.`;

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
      throw insertError;
    }

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