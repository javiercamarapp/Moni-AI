import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { transactions } = await req.json();

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ subscriptions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar Lovable AI para detectar suscripciones
    const aiResponse = await fetch('https://api.lovable.app/v1/ai/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente financiero experto en detectar suscripciones y pagos recurrentes.
Analiza las transacciones y detecta:
1. Pagos con el mismo nombre/descripción que se repiten mensualmente
2. Montos similares que se cobran regularmente
3. Palabras clave de suscripciones comunes: Netflix, Spotify, Amazon, Disney, HBO, Gym, Internet, Luz, Agua, Gas, Teléfono, Seguros, etc.
4. Categorías típicas de gastos recurrentes

Responde ÚNICAMENTE con un JSON válido con este formato:
{
  "subscriptions": [
    {
      "description": "nombre del servicio",
      "amount": monto_promedio,
      "frequency": "mensual" | "quincenal" | "semanal",
      "categoryName": "nombre de categoría si está disponible"
    }
  ]
}

Si no detectas suscripciones, responde: {"subscriptions": []}`
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
      console.error('AI API error:', await aiResponse.text());
      return new Response(
        JSON.stringify({ subscriptions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{"subscriptions": []}';
    
    // Limpiar la respuesta para extraer solo el JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { subscriptions: [] };

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
