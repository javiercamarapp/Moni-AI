const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();

    console.log('📥 Received transactions for daily expenses:', transactions?.length || 0);

    if (!transactions || transactions.length === 0) {
      console.log('⚠️ No transactions to analyze');
      return new Response(
        JSON.stringify({ expenses: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    console.log('🔑 API Key present:', !!LOVABLE_API_KEY);

    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ expenses: [], error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente financiero experto en detectar GASTOS COTIDIANOS CONSISTENTES.

REGLA CRÍTICA: Solo incluye gastos que aparezcan en AL MENOS 6 MESES DIFERENTES del historial.

✅ INCLUYE (solo si hay 6+ meses de pagos):
- CFE, Luz, electricidad (monto variable)
- Agua, SACMEX, servicios de agua (monto variable)
- Gas natural, gas LP (monto variable)
- Teléfono celular si tiene consumo variable
- Internet si tiene cargos variables
- Gasolina / combustible (si es recurrente mensual)
- Comida / supermercado (solo si es el mismo establecimiento, 6+ meses)
- Transporte (si es recurrente mensual)

❌ NO INCLUYAS:
- Gastos que aparezcan en menos de 6 meses diferentes
- Netflix, Spotify, Disney+ (son suscripciones de monto fijo)
- Servicios de streaming
- Gimnasios
- Compras ocasionales o no recurrentes

ANÁLISIS REQUERIDO:
1. Agrupa transacciones por descripción similar (ej: "CFE oct", "CFE nov" → "CFE")
2. Cuenta en cuántos MESES DIFERENTES aparece cada concepto
3. DESCARTA cualquier concepto que aparezca en menos de 6 meses diferentes
4. Para los que califican (6+ meses):
   - Calcula PROMEDIO, MÍNIMO y MÁXIMO
   - Identifica la frecuencia más común
   - Cuenta el total de ocurrencias

Responde ÚNICAMENTE con un JSON válido:
{
  "expenses": [
    {
      "description": "nombre del servicio",
      "averageAmount": monto_promedio,
      "minAmount": monto_minimo,
      "maxAmount": monto_maximo,
      "frequency": "mensual" | "quincenal" | "semanal",
      "categoryName": "categoría si disponible",
      "occurrences": número_total_de_pagos,
      "monthsPresent": número_de_meses_diferentes_donde_aparece
    }
  ]
}

IMPORTANTE: Si ningún gasto cumple el requisito de 6 meses, responde: {"expenses": []}`
          },
          {
            role: 'user',
            content: `Analiza estas transacciones y detecta gastos cotidianos recurrentes con monto variable:\n\n${JSON.stringify(transactions.map((t: any) => ({
              description: t.description,
              amount: t.amount,
              date: t.transaction_date,
              category: t.categories?.name || 'Sin categoría'
            })), null, 2)}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ expenses: [], error: `AI API error: ${aiResponse.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('🤖 AI Response:', JSON.stringify(aiData, null, 2));
    
    const content = aiData.choices?.[0]?.message?.content || '{"expenses": []}';
    console.log('📝 AI Content:', content);
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { expenses: [] };
    
    console.log('✅ Parsed daily expenses:', jsonResponse.expenses?.length || 0);

    return new Response(
      JSON.stringify(jsonResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error detecting daily expenses:', error);
    return new Response(
      JSON.stringify({ 
        expenses: [],
        error: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
