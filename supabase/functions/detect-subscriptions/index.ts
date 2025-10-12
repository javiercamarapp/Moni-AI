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

    console.log('📥 Received transactions:', transactions?.length || 0);

    if (!transactions || transactions.length === 0) {
      console.log('⚠️ No transactions to analyze');
      return new Response(
        JSON.stringify({ subscriptions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar Lovable AI para detectar suscripciones
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    console.log('🔑 API Key present:', !!LOVABLE_API_KEY);

    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ subscriptions: [], error: 'API key not configured' }),
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
            content: `Eres un asistente financiero experto en detectar SUSCRIPCIONES con monto fijo.

REGLA CRÍTICA: Solo incluye suscripciones donde el MONTO ES CASI IGUAL cada vez (variación menor al 5%) y aparecen en AL MENOS 3 MESES DIFERENTES.

✅ INCLUYE (solo si hay 3+ meses y MONTO FIJO):
- Streaming: Netflix, Spotify, Disney+, HBO Max, Amazon Prime, Apple Music, YouTube Premium
- Gimnasio y deportes (si el pago es fijo cada mes)
- Software y aplicaciones (Office 365, Adobe, etc.)
- Servicios en línea con cargo fijo mensual
- Cualquier servicio donde el monto sea CONSISTENTE (±5%)

❌ NO INCLUYAS (son gastos cotidianos variables):
- CFE, Luz, electricidad (MONTO VARIABLE cada mes)
- Agua, SACMEX (MONTO VARIABLE)
- Gas natural, gas LP (MONTO VARIABLE)
- Gasolina (MONTO VARIABLE por consumo)
- Supermercado (MONTO VARIABLE)
- Restaurantes, delivery (MONTO VARIABLE)
- Cualquier servicio donde el monto VARÍA significativamente (>5%)

ANÁLISIS REQUERIDO:
1. Agrupa transacciones por descripción similar (ej: "Netflix oct", "Netflix nov" → "Netflix")
2. Calcula la VARIABILIDAD del monto entre pagos del mismo servicio
3. Si la variabilidad es MENOR al 5%, es MONTO FIJO (suscripción)
4. Si la variabilidad es MAYOR al 5%, NO es suscripción
5. Cuenta en cuántos MESES DIFERENTES aparece
6. DESCARTA suscripciones que aparezcan en menos de 3 meses diferentes
7. Para las que califican (3+ meses y monto fijo):
   - Calcula el monto PROMEDIO
   - Detecta la frecuencia

Responde ÚNICAMENTE con un JSON válido:
{
  "subscriptions": [
    {
      "description": "nombre limpio del servicio (SIN meses ni años)",
      "amount": monto_promedio,
      "frequency": "mensual" | "quincenal" | "semanal",
      "categoryName": "categoría si disponible"
    }
  ]
}

IMPORTANTE: Si ninguna suscripción cumple los requisitos (3 meses Y monto fijo), responde: {"subscriptions": []}`
          },
          {
            role: 'user',
            content: `Analiza estas transacciones de gastos y detecta suscripciones y pagos recurrentes:\n\n${JSON.stringify(transactions.map((t: any) => ({
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
        JSON.stringify({ subscriptions: [], error: `AI API error: ${aiResponse.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('🤖 AI Response:', JSON.stringify(aiData, null, 2));
    
    const content = aiData.choices?.[0]?.message?.content || '{"subscriptions": []}';
    console.log('📝 AI Content:', content);
    
    // Limpiar la respuesta para extraer solo el JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { subscriptions: [] };
    
    console.log('✅ Parsed subscriptions:', jsonResponse.subscriptions?.length || 0);

    return new Response(
      JSON.stringify(jsonResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error detecting subscriptions:', error);
    return new Response(
      JSON.stringify({ 
        subscriptions: [],
        error: error.message 
      }),
      { 
        status: 200, // Return 200 to avoid breaking the UI
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
