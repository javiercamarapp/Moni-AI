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

    const prompt = `Analiza los siguientes datos financieros de UN ${viewMode === 'mensual' ? 'MES' : 'AÑO'} ESPECÍFICO y genera proyecciones inteligentes:

PERÍODO DE ANÁLISIS: ${periodoAnalisis}

Datos del período:
- Ingresos totales: $${totalIngresos.toFixed(2)}
- Gastos totales: $${totalGastos.toFixed(2)}
- Balance (ahorro): $${balance.toFixed(2)}

Transacciones del período (primeras 50):
${JSON.stringify(transactionSummary, null, 2)}

${viewMode === 'mensual' 
  ? `MODO MENSUAL - PROYECCIONES:
  
1. Proyección Anual de Ahorro:
   - Toma el balance de este mes: $${balance.toFixed(2)}
   - Multiplícalo por 12 meses: $${balance.toFixed(2)} × 12 = $${(balance * 12).toFixed(2)}
   - Este es tu proyeccionAnual

2. Proyección Semestral de Ahorro:
   - Toma el balance de este mes: $${balance.toFixed(2)}
   - Multiplícalo por 6 meses: $${balance.toFixed(2)} × 6 = $${(balance * 6).toFixed(2)}
   - Este es tu proyeccionSemestral

3. Confianza: Evalúa la consistencia de los ingresos y gastos:
   - "alta" si hay regularidad en las transacciones
   - "media" si hay alguna variabilidad
   - "baja" si hay mucha variabilidad o pocos datos

4. Insights: Analiza el comportamiento EN ESTE MES (${periodLabel}):
   - Patrones de gasto este mes
   - Categorías más gastadas este mes
   - Consejos basados en el comportamiento de este mes`
  : `MODO ANUAL - PROYECCIONES:
  
1. Proyección Anual (año siguiente):
   - Analiza el patrón de ahorro del año actual: $${balance.toFixed(2)}
   - Considera tendencias: ¿está mejorando o empeorando?
   - Si la tendencia es positiva, incrementa 5-15%
   - Si es estable, usa un valor similar
   - Si es negativa, reduce 5-15%
   - Este es tu proyeccionAnual para el próximo año

2. Proyección Semestral (próximos 6 meses):
   - Toma la proyección anual y divídela entre 2
   - Este es tu proyeccionSemestral

3. Confianza: Evalúa la consistencia del año:
   - "alta" si hay consistencia en los patrones anuales
   - "media" si hay variabilidad moderada
   - "baja" si hay mucha volatilidad

4. Insights: Analiza el comportamiento DEL AÑO ${periodLabel}:
   - Patrones anuales de ahorro
   - Tendencias durante el año
   - Proyecciones para el próximo año basadas en este año`}

Devuelve SOLO un JSON válido sin texto adicional:
{
  "proyeccionAnual": [número calculado según las instrucciones],
  "proyeccionSemestral": [número calculado según las instrucciones],
  "confianza": "alta" | "media" | "baja",
  "insights": [
    {
      "titulo": "Título descriptivo",
      "metrica": "Valor o porcentaje relevante",
      "descripcion": "Análisis específico del período ${periodLabel}",
      "tipo": "positivo" | "negativo" | "neutral" | "consejo"
    }
  ]
}

REGLAS CRÍTICAS:
1. Los números deben ser exactos según los cálculos mostrados
2. La confianza debe ser EXACTAMENTE: "alta", "media" o "baja" (minúsculas)
3. Genera 3-5 insights
4. Los insights DEBEN mencionar el período específico
5. NO inventes cifras, usa los cálculos proporcionados`;

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
