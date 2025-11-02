import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, transactions, totalIngresos, totalGastos, balance, viewMode, periodLabel, allTransactions } = await req.json();
    
    console.log('=== PREDICT SAVINGS DEBUG ===');
    console.log('Period:', viewMode, periodLabel);
    console.log('Period data - Ingresos:', totalIngresos, 'Gastos:', totalGastos, 'Balance:', balance);
    
    // Input validation
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid userId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!Array.isArray(transactions)) {
      return new Response(
        JSON.stringify({ error: 'Transactions must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (typeof totalIngresos !== 'number' || totalIngresos < 0 || 
        typeof totalGastos !== 'number' || totalGastos < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid income or expense values' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calcular métricas históricas
    const historicalIngresos = allTransactions?.filter((t: any) => t.type === 'ingreso')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const historicalGastos = allTransactions?.filter((t: any) => t.type === 'gasto')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const historicalBalance = historicalIngresos - historicalGastos;

    // Calcular promedio mensual de ahorro basado en todo el historial
    const oldestDate = allTransactions?.length > 0 
      ? new Date(Math.min(...allTransactions.map((t: any) => new Date(t.transaction_date).getTime())))
      : new Date();
    const monthsOfHistory = Math.max(1, Math.ceil((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const averageMonthlySavings = historicalBalance / monthsOfHistory;

    // Calcular proyecciones base
    const baseAnualProjection = averageMonthlySavings * 12;
    const baseSemestralProjection = averageMonthlySavings * 6;

    console.log('Base projections - Anual:', baseAnualProjection, 'Semestral:', baseSemestralProjection);

    // Simplified prompt with tool calling for structured output
    const prompt = `Analiza estos datos financieros y genera proyecciones de ahorro:

Datos del período actual (${periodLabel}):
- Ingresos: $${totalIngresos.toFixed(2)}
- Gastos: $${totalGastos.toFixed(2)}
- Balance: $${balance.toFixed(2)}

Datos históricos (${monthsOfHistory} meses):
- Promedio mensual de ahorro: $${averageMonthlySavings.toFixed(2)}
- Proyección base anual: $${baseAnualProjection.toFixed(2)}
- Proyección base semestral: $${baseSemestralProjection.toFixed(2)}

Ajusta las proyecciones según la tendencia reciente y genera 3-4 insights específicos.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Eres un analista financiero experto. Genera proyecciones realistas y consejos prácticos." 
          },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_savings_prediction",
            description: "Genera proyecciones de ahorro y análisis financiero",
            parameters: {
              type: "object",
              properties: {
                proyeccionAnual: {
                  type: "number",
                  description: "Proyección de ahorro anual en pesos"
                },
                proyeccionSemestral: {
                  type: "number",
                  description: "Proyección de ahorro semestral en pesos"
                },
                confianza: {
                  type: "string",
                  enum: ["alta", "media", "baja"],
                  description: "Nivel de confianza en las proyecciones"
                },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titulo: { type: "string", description: "Título del insight" },
                      metrica: { type: "string", description: "Métrica o dato relevante" },
                      descripcion: { type: "string", description: "Descripción detallada" },
                      tipo: { 
                        type: "string", 
                        enum: ["positivo", "negativo", "neutral", "consejo"],
                        description: "Tipo de insight"
                      }
                    },
                    required: ["titulo", "metrica", "descripcion", "tipo"]
                  },
                  minItems: 3,
                  maxItems: 5
                }
              },
              required: ["proyeccionAnual", "proyeccionSemestral", "confianza", "insights"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_savings_prediction" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // En caso de error 500 del gateway, usar fallback
      console.log("Using fallback predictions due to gateway error");
      const fallbackPredictions = {
        proyeccionAnual: baseAnualProjection,
        proyeccionSemestral: baseSemestralProjection,
        confianza: monthsOfHistory >= 6 ? "media" : "baja",
        insights: [
          {
            titulo: "Proyección Calculada",
            metrica: `${monthsOfHistory} meses de datos`,
            descripcion: `Basado en tu promedio mensual de ahorro de $${averageMonthlySavings.toFixed(2)}`,
            tipo: "neutral"
          },
          {
            titulo: balance > averageMonthlySavings ? "Buen mes de ahorro" : "Ahorro por debajo del promedio",
            metrica: `$${balance.toFixed(2)} vs $${averageMonthlySavings.toFixed(2)}`,
            descripcion: balance > averageMonthlySavings 
              ? "Este período ahorraste más que tu promedio mensual histórico"
              : "Este período tu ahorro estuvo por debajo de tu promedio histórico",
            tipo: balance > averageMonthlySavings ? "positivo" : "negativo"
          }
        ]
      };

      return new Response(
        JSON.stringify(fallbackPredictions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI Response:', data);

    // Extract structured output from tool call
    let predictions;
    try {
      const toolCall = data.choices[0].message.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        predictions = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error("No tool call in response");
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      // Fallback to calculated projections
      predictions = {
        proyeccionAnual: baseAnualProjection,
        proyeccionSemestral: baseSemestralProjection,
        confianza: monthsOfHistory >= 6 ? "media" : "baja",
        insights: [
          {
            titulo: "Proyección Calculada",
            metrica: `${monthsOfHistory} meses de datos`,
            descripcion: `Basado en promedio mensual de $${averageMonthlySavings.toFixed(2)}`,
            tipo: "neutral"
          }
        ]
      };
    }

    console.log('Final predictions:', predictions);

    return new Response(
      JSON.stringify(predictions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predict-savings function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});