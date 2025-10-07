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

    // Prepare data summary for AI - período específico para insights
    const transactionSummary = transactions?.slice(0, 50).map((t: any) => ({
      type: t.type,
      amount: t.amount,
      date: t.transaction_date,
      category: t.categories?.name
    })) || [];

    // Preparar resumen de TODOS los datos históricos para proyecciones
    const allTransactionsSummary = allTransactions?.map((t: any) => ({
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

    const periodoAnalisis = viewMode === 'mensual' 
      ? `mes específico (${periodLabel || 'mes actual'})`
      : `año específico (${periodLabel || 'año actual'})`;

    const prompt = `Eres un analista financiero experto. Analiza estos datos y genera proyecciones precisas.

=== DATOS PARA PROYECCIONES (USAR TODO EL HISTORIAL) ===
Historial completo del usuario:
- Total transacciones históricas: ${allTransactions?.length || 0}
- Ingresos históricos totales: $${historicalIngresos.toFixed(2)}
- Gastos históricos totales: $${historicalGastos.toFixed(2)}
- Balance histórico: $${historicalBalance.toFixed(2)}

Transacciones históricas (muestra):
${JSON.stringify(allTransactionsSummary.slice(0, 100), null, 2)}

=== DATOS PARA INSIGHTS (PERÍODO ESPECÍFICO: ${periodoAnalisis}) ===
Datos del período seleccionado:
- Ingresos del período: $${totalIngresos.toFixed(2)}
- Gastos del período: $${totalGastos.toFixed(2)}
- Balance del período: $${balance.toFixed(2)}

Transacciones del período (muestra):
${JSON.stringify(transactionSummary, null, 2)}

=== INSTRUCCIONES ===

1. PROYECCIONES (usar TODO el historial):
   - Analiza TODOS los datos históricos del usuario
   - Calcula el promedio mensual de ahorro de todo el historial
   - Proyección Anual = promedio mensual × 12
   - Proyección Semestral = promedio mensual × 6
   - Ajusta según tendencias (si está mejorando +10%, si empeora -10%)
   - Nivel de confianza basado en consistencia histórica

2. INSIGHTS (específicos del período ${periodoAnalisis}):
   ${viewMode === 'mensual' 
     ? `- Habla sobre el comportamiento EN ESTE MES (${periodLabel})
   - Analiza las categorías más gastadas este mes
   - Compara este mes con el promedio histórico
   - Da consejos basados en lo que pasó este mes`
     : `- Habla sobre el comportamiento EN ESTE AÑO (${periodLabel})
   - Analiza las tendencias del año completo
   - Compara este año con años anteriores si hay datos
   - Da consejos basados en los patrones del año`}

Devuelve SOLO este JSON (sin texto adicional):
{
  "proyeccionAnual": [número basado en TODO el historial],
  "proyeccionSemestral": [número basado en TODO el historial],
  "confianza": "alta" | "media" | "baja",
  "insights": [
    {
      "titulo": "Título del insight",
      "metrica": "Métrica del período",
      "descripcion": "Análisis específico del período ${periodLabel}",
      "tipo": "positivo" | "negativo" | "neutral" | "consejo"
    }
  ]
}

REGLAS:
- Proyecciones: usa TODO el historial para predecir
- Insights: usa SOLO el período ${periodoAnalisis}
- Confianza en minúsculas: "alta", "media" o "baja"
- Genera 3-5 insights específicos del período`;

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
