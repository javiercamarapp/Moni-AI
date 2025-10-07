import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { userId, transactions, totalIngresos, totalGastos, balance, viewMode } = await req.json();
    
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

    // Prepare data summary for AI
    const transactionSummary = transactions?.slice(0, 50).map((t: any) => ({
      type: t.type,
      amount: t.amount,
      date: t.transaction_date,
      category: t.categories?.name
    })) || [];

    const prompt = `Analiza los siguientes datos financieros y genera un análisis detallado con métricas y recomendaciones:

Datos actuales (${viewMode}):
- Ingresos totales: $${totalIngresos}
- Gastos totales: $${totalGastos}
- Balance: $${balance}

Historial reciente de transacciones:
${JSON.stringify(transactionSummary, null, 2)}

Genera un análisis completo con:
1. Proyecciones de ahorro (anual y semestral)
2. Métricas clave (tasa de ahorro, tendencia, categorías más gastadas)
3. Análisis de patrones de consumo
4. Recomendaciones específicas y accionables

Devuelve SOLO un JSON con este formato exacto:
{
  "proyeccionAnual": 50000,
  "proyeccionSemestral": 25000,
  "confianza": "alta",
  "insights": [
    {
      "titulo": "Proyección de Ahorro",
      "metrica": "35%",
      "descripcion": "Descripción detallada",
      "tipo": "positivo"
    },
    {
      "titulo": "Análisis de Gastos",
      "metrica": "$15,000",
      "descripcion": "Análisis de patrones",
      "tipo": "neutral"
    },
    {
      "titulo": "Recomendación Principal",
      "metrica": "3 acciones",
      "descripcion": "Recomendaciones específicas",
      "tipo": "consejo"
    }
  ]
}

IMPORTANTE: Genera entre 3-5 insights. Tipos válidos: "positivo", "negativo", "neutral", "consejo"`;

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
            content: "Eres un analista financiero experto. Analiza patrones financieros y haz proyecciones realistas de ahorro." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
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

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse AI response
    let predictions;
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Error parsing AI response:", e, "Response:", aiResponse);
      // Fallback to simple calculation
      predictions = {
        proyeccionAnual: viewMode === 'mensual' ? balance * 12 : balance,
        proyeccionSemestral: viewMode === 'mensual' ? balance * 6 : balance / 2,
        confianza: "baja",
        insights: [
          {
            titulo: "Proyección Básica",
            metrica: "Calculada",
            descripcion: "Proyección simple basada en balance actual sin análisis de patrones históricos",
            tipo: "neutral"
          }
        ]
      };
    }

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
