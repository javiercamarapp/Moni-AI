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
            content: `Eres un asistente financiero experto en detectar SUSCRIPCIONES con montos EXACTOS O CASI EXACTOS.

REGLA CRÍTICA: Solo incluye suscripciones donde el MONTO SEA EXACTO o casi igual (variación menor al 2%) y aparecen en AL MENOS 2 MESES DIFERENTES.

✅ INCLUYE ÚNICAMENTE SUSCRIPCIONES como:
- Streaming: Netflix, Spotify, Disney+, HBO Max, Amazon Prime, Apple Music, YouTube Premium
- Gimnasio y deportes (si el pago es EXACTO cada mes)
- Software y aplicaciones (Office 365, Adobe, iCloud, Dropbox, etc.)
- Servicios en línea con cargo mensual/anual FIJO
- Telefonía móvil con plan fijo (Telcel, AT&T, Movistar, Hotel Cell)
- Internet y TV de paga con tarifa fija (Telmex, Izzi, Totalplay)
- Seguros con pagos mensuales FIJOS
- Plataformas digitales con membresía

❌ NO INCLUYAS gastos fijos que NO son suscripciones:
- RENTA, RENTA MENSUAL, ALQUILER (es un gasto fijo, NO suscripción)
- HIPOTECA, CRÉDITO HIPOTECARIO
- COLEGIATURAS, INSCRIPCIONES

❌ NO INCLUYAS gastos variables:
- CFE, Luz, electricidad (MONTO VARIABLE)
- Agua, SACMEX (MONTO VARIABLE)
- Gas natural, gas LP (MONTO VARIABLE)
- Gasolina (MONTO VARIABLE)
- Supermercado (MONTO VARIABLE)
- Restaurantes, delivery (MONTO VARIABLE)
- Telefonía móvil con consumo variable
- Cualquier servicio donde el monto varía más del 2%

DETECCIÓN DE AUMENTOS DE PRECIO:
- Si detectas que una suscripción tiene un patrón donde el monto aumentó de forma consistente (ej: $99 → $129), marca como "priceIncrease": true
- Indica el "oldAmount" y "newAmount" para notificar al usuario

ANÁLISIS REQUERIDO:
1. Agrupa transacciones por descripción similar
2. Calcula la VARIABILIDAD del monto entre pagos
3. Si la variabilidad es MENOR al 2%, es MONTO EXACTO (suscripción)
4. Si detectas cambio de precio consistente, márca "priceIncrease": true
5. Cuenta en cuántos MESES DIFERENTES aparece
6. Para las que califican (2+ meses y monto exacto):
   - Calcula el monto PROMEDIO actual
   - Detecta la frecuencia

Responde ÚNICAMENTE con un JSON válido:
{
  "subscriptions": [
    {
      "description": "nombre limpio del servicio",
      "amount": monto_promedio_actual,
      "frequency": "mensual" | "quincenal" | "semanal",
      "categoryName": "categoría si disponible",
      "priceIncrease": true/false,
      "oldAmount": monto_anterior (solo si priceIncrease es true),
      "newAmount": monto_nuevo (solo si priceIncrease es true)
    }
  ]
}

Si NO detectas suscripciones con monto exacto, responde: {"subscriptions": []}`
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
