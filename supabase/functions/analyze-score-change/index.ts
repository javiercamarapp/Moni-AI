import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentScore, previousScore, components, previousComponents } = await req.json();

    const scoreChange = currentScore - previousScore;
    
    // Calcular cambios en componentes
    const componentChanges = {
      savings: components.savingsAndLiquidity - (previousComponents?.savingsAndLiquidity || 0),
      debt: components.debt - (previousComponents?.debt || 0),
      control: components.control - (previousComponents?.control || 0),
      growth: components.growth - (previousComponents?.growth || 0),
      behavior: components.behavior - (previousComponents?.behavior || 0)
    };

    // Identificar los cambios más significativos
    const significantChanges = Object.entries(componentChanges)
      .filter(([_, change]) => Math.abs(change) > 2)
      .sort(([_, a], [__, b]) => Math.abs(b) - Math.abs(a));

    const prompt = `Eres un asesor financiero experto analizando cambios en un score financiero.

Score actual: ${currentScore}/100
Score anterior: ${previousScore}/100
Cambio: ${scoreChange > 0 ? '+' : ''}${scoreChange} puntos

Cambios en componentes:
- Ahorro y Liquidez: ${componentChanges.savings > 0 ? '+' : ''}${componentChanges.savings} pts
- Manejo de Deudas: ${componentChanges.debt > 0 ? '+' : ''}${componentChanges.debt} pts
- Control de Gastos: ${componentChanges.control > 0 ? '+' : ''}${componentChanges.control} pts
- Crecimiento Patrimonial: ${componentChanges.growth > 0 ? '+' : ''}${componentChanges.growth} pts
- Hábitos Financieros: ${componentChanges.behavior > 0 ? '+' : ''}${componentChanges.behavior} pts

Explica en máximo 2 oraciones concretas y específicas por qué cambió el score. 
Menciona los 1-2 factores más importantes. 
Usa un tono amigable y motivador. 
No uses emojis.
Si el cambio es positivo, felicita brevemente.
Si es negativo, sé constructivo y sugiere una mejora específica.`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('VITE_SUPABASE_URL'),
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
    }

    const result = await openRouterResponse.json();
    const explanation = result.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ explanation }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error analyzing score change:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        explanation: scoreChange > 0 
          ? "Tu score mejoró gracias a mejores hábitos financieros." 
          : "Tu score disminuyó. Revisa tus gastos y ahorro para mejorarlo."
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
