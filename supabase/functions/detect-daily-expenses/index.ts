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
            content: `Eres un asistente financiero experto en detectar GASTOS COTIDIANOS recurrentes con monto variable.

IMPORTANTE: Solo detecta SERVICIOS BÁSICOS y GASTOS RECURRENTES con MONTO VARIABLE.

✅ INCLUYE:
- CFE, Luz, electricidad (monto variable)
- Agua, SACMEX, servicios de agua (monto variable)
- Gas natural, gas LP (monto variable)
- Teléfono celular si tiene consumo variable
- Internet si tiene cargos variables
- Gasolina / combustible
- Comida / supermercado si es recurrente
- Transporte público

❌ NO INCLUYAS:
- Netflix, Spotify, Disney+ (son suscripciones de monto fijo)
- Servicios de streaming
- Gimnasios
- Software

Analiza las transacciones y:
1. Identifica servicios básicos recurrentes con MONTO VARIABLE
2. AGRUPA pagos del mismo servicio
3. Calcula PROMEDIO, MÍNIMO y MÁXIMO de cada servicio
4. Detecta la frecuencia

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
      "occurrences": número_de_veces_que_aparece
    }
  ]
}

Si no detectas gastos cotidianos, responde: {"expenses": []}`
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
