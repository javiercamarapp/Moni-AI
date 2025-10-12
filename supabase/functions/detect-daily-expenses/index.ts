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
            content: `Eres un asistente financiero experto en detectar GASTOS COTIDIANOS con monto variable.

REGLA CRÍTICA: Solo incluye gastos donde el MONTO VARÍA SIGNIFICATIVAMENTE (>10% entre pagos) y aparecen en AL MENOS 6 MESES DIFERENTES.

✅ INCLUYE (solo si hay 6+ meses y MONTO VARIABLE >10%):
- CFE, Luz, electricidad (MONTO VARÍA por consumo)
- Agua, SACMEX, servicios de agua (MONTO VARÍA)
- Gas natural, gas LP (MONTO VARÍA por consumo)
- Gasolina / combustible (MONTO VARÍA)
- Supermercado (si es recurrente y MONTO VARÍA)
- Transporte (si es recurrente y MONTO VARÍA)

❌ NO INCLUYAS:
- Gastos que aparezcan en menos de 6 meses diferentes
- Netflix, Spotify, Disney+, Amazon Prime (MONTO FIJO = suscripción)
- Gimnasio (MONTO FIJO = suscripción)
- Software, apps (MONTO FIJO = suscripción)
- Cualquier servicio donde el monto sea CONSISTENTE (variación <10%)
- Compras ocasionales o no recurrentes

ANÁLISIS REQUERIDO:
1. Agrupa transacciones por descripción similar (ej: "CFE oct", "CFE nov" → "CFE")
2. Calcula la VARIABILIDAD del monto entre pagos del mismo servicio
3. Si la variabilidad es MAYOR al 10%, es MONTO VARIABLE (gasto cotidiano)
4. Si la variabilidad es MENOR al 10%, NO es gasto cotidiano (es suscripción)
5. Cuenta en cuántos MESES DIFERENTES aparece
6. DESCARTA conceptos que aparezcan en menos de 6 meses diferentes
7. Para los que califican (6+ meses y monto variable):
   - Calcula PROMEDIO, MÍNIMO y MÁXIMO
   - Identifica la frecuencia
   - Cuenta el total de ocurrencias

CRÍTICO: Debes incluir el campo "monthsPresent" que indica en cuántos meses DIFERENTES aparece el gasto.

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
      "monthsPresent": número_de_meses_diferentes_donde_aparece (OBLIGATORIO, mínimo 6)
    }
  ]
}

IMPORTANTE: Si ningún gasto cumple los requisitos (6 meses Y monto variable >10%), responde: {"expenses": []}`
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
