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
    const { userId, transactions, totalIngresos, totalGastos, balance, viewMode, periodLabel } = await req.json();
    
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

    const periodoAnalisis = viewMode === 'mensual' 
      ? `mes específico (${periodLabel || 'mes actual'})`
      : `año específico (${periodLabel || 'año actual'})`;

    const prompt = `Analiza los siguientes datos financieros de UN ${viewMode === 'mensual' ? 'MES' : 'AÑO'} ESPECÍFICO y genera un análisis detallado:

PERÍODO DE ANÁLISIS: ${periodoAnalisis}
IMPORTANTE: Todos los análisis, proyecciones e insights deben estar basados ÚNICAMENTE en este período específico.

Datos del período (${viewMode}):
- Ingresos totales: $${totalIngresos}
- Gastos totales: $${totalGastos}
- Balance: $${balance}

Transacciones del período:
${JSON.stringify(transactionSummary, null, 2)}

${viewMode === 'mensual' 
  ? `Genera proyecciones basadas en este MES:
- Proyección Anual: Multiplica las métricas del mes por 12
- Proyección Semestral: Multiplica las métricas del mes por 6
- Insights: Deben hablar del comportamiento EN ESTE MES específico`
  : `Genera proyecciones basadas en este AÑO:
- Proyección Anual: Usa los datos del año completo
- Proyección Semestral: Divide los datos del año entre 2
- Insights: Deben hablar del comportamiento EN ESTE AÑO específico`}

Devuelve SOLO un JSON con este formato exacto:
{
  "proyeccionAnual": 50000,
  "proyeccionSemestral": 25000,
  "confianza": "alta",
  "insights": [
    {
      "titulo": "Título del insight",
      "metrica": "Métrica relevante",
      "descripcion": "Descripción que mencione explícitamente el período analizado (${periodLabel})",
      "tipo": "positivo"
    }
  ]
}

CRÍTICO: 
- Los insights DEBEN mencionar el período específico analizado
- ${viewMode === 'mensual' ? 'Habla de "este mes" o "en este mes"' : 'Habla de "este año" o "en este año"'}
- NO generalices, sé específico sobre el período
- Genera entre 3-5 insights
- Tipos válidos: "positivo", "negativo", "neutral", "consejo"`;

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
