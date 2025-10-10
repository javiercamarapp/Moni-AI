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
    const { userId, transactions, totalIngresos, totalGastos, balance, viewMode, periodLabel, allTransactions } = await req.json();
    
    console.log('=== PREDICT SAVINGS DEBUG ===');
    console.log('Period:', viewMode, periodLabel);
    console.log('Period data - Ingresos:', totalIngresos, 'Gastos:', totalGastos, 'Balance:', balance);
    console.log('Period transactions:', transactions?.length || 0);
    console.log('All historical transactions:', allTransactions?.length || 0);
    
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

    // Prepare data summary for AI - período específico para insights (LIMITADO)
    const transactionSummary = transactions?.slice(0, 30).map((t: any) => ({
      type: t.type,
      amount: t.amount,
      date: t.transaction_date,
      category: t.categories?.name
    })) || [];

    // Preparar resumen de datos históricos (LIMITADO a últimos 200)
    const allTransactionsSummary = allTransactions?.slice(0, 200).map((t: any) => ({
      type: t.type,
      amount: t.amount,
      date: t.transaction_date,
      category: t.categories?.name
    })) || [];

    // Calcular métricas históricas
    const historicalIngresos = allTransactions?.filter((t: any) => t.type === 'ingreso')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const historicalGastos = allTransactions?.filter((t: any) => t.type === 'gasto')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const historicalBalance = historicalIngresos - historicalGastos;

    console.log('Historical data - Ingresos:', historicalIngresos, 'Gastos:', historicalGastos, 'Balance:', historicalBalance);

    // Calcular promedio mensual de ahorro basado en todo el historial
    const oldestDate = allTransactions?.length > 0 
      ? new Date(Math.min(...allTransactions.map((t: any) => new Date(t.transaction_date).getTime())))
      : new Date();
    const monthsOfHistory = Math.max(1, Math.ceil((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const averageMonthlySavings = historicalBalance / monthsOfHistory;

    console.log('Months of history:', monthsOfHistory);
    console.log('Average monthly savings:', averageMonthlySavings);

    // Calcular proyecciones base
    const baseAnualProjection = averageMonthlySavings * 12;
    const baseSemestralProjection = averageMonthlySavings * 6;

    console.log('Base projections - Anual:', baseAnualProjection, 'Semestral:', baseSemestralProjection);

    const periodoAnalisis = viewMode === 'mensual' 
      ? `mes específico (${periodLabel || 'mes actual'})`
      : `año específico (${periodLabel || 'año actual'})`;

    const prompt = `Eres un analista financiero experto. Genera proyecciones y análisis financieros.

=== CÁLCULOS BASE (YA REALIZADOS) ===
Promedio mensual de ahorro histórico: $${averageMonthlySavings.toFixed(2)}
Proyección Anual Base: $${baseAnualProjection.toFixed(2)}
Proyección Semestral Base: $${baseSemestralProjection.toFixed(2)}

=== DATOS HISTÓRICOS COMPLETOS ===
- Total transacciones: ${allTransactions?.length || 0}
- Meses de historial: ${monthsOfHistory}
- Ingresos históricos totales: $${historicalIngresos.toFixed(2)}
- Gastos históricos totales: $${historicalGastos.toFixed(2)}
- Balance/ahorro histórico: $${historicalBalance.toFixed(2)}

=== DATOS DEL PERÍODO ACTUAL (${periodoAnalisis}) ===
- Ingresos: $${totalIngresos.toFixed(2)}
- Gastos: $${totalGastos.toFixed(2)}
- Balance: $${balance.toFixed(2)}

=== INSTRUCCIONES ===

1. PROYECCIONES:
   - Usa las proyecciones base calculadas: Anual=$${baseAnualProjection.toFixed(2)}, Semestral=$${baseSemestralProjection.toFixed(2)}
   - Ajusta según tendencia reciente:
     * Si el balance del período actual es mucho mayor que el promedio histórico → aumenta 10-20%
     * Si es similar → usa las proyecciones base
     * Si es menor → reduce 10-20%
   - IMPORTANTE: Si el usuario ahorró mucho en un mes reciente, la proyección anual debe reflejarlo

2. CONFIANZA:
   - "alta": Si hay ${monthsOfHistory} meses o más de datos consistentes
   - "media": Si hay datos pero con variabilidad
   - "baja": Si hay pocos datos (menos de 3 meses)

3. INSIGHTS (específicos de ${periodLabel}):
${viewMode === 'mensual' 
  ? `   - Analiza el comportamiento de ESTE MES
   - Compara este mes ($${balance.toFixed(2)}) con el promedio mensual histórico ($${averageMonthlySavings.toFixed(2)})
   - Menciona si fue un mes mejor o peor que el promedio`
  : `   - Analiza el comportamiento de ESTE AÑO
   - Compara con el promedio histórico
   - Identifica tendencias del año`}

Devuelve SOLO este JSON:
{
  "proyeccionAnual": [número ajustado de ${baseAnualProjection.toFixed(2)}],
  "proyeccionSemestral": [número ajustado de ${baseSemestralProjection.toFixed(2)}],
  "confianza": "alta" | "media" | "baja",
  "insights": [
    {
      "titulo": "string",
      "metrica": "string",
      "descripcion": "Análisis del período ${periodLabel}",
      "tipo": "positivo" | "negativo" | "neutral" | "consejo"
    }
  ]
}

REGLAS:
- Las proyecciones deben tener sentido matemático
- Si el usuario ahorra $400k/mes, la proyección anual debe ser cercana a $4.8M
- Confianza en minúsculas
- 3-5 insights`;

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
    
    console.log('AI Response:', aiResponse);

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
      // Fallback to calculated projections
      predictions = {
        proyeccionAnual: baseAnualProjection,
        proyeccionSemestral: baseSemestralProjection,
        confianza: monthsOfHistory >= 6 ? "media" : "baja",
        insights: [
          {
            titulo: "Proyección Calculada",
            metrica: `${monthsOfHistory} meses de datos`,
            descripcion: `Proyección basada en promedio mensual de ahorro ($${averageMonthlySavings.toFixed(2)}) calculado de ${monthsOfHistory} meses de historial`,
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
